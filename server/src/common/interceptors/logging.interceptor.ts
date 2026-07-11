import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ClientKafka } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const startTime = Date.now();
    const request_id = request.headers['x-request-id'] || uuidv4();
    const method = request.method;
    const path = request.originalUrl || request.url;
    let client_ip = '';
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      client_ip = typeof xForwardedFor === 'string' 
        ? xForwardedFor.split(',')[0].trim() 
        : xForwardedFor[0];
    } else {
      client_ip = request.headers['x-real-ip'] || request.ip || request.socket?.remoteAddress || request.connection?.remoteAddress || '';
    }
    
    // Normalize localhost IPv6 to IPv4 loopback
    if (client_ip === '::1') {
      client_ip = '127.0.0.1';
    } else if (client_ip.startsWith('::ffff:')) {
      client_ip = client_ip.substring(7);
    }

    const user_agent = request.headers['user-agent'] || '';

    // Assign requestId to request so other parts of the app can use it if needed
    request['request_id'] = request_id;

    return next.handle().pipe(
      tap({
        next: () => this.logResponse(request_id, method, path, client_ip, user_agent, startTime, response.statusCode),
        error: (err) => {
          const status = err.status || 500;
          this.logResponse(request_id, method, path, client_ip, user_agent, startTime, status);
        },
      }),
    );
  }

  private logResponse(
    request_id: string,
    method: string,
    path: string,
    client_ip: string,
    user_agent: string,
    startTime: number,
    status_code: number,
  ) {
    const latency_ms = Date.now() - startTime;
    
    const event_time = new Date().toISOString();
    const raw_message = `${event_time} ${client_ip} ${method} ${path} ${status_code}`;
    
    let statusGroup = "Unknown";
    let isError = 0;
    
    if (status_code >= 200 && status_code < 300) {
      statusGroup = "2xx";
    } else if (status_code >= 300 && status_code < 400) {
      statusGroup = "3xx";
    } else if (status_code >= 400 && status_code < 500) {
      statusGroup = "4xx";
      isError = 1;
    } else if (status_code >= 500) {
      statusGroup = "5xx";
      isError = 1;
    }

    const payload = {
      event_time,
      request_id,
      service_name: 'nestjs-api',
      client_ip,
      method,
      path,
      status_code,
      latency_ms,
      user_agent,
      raw_message,
    };

    // Emit to Kafka raw-logs topic
    this.kafkaClient.emit('raw-logs', JSON.stringify(payload)).subscribe({
      error: async (err) => {
        console.error('Kafka emit failed, falling back to PostgreSQL backup:', err);
        try {
          await (this.prisma as any).backupLog.create({
            data: {
              eventTime: new Date(event_time),
              ingestedAt: new Date(),
              requestId: request_id,
              serviceName: 'nestjs-api',
              clientIp: client_ip,
              method: method,
              path: path,
              statusCode: status_code,
              statusGroup: statusGroup,
              latencyMs: latency_ms,
              isError: isError,
              userAgent: user_agent,
              rawMessage: raw_message,
            },
          });
        } catch (dbErr) {
          console.error('Failed to save log to PostgreSQL backup:', dbErr);
        }
      },
    });
  }
}
