import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWalletRepository } from '../../../domain/repositories/wallet.repository.interface';
import { Wallet } from '../../../domain/entities/wallet.entity';
import { WalletOrmEntity } from '../entities/wallet.orm-entity';
import { WalletMapper } from '../mappers/wallet.mapper';

@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(
    @InjectRepository(WalletOrmEntity)
    private readonly repository: Repository<WalletOrmEntity>,
  ) {}

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const ormEntity = await this.repository.findOne({ where: { playerId } });
    return ormEntity ? WalletMapper.toDomain(ormEntity) : null;
  }

  async save(wallet: Wallet): Promise<void> {
    const ormEntity = WalletMapper.toOrm(wallet);
    await this.repository.save(ormEntity);
  }
}
