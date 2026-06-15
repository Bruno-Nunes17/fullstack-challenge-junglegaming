export enum MessagingPatterns {
  DEBIT_WALLET = 'debit_wallet',
  CREDIT_WALLET = 'credit_wallet',
  WALLET_DEBITED = 'wallet_debited',
  WALLET_DEBIT_FAILED = 'wallet_debit_failed',
  WALLET_CREDITED = 'wallet_credited',
}

export interface DebitWalletDto {
  playerId: string;
  amount: string;
  betId: string;
  roundId: string;
}

export interface CreditWalletDto {
  playerId: string;
  amount: string;
  betId: string;
}

export interface WalletDebitedDto {
  playerId: string;
  betId: string;
}

export interface WalletDebitFailedDto {
  playerId: string;
  betId: string;
  reason: string;
}

export interface WalletCreditedDto {
  playerId: string;
  betId: string;
}
