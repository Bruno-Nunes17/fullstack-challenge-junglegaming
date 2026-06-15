import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Crash Game - Game Service')
    .setDescription('API for managing game rounds and bets')
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
      queue: 'games_queue',
      queueOptions: {
        durable: false
      },
    },
  });

  const port = process.env.PORT || 4001;
  await app.startAllMicroservices();
  await app.listen(port);
  
  Logger.log(`Game Service is running on: http://localhost:${port}`);
  Logger.log(`Game Service Microservice is listening on RabbitMQ`);
  Logger.log(`Game Service Docs: http://localhost:${port}/docs`);
}
bootstrap();
