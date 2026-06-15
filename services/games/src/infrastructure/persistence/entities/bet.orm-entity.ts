import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { BetStatus } from '../../../domain/entities/round.entity';
import type { RoundOrmEntity } from './round.orm-entity';

@Entity('bets')
export class BetOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'player_id' })
  @Index()
  playerId: string;

  @Column({ name: 'round_id' })
  @Index()
  roundId: string;

  @ManyToOne('RoundOrmEntity', (round: RoundOrmEntity) => round.bets)
  round: RoundOrmEntity;

  @Column('bigint', {
    transformer: {
      to: (value: bigint) => value.toString(),
      from: (value: string) => BigInt(value),
    },
  })
  amount: bigint;

  @Column({
    type: 'enum',
    enum: BetStatus,
    default: BetStatus.PENDING,
  })
  status: BetStatus;

  @Column('float', { nullable: true })
  cashOutMultiplier: number;

  @Column('bigint', {
    nullable: true,
    transformer: {
      to: (value: bigint | null) => value?.toString(),
      from: (value: string | null) => (value ? BigInt(value) : null),
    },
  })
  payout: bigint;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
