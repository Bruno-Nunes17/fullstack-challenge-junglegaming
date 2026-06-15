import { randomUUID } from 'crypto';

export class Wallet {
  constructor(
    public readonly id: string,
    public readonly playerId: string,
    private _balance: bigint,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  get balance(): bigint {
    return this._balance;
  }

  public static create(playerId: string): Wallet {
    return new Wallet(randomUUID(), playerId, 100000n);
  }

  public credit(amount: bigint): void {
    if (amount <= 0n) {
      throw new Error('Credit amount must be positive');
    }
    this._balance += amount;
  }

  public debit(amount: bigint): void {
    if (amount <= 0n) {
      throw new Error('Debit amount must be positive');
    }
    if (this._balance < amount) {
      throw new Error('Insufficient balance');
    }
    this._balance -= amount;
  }
}
