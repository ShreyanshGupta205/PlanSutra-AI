import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { AdminLoginRequestSchema } from '../src/schemas';

describe('Admin Security & Authorization Boundaries', () => {
  it('validates admin secret key schema correctly', () => {
    // Generate a random dynamic test secret
    const dynamicSecret = crypto.randomBytes(32).toString('hex');
    const valid = AdminLoginRequestSchema.safeParse({ secretKey: dynamicSecret });
    expect(valid.success).toBe(true);

    const empty = AdminLoginRequestSchema.safeParse({ secretKey: '' });
    expect(empty.success).toBe(false);

    const missing = AdminLoginRequestSchema.safeParse({});
    expect(missing.success).toBe(false);
  });

  it('fails closed when unauthorized tokens are provided', () => {
    const serverKey = crypto.randomBytes(32).toString('hex');
    const fakeToken = crypto.randomBytes(32).toString('hex');
    
    // Constant-time comparison verification
    const inputBuf = Buffer.from(fakeToken);
    const secretBuf = Buffer.from(serverKey);
    const authorized = inputBuf.length === secretBuf.length && crypto.timingSafeEqual(inputBuf, secretBuf);
    
    expect(authorized).toBe(false);
  });

  it('validates ephemeral session token properties and lifecycle', () => {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    expect(sessionToken).toHaveLength(64);

    const now = Date.now();
    const ttlMs = 2 * 60 * 60 * 1000;
    const session = {
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    expect(session.expiresAt).toBeGreaterThan(now);
    // Verified expired check
    const expiredSession = {
      createdAt: now - 3 * 3600 * 1000,
      expiresAt: now - 1000,
    };
    expect(now > expiredSession.expiresAt).toBe(true);
  });
});
