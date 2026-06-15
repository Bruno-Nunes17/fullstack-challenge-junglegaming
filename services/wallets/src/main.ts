import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  const config = new DocumentBuilder()
    .setTitle('Crash Game - Wallet Service')
    .setDescription('API for managing player wallets')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue: 'wallets_queue',
      queueOptions: {
        durable: false
      },
    },
  });

  const port = process.env.PORT || 4002;
  await app.startAllMicroservices();
  await app.listen(port);
  
  Logger.log(`Wallet Service is running on: http://localhost:${port}`);
  Logger.log(`Wallet Service Microservice is listening on RabbitMQ`);
  Logger.log(`Wallet Service Docs: http://localhost:${port}/docs`);
}
bootstrap();
