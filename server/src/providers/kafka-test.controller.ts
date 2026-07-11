import { Controller, Post, Body, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';

@Controller('kafka-test')
export class KafkaTestController implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }

  @Post()
  async sendTestEvent(@Body() body: any) {
    const payload = {
      message: body.message || 'Hello from NestJS!',
      timestamp: new Date().toISOString(),
    };
    
    // Emit an event to Kafka topic 'raw-logs'
    this.kafkaClient.emit('raw-logs', JSON.stringify(payload));
    
    return {
      success: true,
      message: 'Event emitted to Kafka topic raw-logs',
      payload,
    };
  }

  // Consumer: Listen to 'raw-logs' topic
  // @EventPattern('raw-logs')
  // handleRawLogs(@Payload() data: any) {
  //   console.log('📬 Received event from Kafka topic raw-logs:', data);
  // }
}
