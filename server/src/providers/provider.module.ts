import { Module } from "@nestjs/common";

import { JwtProvider } from "@provider/jwt.provider";
import { ThrottleProvider } from "@provider/throttle.provider";
import { KafkaProvider } from "@provider/kafka.provider";

@Module({
  imports: [ThrottleProvider, JwtProvider, KafkaProvider],
  exports: [ThrottleProvider, JwtProvider, KafkaProvider]
})
export class ProviderModule {
}
