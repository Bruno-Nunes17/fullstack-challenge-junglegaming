import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { I_WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Wallet } from '../../domain/entities/wallet.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @Inject(I_WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async onModuleInit() {
    await this.seedTestUserWallet();
  }

  private async seedTestUserWallet() {
    const testUserId = '40c4a889-29c5-45d3-8daf-c6ecdba7120d';
    try {
      const existingWallet = await this.walletRepository.findByPlayerId(testUserId);
      if (!existingWallet) {
        const wallet = Wallet.create(testUserId);
        wallet.credit(500000n); 
        await this.walletRepository.save(wallet);
        this.logger.log(`Seeded test user (player) wallet with initial balance of R$ 5000.00`);
      }
    } catch (e) {
      this.logger.error('Failed to seed test user wallet', e);
    }
  }
}
