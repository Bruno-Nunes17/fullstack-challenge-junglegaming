import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { WalletsMessageController } from "./presentation/controllers/wallets.message.controller";
import { WalletOrmEntity } from "./infrastructure/persistence/entities/wallet.orm-entity";
import { WalletRepository } from "./infrastructure/persistence/repositories/wallet.repository";
import { I_WALLET_REPOSITORY } from "./domain/repositories/wallet.repository.interface";
import { WalletService } from "./application/services/wallet.service";
import { SeederService } from "./application/services/seeder.service";
import { JwtStrategy } from "./infrastructure/auth/jwt.strategy";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [WalletOrmEntity],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([WalletOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.registerAsync([
      {
        name: 'GAMES_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin@localhost:5672'],
            queue: 'games_queue',
            queueOptions: {
              durable: false
            },
          },
        }),
      },
    ]),
  ],
  controllers: [WalletsController, WalletsMessageController],
  providers: [
    WalletService,
    SeederService,
    {
      provide: I_WALLET_REPOSITORY,
      useClass: WalletRepository,
    },
    JwtStrategy,
  ],
})
export class AppModule {}
