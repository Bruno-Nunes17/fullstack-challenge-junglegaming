import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagingPatterns } from '@crash/contracts';
import type { WalletDebitedDto, WalletDebitFailedDto, WalletCreditedDto } from '@crash/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { BetOrmEntity } from '../../infrastructure/persistence/entities/bet.orm-entity';
import { Repository } from 'typeorm';
import { BetStatus } from '../../domain/entities/round.entity';
import { GamesGateway } from '../gateways/games.gateway';

@Controller()
export class GamesMessageController {
  private readonly logger = new Logger(GamesMessageController.name);

  constructor(
    @InjectRepository(BetOrmEntity)
    private readonly betRepository: Repository<BetOrmEntity>,
    private readonly gateway: GamesGateway,
  ) {}

  @MessagePattern(MessagingPatterns.WALLET_DEBITED)
  async handleWalletDebited(@Payload() data: WalletDebitedDto) {
    this.logger.log(`Wallet debited for bet ${data.betId}`);
    this.gateway.broadcast('balance_updated', { playerId: data.playerId });
  }

  @MessagePattern(MessagingPatterns.WALLET_CREDITED)
  async handleWalletCredited(@Payload() data: WalletCreditedDto) {
    this.logger.log(`Wallet credited for bet ${data.betId}`);
    this.gateway.broadcast('balance_updated', { playerId: data.playerId });
  }

  @MessagePattern(MessagingPatterns.WALLET_DEBIT_FAILED)
  async handleWalletDebitFailed(@Payload() data: WalletDebitFailedDto) {
    this.logger.warn(`Wallet debit failed for bet ${data.betId}: ${data.reason}`);
    
    const bet = await this.betRepository.findOne({ where: { id: data.betId } });
    if (bet) {
      bet.status = BetStatus.LOST;
      await this.betRepository.save(bet);
    }
  }
}
