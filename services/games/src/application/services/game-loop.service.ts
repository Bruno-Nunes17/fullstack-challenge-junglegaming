import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Round, RoundStatus, BetStatus } from '../../domain/entities/round.entity';
import { RoundOrmEntity } from '../../infrastructure/persistence/entities/round.orm-entity';
import { BetOrmEntity } from '../../infrastructure/persistence/entities/bet.orm-entity';
import { ProvablyFairService } from '../../domain/services/provably-fair.service';
import { randomUUID } from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import { GamesGateway } from '../../presentation/gateways/games.gateway';
import { MessagingPatterns } from '@crash/contracts';

@Injectable()
export class GameLoopService implements OnModuleInit {
  private readonly logger = new Logger(GameLoopService.name);
  private currentRound: Round | null = null;
  private gameInterval: Timer | null = null;
  private phaseTimeout: Timer | null = null;

  constructor(
    @InjectRepository(RoundOrmEntity)
    private readonly roundRepository: Repository<RoundOrmEntity>,
    @InjectRepository(BetOrmEntity)
    private readonly betRepository: Repository<BetOrmEntity>,
    private readonly provablyFairService: ProvablyFairService,
    @Inject('WALLET_SERVICE')
    private readonly walletClient: ClientProxy,
    private readonly gateway: GamesGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('Game Loop Service initialized');
    await this.startNewCycle();
  }

  private clearTimers() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }
  }

  private async startNewCycle() {
    this.clearTimers();
    
    const serverSeed = this.provablyFairService.generateRandomSeed();
    const clientSeed = 'fixed-salt';
    const crashPoint = this.provablyFairService.calculateCrashPoint(serverSeed, clientSeed);

    this.currentRound = new Round(
      randomUUID(),
      serverSeed,
      clientSeed,
      crashPoint,
      RoundStatus.WAITING_FOR_BETS,
      1.0
    );

    await this.saveRound();
    this.logger.log(`New Round ${this.currentRound.id} - Waiting for bets... (Crash Point: ${crashPoint})`);

    this.gateway.broadcast('round_waiting', {
      id: this.currentRound.id,
      duration: 10000,
      serverSeedHash: this.provablyFairService.hashSeed(serverSeed),
    });

    this.phaseTimeout = setTimeout(() => this.startRound(), 10000);
  }

  private async startRound() {
    if (!this.currentRound || this.currentRound.status !== RoundStatus.WAITING_FOR_BETS) return;

    this.currentRound.start();
    await this.saveRound();
    this.logger.log(`Round ${this.currentRound.id} - Starting...`);

    this.gateway.broadcast('round_starting', {
      id: this.currentRound.id,
      duration: 2000,
    });

    this.phaseTimeout = setTimeout(() => this.beginProgress(), 2000);
  }

  private async beginProgress() {
    if (!this.currentRound || this.currentRound.status !== RoundStatus.STARTING) return;

    this.currentRound.beginProgress();
    await this.saveRound();
    this.logger.log(`Round ${this.currentRound.id} - In Progress!`);

    this.gateway.broadcast('round_progress_start', {
      id: this.currentRound.id,
    });

    const startTime = Date.now();
    this.gameInterval = setInterval(async () => {
      if (!this.currentRound || this.currentRound.status !== RoundStatus.IN_PROGRESS) return;

      const elapsed = (Date.now() - startTime) / 1000;
      const newMultiplier = Math.floor(Math.pow(Math.E, 0.06 * elapsed) * 100) / 100;

      try {
        this.currentRound.updateMultiplier(newMultiplier);
        
        this.gateway.broadcast('multiplier_update', { 
          multiplier: this.currentRound.multiplier 
        });

        await this.processAutoCashouts(this.currentRound.multiplier);

        if (this.currentRound.status === RoundStatus.CRASHED) {
          this.endRound();
        }
      } catch (e) {
        this.logger.error('Error updating multiplier', e);
        this.endRound();
      }
    }, 100);
  }

  private async processAutoCashouts(multiplier: number) {
    if (!this.currentRound) return;

    const betsToAutoCashout = await this.betRepository.find({
      where: {
        roundId: this.currentRound.id,
        status: BetStatus.PENDING,
        autoCashoutMultiplier: LessThanOrEqual(multiplier),
      }
    });

    for (const bet of betsToAutoCashout) {
      try {
        const targetMultiplier = bet.autoCashoutMultiplier;
        const payout = (bet.amount * BigInt(Math.floor(targetMultiplier * 100))) / 100n;

        bet.status = BetStatus.CASHED_OUT;
        bet.cashOutMultiplier = targetMultiplier;
        bet.payout = payout;
        await this.betRepository.save(bet);

        this.gateway.broadcast('bet_cashed_out', {
          playerId: bet.playerId,
          multiplier: targetMultiplier,
          payout: payout.toString(),
          betId: bet.id,
        });

        this.walletClient.emit(MessagingPatterns.CREDIT_WALLET, {
          playerId: bet.playerId,
          amount: payout.toString(),
          betId: bet.id,
        });

        this.logger.log(`Auto Cashout triggered for player ${bet.playerId} at ${targetMultiplier}x`);
      } catch (e) {
        this.logger.error(`Failed to process auto cashout for bet ${bet.id}`, e);
      }
    }
  }

  private async endRound() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    if (!this.currentRound) return;

    await this.saveRound();
    this.logger.log(`Round ${this.currentRound.id} - CRASHED at ${this.currentRound.multiplier}x`);

    this.gateway.broadcast('round_crashed', {
      id: this.currentRound.id,
      multiplier: this.currentRound.multiplier,
      serverSeed: this.currentRound.serverSeed,
    });

    await this.roundRepository.query(
      `UPDATE bets SET status = 'LOST', payout = '0' WHERE round_id = $1 AND status = 'PENDING'`,
      [this.currentRound.id]
    );

    setTimeout(() => this.startNewCycle(), 5000);
  }

  private async saveRound() {
    if (!this.currentRound) return;
    
    const ormEntity = new RoundOrmEntity();
    ormEntity.id = this.currentRound.id;
    ormEntity.serverSeed = this.currentRound.serverSeed;
    ormEntity.clientSeed = this.currentRound.clientSeed;
    ormEntity.crashPoint = this.currentRound.crashPoint;
    ormEntity.status = this.currentRound.status;
    ormEntity.multiplier = this.currentRound.multiplier;
    ormEntity.createdAt = this.currentRound.createdAt;

    await this.roundRepository.save(ormEntity);
  }

  public getCurrentRound(): Round | null {
    return this.currentRound;
  }
}
