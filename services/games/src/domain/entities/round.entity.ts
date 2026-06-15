export enum RoundStatus {
  WAITING_FOR_BETS = 'WAITING_FOR_BETS',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  CRASHED = 'CRASHED',
}

export class Round {
  constructor(
    public readonly id: string,
    public readonly serverSeed: string,
    public readonly clientSeed: string,
    public readonly crashPoint: number,
    private _status: RoundStatus = RoundStatus.WAITING_FOR_BETS,
    private _multiplier: number = 1.0,
    public readonly createdAt: Date = new Date(),
    public readonly bets: Bet[] = [],
  ) {}

  get status(): RoundStatus {
    return this._status;
  }

  get multiplier(): number {
    return this._multiplier;
  }

  public start(): void {
    if (this._status !== RoundStatus.WAITING_FOR_BETS) {
      throw new Error('Round must be in WAITING_FOR_BETS status to start');
    }
    this._status = RoundStatus.STARTING;
  }

  public beginProgress(): void {
    if (this._status !== RoundStatus.STARTING) {
      throw new Error('Round must be in STARTING status to begin progress');
    }
    this._status = RoundStatus.IN_PROGRESS;
  }

  public updateMultiplier(multiplier: number): void {
    if (this._status !== RoundStatus.IN_PROGRESS) {
      throw new Error('Can only update multiplier when round is IN_PROGRESS');
    }
    if (multiplier >= this.crashPoint) {
      this._multiplier = this.crashPoint;
      this._status = RoundStatus.CRASHED;
    } else {
      this._multiplier = multiplier;
    }
  }

  public addBet(bet: Bet): void {
    if (this._status !== RoundStatus.WAITING_FOR_BETS) {
      throw new Error('Can only place bets during WAITING_FOR_BETS phase');
    }
    if (this.bets.some(b => b.playerId === bet.playerId)) {
      throw new Error('Player already has a bet in this round');
    }
    this.bets.push(bet);
  }
}

export enum BetStatus {
  PENDING = 'PENDING',
  CASHED_OUT = 'CASHED_OUT',
  LOST = 'LOST',
}

export class Bet {
  constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly roundId: string,
    public readonly amount: bigint,
    private _status: BetStatus = BetStatus.PENDING,
    private _cashOutMultiplier?: number,
    private _payout?: bigint,
  ) {}

  get status(): BetStatus {
    return this._status;
  }

  get cashOutMultiplier(): number | undefined {
    return this._cashOutMultiplier;
  }

  get payout(): bigint | undefined {
    return this._payout;
  }

  public cashOut(multiplier: number): void {
    if (this._status !== BetStatus.PENDING) {
      throw new Error('Bet is already settled');
    }
    this._status = BetStatus.CASHED_OUT;
    this._cashOutMultiplier = multiplier;
    this._payout = (this.amount * BigInt(Math.floor(multiplier * 100))) / 100n;
  }

  public lose(): void {
    if (this._status !== BetStatus.PENDING) {
      throw new Error('Bet is already settled');
    }
    this._status = BetStatus.LOST;
    this._payout = 0n;
  }
}
