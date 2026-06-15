import { describe, it, expect } from 'bun:test';
import { Round, RoundStatus, Bet, BetStatus } from '../../../../src/domain/entities/round.entity';

describe('Round Entity', () => {
  it('should transition through states correctly', () => {
    const round = new Round('1', 'seed', 'salt', 2.0);
    expect(round.status).toBe(RoundStatus.WAITING_FOR_BETS);

    round.start();
    expect(round.status).toBe(RoundStatus.STARTING);

    round.beginProgress();
    expect(round.status).toBe(RoundStatus.IN_PROGRESS);

    round.updateMultiplier(1.5);
    expect(round.multiplier).toBe(1.5);
    expect(round.status).toBe(RoundStatus.IN_PROGRESS);

    round.updateMultiplier(2.0);
    expect(round.multiplier).toBe(2.0);
    expect(round.status).toBe(RoundStatus.CRASHED);
  });

  it('should not allow betting when not in WAITING_FOR_BETS', () => {
    const round = new Round('1', 'seed', 'salt', 2.0);
    round.start();
    
    const bet = new Bet('b1', 'p1', '1', 100n);
    expect(() => round.addBet(bet)).toThrow('Can only place bets during WAITING_FOR_BETS phase');
  });

  it('should calculate payout correctly on cashout', () => {
    const bet = new Bet('b1', 'p1', '1', 1000n);
    bet.cashOut(1.54);
    
    expect(bet.status).toBe(BetStatus.CASHED_OUT);
    expect(bet.cashOutMultiplier).toBe(1.54);
    expect(bet.payout).toBe(1540n);
  });
});
