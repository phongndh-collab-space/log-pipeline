import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ProviderModule } from "@provider/provider.module";
import { ModelModule } from "@model/model.module";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { HttpExceptionFilter } from "./common/exceptions/http-exception.filter";
import { ValidationPipe } from "@pipe/validation.pipe";
import { TransformInterceptor } from "@interceptor/transform.interceptor";
import { AuthenticationModule } from "@authentication/authentication.module";
import { SanitizeHtmlInterceptor } from "@interceptor/sanitize-html.interceptor";
import { ThrottlerGuard } from "@nestjs/throttler";

import { LoggingMiddleware } from "./common/middlewares/logging.middleware";
import { PrismaService } from "@prisma/prisma.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProviderModule,
    ModelModule,
    AuthenticationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizeHtmlInterceptor
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    PrismaService
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes("*");
  }
}
