import { createHmac, createHash, randomBytes } from 'crypto';

export class ProvablyFairService {
  public calculateCrashPoint(serverSeed: string, clientSeed: string): number {
    const hash = createHmac('sha256', serverSeed)
      .update(clientSeed)
      .digest('hex');

    const n = parseInt(hash.substring(0, 13), 16);
    const e = Math.pow(2, 52);

    const crashPoint = 0.99 / (1 - (n / e));

    return Math.max(1, Math.floor(crashPoint * 100) / 100);
  }

  public generateRandomSeed(): string {
    return randomBytes(32).toString('hex');
  }

  public hashSeed(seed: string): string {
    return createHash('sha256').update(seed).digest('hex');
  }

  public verifyChain(currentSeed: string, previousSeedHash: string): boolean {
    return this.hashSeed(currentSeed) === previousSeedHash;
  }
}
