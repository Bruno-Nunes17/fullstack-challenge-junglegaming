import { describe, it, expect } from 'bun:test';
import { Wallet } from '../../../../src/domain/entities/wallet.entity';

describe('Wallet Entity', () => {
  it('should create a new wallet with zero balance', () => {
    const playerId = 'player-1';
    const wallet = Wallet.create(playerId);

    expect(wallet.playerId).toBe(playerId);
    expect(wallet.balance).toBe(0n);
    expect(wallet.id).toBeDefined();
  });

  it('should credit amount to balance', () => {
    const wallet = Wallet.create('player-1');
    wallet.credit(100n);
    expect(wallet.balance).toBe(100n);

    wallet.credit(50n);
    expect(wallet.balance).toBe(150n);
  });

  it('should throw error when crediting zero or negative amount', () => {
    const wallet = Wallet.create('player-1');
    expect(() => wallet.credit(0n)).toThrow('Credit amount must be positive');
    expect(() => wallet.credit(-10n)).toThrow('Credit amount must be positive');
  });

  it('should debit amount from balance', () => {
    const wallet = Wallet.create('player-1');
    wallet.credit(100n);
    wallet.debit(30n);
    expect(wallet.balance).toBe(70n);
  });

  it('should throw error when debiting more than balance', () => {
    const wallet = Wallet.create('player-1');
    wallet.credit(50n);
    expect(() => wallet.debit(60n)).toThrow('Insufficient balance');
  });

  it('should throw error when debiting zero or negative amount', () => {
    const wallet = Wallet.create('player-1');
    wallet.credit(100n);
    expect(() => wallet.debit(0n)).toThrow('Debit amount must be positive');
    expect(() => wallet.debit(-10n)).toThrow('Debit amount must be positive');
  });
});
