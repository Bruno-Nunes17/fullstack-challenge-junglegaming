import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { GamesController } from "./presentation/controllers/games.controller";
import { GamesMessageController } from "./presentation/controllers/games.message.controller";
import { JwtStrategy } from "./infrastructure/auth/jwt.strategy";
import { ProvablyFairService } from "./domain/services/provably-fair.service";
import { RoundOrmEntity } from "./infrastructure/persistence/entities/round.orm-entity";
import { BetOrmEntity } from "./infrastructure/persistence/entities/bet.orm-entity";
import { GameLoopService } from "./application/services/game-loop.service";
import { GamesGateway } from "./presentation/gateways/games.gateway";

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
        entities: [RoundOrmEntity, BetOrmEntity],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([RoundOrmEntity, BetOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.registerAsync([
      {
        name: 'WALLET_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin@localhost:5672'],
            queue: 'wallets_queue',
            queueOptions: {
              durable: false
            },
          },
        }),
      },
    ]),
  ],
  controllers: [GamesController, GamesMessageController],
  providers: [JwtStrategy, ProvablyFairService, GameLoopService, GamesGateway],
})
export class AppModule {}
