import { Inject, Injectable, Logger } from '@nestjs/common';
import { I_WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { Wallet } from '../../domain/entities/wallet.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @Inject(I_WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async getOrCreateWallet(playerId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) {
      wallet = Wallet.create(playerId);
      await this.walletRepository.save(wallet);
      this.logger.log(`Created new wallet for player ${playerId}`);
    }
    return wallet;
  }

  async credit(playerId: string, amount: bigint): Promise<void> {
    const wallet = await this.getOrCreateWallet(playerId);
    wallet.credit(amount);
    await this.walletRepository.save(wallet);
  }

  async debit(playerId: string, amount: bigint): Promise<void> {
    const wallet = await this.getOrCreateWallet(playerId);
    wallet.debit(amount);
    await this.walletRepository.save(wallet);
  }

  async getBalance(playerId: string): Promise<bigint> {
    const wallet = await this.getOrCreateWallet(playerId);
    return wallet.balance;
  }
}
