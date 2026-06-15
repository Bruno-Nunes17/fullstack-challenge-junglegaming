import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('wallets')
export class WalletOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'player_id', unique: true })
  @Index()
  playerId: string;

  @Column('bigint', {
    transformer: {
      to: (value: bigint) => value.toString(),
      from: (value: string) => BigInt(value),
    },
  })
  balance: bigint;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
