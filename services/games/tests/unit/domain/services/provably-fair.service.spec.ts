import { describe, it, expect } from 'bun:test';
import { ProvablyFairService } from '../../../../src/domain/services/provably-fair.service';

describe('ProvablyFairService', () => {
  const service = new ProvablyFairService();

  it('should calculate consistent crash points', () => {
    const serverSeed = 'def456';
    const clientSeed = 'abc123';
    
    const cp1 = service.calculateCrashPoint(serverSeed, clientSeed);
    const cp2 = service.calculateCrashPoint(serverSeed, clientSeed);
    
    expect(cp1).toBe(cp2);
    expect(cp1).toBeGreaterThanOrEqual(1);
  });

  it('should generate different seeds', () => {
    const seed1 = service.generateRandomSeed();
    const seed2 = service.generateRandomSeed();
    expect(seed1).not.toBe(seed2);
  });

  it('should verify hash chain correctly', () => {
    const seed = 'my-secret-seed';
    const hashed = service.hashSeed(seed);
    
    expect(service.verifyChain(seed, hashed)).toBe(true);
    expect(service.verifyChain('wrong', hashed)).toBe(false);
  });

  it('should calculate a specific known value (regression test)', () => {
    const serverSeed = 'test-seed';
    const clientSeed = 'test-salt';
    const cp = service.calculateCrashPoint(serverSeed, clientSeed);
    
    expect(cp).toBe(9.86);
  });
});
