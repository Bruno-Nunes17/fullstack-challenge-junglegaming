import { Wallet } from '../../../domain/entities/wallet.entity';
import { WalletOrmEntity } from '../entities/wallet.orm-entity';

export class WalletMapper {
  static toDomain(ormEntity: WalletOrmEntity): Wallet {
    return new Wallet(
      ormEntity.id,
      ormEntity.playerId,
      ormEntity.balance,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  static toOrm(domainEntity: Wallet): WalletOrmEntity {
    const ormEntity = new WalletOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.playerId = domainEntity.playerId;
    ormEntity.balance = domainEntity.balance;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
