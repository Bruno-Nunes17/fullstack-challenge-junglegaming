import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload, ClientProxy } from '@nestjs/microservices';
import { WalletService } from '../../application/services/wallet.service';
import { MessagingPatterns } from '@crash/contracts';
import type { DebitWalletDto, CreditWalletDto, WalletDebitedDto, WalletDebitFailedDto, WalletCreditedDto } from '@crash/contracts';

@Controller()
export class WalletsMessageController {
  constructor(
    private readonly walletService: WalletService,
    @Inject('GAMES_SERVICE')
    private readonly gamesClient: ClientProxy,
  ) {}

  @MessagePattern(MessagingPatterns.DEBIT_WALLET)
  async handleDebit(@Payload() data: DebitWalletDto): Promise<void> {
    try {
      await this.walletService.debit(data.playerId, BigInt(data.amount));
      const response: WalletDebitedDto = {
        playerId: data.playerId,
        betId: data.betId,
      };
      this.gamesClient.emit(MessagingPatterns.WALLET_DEBITED, response);
    } catch (error) {
      const response: WalletDebitFailedDto = {
        playerId: data.playerId,
        betId: data.betId,
        reason: error.message,
      };
      this.gamesClient.emit(MessagingPatterns.WALLET_DEBIT_FAILED, response);
    }
  }

  @MessagePattern(MessagingPatterns.CREDIT_WALLET)
  async handleCredit(@Payload() data: CreditWalletDto): Promise<void> {
    try {
      await this.walletService.credit(data.playerId, BigInt(data.amount));
      const response: WalletCreditedDto = {
        playerId: data.playerId,
        betId: data.betId,
      };
      this.gamesClient.emit(MessagingPatterns.WALLET_CREDITED, response);
    } catch (error) {
    }
  }
}
