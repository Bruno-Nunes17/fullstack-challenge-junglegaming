import { Controller, Get, Post, Body, UseGuards, Inject, BadRequestException, Param, Query } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GameLoopService } from "../../application/services/game-loop.service";
import { CurrentUser } from "../decorators/user.decorator";
import type { UserPayload } from "../decorators/user.decorator";
import { PlaceBetDto } from "../dtos/place-bet.dto";
import { RoundStatus, BetStatus } from "../../domain/entities/round.entity";
import { ClientProxy } from "@nestjs/microservices";
import { MessagingPatterns } from "@crash/contracts";
import type { DebitWalletDto } from "@crash/contracts";
import { InjectRepository } from "@nestjs/typeorm";
import { BetOrmEntity } from "../../infrastructure/persistence/entities/bet.orm-entity";
import { RoundOrmEntity } from "../../infrastructure/persistence/entities/round.orm-entity";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { GamesGateway } from "../gateways/games.gateway";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@Controller("games")
export class GamesController {
  constructor(
    private readonly gameLoopService: GameLoopService,
    @Inject('WALLET_SERVICE')
    private readonly walletClient: ClientProxy,
    @InjectRepository(BetOrmEntity)
    private readonly betRepository: Repository<BetOrmEntity>,
    @InjectRepository(RoundOrmEntity)
    private readonly roundRepository: Repository<RoundOrmEntity>,
    private readonly gateway: GamesGateway,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Get("rounds/current")
  getCurrentRound() {
    const round = this.gameLoopService.getCurrentRound();
    if (!round) return { status: 'NO_ROUND' };
    
    return {
      id: round.id,
      status: round.status,
      multiplier: round.multiplier,
      createdAt: round.createdAt,
    };
  }

  @Get("rounds/history")
  async getRoundsHistory(@Query('limit') limit = 20) {
    return this.roundRepository.find({
      where: { status: RoundStatus.CRASHED },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
    });
  }

  @Get("rounds/:roundId/verify")
  async verifyRound(@Param('roundId') roundId: string) {
    const round = await this.roundRepository.findOne({ where: { id: roundId } });
    if (!round) throw new BadRequestException('Round not found');
    if (round.status !== RoundStatus.CRASHED) {
      throw new BadRequestException('Round not finished yet');
    }

    return {
      id: round.id,
      serverSeed: round.serverSeed,
      clientSeed: round.clientSeed,
      crashPoint: round.crashPoint,
    };
  }

  @Get("bets/me")
  @UseGuards(AuthGuard('jwt'))
  async getMyBets(@CurrentUser() user: UserPayload, @Query('limit') limit = 20) {
    return this.betRepository.find({
      where: { playerId: user.userId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
    });
  }

  @Post("bet")
  @UseGuards(AuthGuard('jwt'))
  async placeBet(@CurrentUser() user: UserPayload, @Body() dto: PlaceBetDto) {
    const round = this.gameLoopService.getCurrentRound();
    
    if (!round || round.status !== RoundStatus.WAITING_FOR_BETS) {
      throw new BadRequestException('Can only place bets during waiting phase');
    }

    const existingBet = await this.betRepository.findOne({ 
      where: { playerId: user.userId, roundId: round.id } 
    });
    if (existingBet) {
      throw new BadRequestException('Player already has a bet in this round');
    }

    const amountInCents = BigInt(Math.floor(dto.amount * 100));
    const betId = randomUUID();

    const betOrm = new BetOrmEntity();
    betOrm.id = betId;
    betOrm.playerId = user.userId;
    betOrm.roundId = round.id;
    betOrm.amount = amountInCents;
    betOrm.status = BetStatus.PENDING;
    await this.betRepository.save(betOrm);

    this.gateway.broadcast('bet_placed', {
      playerId: user.userId,
      username: user.username,
      amount: dto.amount,
      betId: betId,
    });

    const payload: DebitWalletDto = {
      playerId: user.userId,
      amount: amountInCents.toString(),
      betId: betId,
      roundId: round.id,
    };

    this.walletClient.emit(MessagingPatterns.DEBIT_WALLET, payload);

    return { betId, status: 'PENDING' };
  }

  @Post("bet/cashout")
  @UseGuards(AuthGuard('jwt'))
  async cashOut(@CurrentUser() user: UserPayload) {
    const round = this.gameLoopService.getCurrentRound();
    if (!round || round.status !== RoundStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only cash out when round is in progress');
    }

    const bet = await this.betRepository.findOne({
      where: { playerId: user.userId, roundId: round.id, status: BetStatus.PENDING }
    });

    if (!bet) {
      throw new BadRequestException('No pending bet found for this round');
    }

    const currentMultiplier = round.multiplier;
    const payout = (bet.amount * BigInt(Math.floor(currentMultiplier * 100))) / 100n;

    bet.status = BetStatus.CASHED_OUT;
    bet.cashOutMultiplier = currentMultiplier;
    bet.payout = payout;
    await this.betRepository.save(bet);

    this.gateway.broadcast('bet_cashed_out', {
      playerId: user.userId,
      username: user.username,
      multiplier: currentMultiplier,
      payout: payout.toString(),
      betId: bet.id,
    });

    this.walletClient.emit(MessagingPatterns.CREDIT_WALLET, {
      playerId: user.userId,
      amount: payout.toString(),
      betId: bet.id,
    });

    return { 
      status: 'CASHED_OUT', 
      multiplier: currentMultiplier, 
      payout: payout.toString() 
    };
  }
}
