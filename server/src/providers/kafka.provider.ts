import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaTestController } from './kafka-test.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'log-tracing-server',
              brokers: (configService.get<string>('KAFKA_BROKERS') || 'localhost:9092').split(','),
              sasl: configService.get<string>('KAFKA_USERNAME') ? {
                mechanism: 'plain',
                username: configService.get<string>('KAFKA_USERNAME'),
                password: configService.get<string>('KAFKA_PASSWORD'),
              } : undefined,
            },
            consumer: {
              groupId: 'log-tracing-consumer',
            },
          },
        }),
      },
    ]),
  ],
  controllers: [KafkaTestController],
  exports: [ClientsModule],
})
export class KafkaProvider { }
