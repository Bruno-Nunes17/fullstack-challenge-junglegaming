import { Wallet } from '../entities/wallet.entity';

export interface IWalletRepository {
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
}

export const I_WALLET_REPOSITORY = 'I_WALLET_REPOSITORY';
