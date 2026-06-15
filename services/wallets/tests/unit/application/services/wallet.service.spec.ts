import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { WalletService } from '../../../../src/application/services/wallet.service';
import { Wallet } from '../../../../src/domain/entities/wallet.entity';
import { IWalletRepository } from '../../../../src/domain/repositories/wallet.repository.interface';

describe('WalletService', () => {
  let service: WalletService;
  let repository: IWalletRepository;

  beforeEach(() => {
    repository = {
      findByPlayerId: mock(async (id: string) => null),
      save: mock(async (wallet: Wallet) => {}),
    } as unknown as IWalletRepository;
    service = new WalletService(repository);
  });

  it('should create a wallet if it does not exist', async () => {
    const playerId = 'p1';
    const wallet = await service.getOrCreateWallet(playerId);

    expect(wallet.playerId).toBe(playerId);
    expect(repository.findByPlayerId).toHaveBeenCalledWith(playerId);
    expect(repository.save).toHaveBeenCalled();
  });

  it('should credit amount to player wallet', async () => {
    const playerId = 'p1';
    const initialWallet = Wallet.create(playerId);
    repository.findByPlayerId = mock(async () => initialWallet);

    await service.credit(playerId, 100n);

    expect(initialWallet.balance).toBe(100n);
    expect(repository.save).toHaveBeenCalledWith(initialWallet);
  });

  it('should throw error if debit amount is more than balance', async () => {
    const playerId = 'p1';
    const initialWallet = Wallet.create(playerId);
    initialWallet.credit(50n);
    repository.findByPlayerId = mock(async () => initialWallet);

    expect(service.debit(playerId, 100n)).rejects.toThrow('Insufficient balance');
  });
});
