import { Entity, Column, PrimaryColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { RoundStatus } from '../../../domain/entities/round.entity';
import type { BetOrmEntity } from './bet.orm-entity';

@Entity('rounds')
export class RoundOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  serverSeed: string;

  @Column()
  clientSeed: string;

  @Column('float')
  crashPoint: number;

  @Column({
    type: 'enum',
    enum: RoundStatus,
    default: RoundStatus.WAITING_FOR_BETS,
  })
  status: RoundStatus;

  @Column('float', { default: 1.0 })
  multiplier: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany('BetOrmEntity', (bet: BetOrmEntity) => bet.round)
  bets: BetOrmEntity[];
}
