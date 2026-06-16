import { describe, it, expect } from 'bun:test';
import { Wallet } from '../../../../src/domain/entities/wallet.entity';

describe('Wallet Entity', () => {
  it('should create a new wallet with initial balance of 1000.00', () => {
    const playerId = 'player-1';
    const wallet = Wallet.create(playerId);

    expect(wallet.playerId).toBe(playerId);
    expect(wallet.balance).toBe(100000n);
    expect(wallet.id).toBeDefined();
  });

  it('should credit amount to balance', () => {
    const wallet = Wallet.create('player-1');
    const initialBalance = wallet.balance;
    wallet.credit(100n);
    expect(wallet.balance).toBe(initialBalance + 100n);

    wallet.credit(50n);
    expect(wallet.balance).toBe(initialBalance + 150n);
  });

  it('should throw error when crediting zero or negative amount', () => {
    const wallet = Wallet.create('player-1');
    expect(() => wallet.credit(0n)).toThrow('Credit amount must be positive');
    expect(() => wallet.credit(-10n)).toThrow('Credit amount must be positive');
  });

  it('should debit amount from balance', () => {
    const wallet = Wallet.create('player-1');
    const initialBalance = wallet.balance;
    wallet.debit(30n);
    expect(wallet.balance).toBe(initialBalance - 30n);
  });

  it('should throw error when debiting more than balance', () => {
    const wallet = Wallet.create('player-1');
    const tooMuch = wallet.balance + 1n;
    expect(() => wallet.debit(tooMuch)).toThrow('Insufficient balance');
  });

  it('should throw error when debiting zero or negative amount', () => {
    const wallet = Wallet.create('player-1');
    expect(() => wallet.debit(0n)).toThrow('Debit amount must be positive');
    expect(() => wallet.debit(-10n)).toThrow('Debit amount must be positive');
  });
});
