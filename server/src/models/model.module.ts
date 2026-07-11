import { Module } from "@nestjs/common";
import { UserModule } from "@model/user/user.module";
import { CategoryModule } from "./category/category.module";
import { WalletModule } from "./wallet/wallet.module";
import { TransactionModule } from "./transaction/transaction.module";

@Module({
  imports: [UserModule, CategoryModule, WalletModule, TransactionModule],
  exports: [UserModule, CategoryModule, WalletModule, TransactionModule],
})
export class ModelModule {}
