import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WalletService } from "../../application/services/wallet.service";
import { CurrentUser } from "../decorators/user.decorator";
import type { UserPayload } from "../decorators/user.decorator";
import { WalletResponseDto } from "../dtos/wallet-response.dto";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@Controller("wallets")
export class WalletsController {
  constructor(private readonly walletService: WalletService) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createWallet(@CurrentUser() user: UserPayload): Promise<WalletResponseDto> {
    const wallet = await this.walletService.getOrCreateWallet(user.userId);
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: wallet.balance.toString(),
    };
  }

  @Get("me")
  @UseGuards(AuthGuard('jwt'))
  async getMe(@CurrentUser() user: UserPayload): Promise<WalletResponseDto> {
    const wallet = await this.walletService.getOrCreateWallet(user.userId);
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: wallet.balance.toString(),
    };
  }
}
