import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round, RoundStatus } from '../../domain/entities/round.entity';
import { RoundOrmEntity } from '../../infrastructure/persistence/entities/round.orm-entity';
import { ProvablyFairService } from '../../domain/services/provably-fair.service';
import { randomUUID } from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import { GamesGateway } from '../../presentation/gateways/games.gateway';

@Injectable()
export class GameLoopService implements OnModuleInit {
  private readonly logger = new Logger(GameLoopService.name);
  private currentRound: Round | null = null;
  private gameInterval: Timer | null = null;

  constructor(
    @InjectRepository(RoundOrmEntity)
    private readonly roundRepository: Repository<RoundOrmEntity>,
    private readonly provablyFairService: ProvablyFairService,
    @Inject('WALLET_SERVICE')
    private readonly walletClient: ClientProxy,
    private readonly gateway: GamesGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('Game Loop Service initialized');
    await this.startNewCycle();
  }

  private async startNewCycle() {
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

    setTimeout(() => this.startRound(), 10000);
  }

  private async startRound() {
    if (!this.currentRound) return;

    this.currentRound.start();
    await this.saveRound();
    this.logger.log(`Round ${this.currentRound.id} - Starting...`);

    this.gateway.broadcast('round_starting', {
      id: this.currentRound.id,
      duration: 2000,
    });

    setTimeout(() => this.beginProgress(), 2000);
  }

  private async beginProgress() {
    if (!this.currentRound) return;

    this.currentRound.beginProgress();
    await this.saveRound();
    this.logger.log(`Round ${this.currentRound.id} - In Progress!`);

    this.gateway.broadcast('round_progress_start', {
      id: this.currentRound.id,
    });

    const startTime = Date.now();
    this.gameInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newMultiplier = Math.floor(Math.pow(Math.E, 0.06 * elapsed) * 100) / 100;

      try {
        this.currentRound!.updateMultiplier(newMultiplier);
        
        this.gateway.broadcast('multiplier_update', { 
          multiplier: this.currentRound!.multiplier 
        });

        if (this.currentRound!.status === RoundStatus.CRASHED) {
          this.endRound();
        }
      } catch (e) {
        this.logger.error('Error updating multiplier', e);
        this.endRound();
      }
    }, 100);
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
