/**
 * Unit tests for RetryStrategy
 */

import { describe, it, expect } from 'vitest';
import { RetryStrategy, isRetryableError } from '../../src/utils/RetryStrategy';

describe('RetryStrategy', () => {
  it('should calculate exponential backoff with jitter', () => {
    const strategy = new RetryStrategy({
      baseDelay: 1000,
      maxDelay: 10000,
      maxAttempts: 5,
      jitter: 0, // No jitter for predictable testing
    });

    // Attempt 0: 1000ms
    expect(strategy.getDelay()).toBe(1000);
    
    // Attempt 1: 2000ms
    expect(strategy.getDelay()).toBe(2000);
    
    // Attempt 2: 4000ms
    expect(strategy.getDelay()).toBe(4000);
    
    // Attempt 3: 8000ms
    expect(strategy.getDelay()).toBe(8000);
    
    // Attempt 4: 10000ms (capped at maxDelay)
    expect(strategy.getDelay()).toBe(10000);
  });

  it('should return -1 when max attempts reached', () => {
    const strategy = new RetryStrategy({
      baseDelay: 100,
      maxDelay: 1000,
      maxAttempts: 3,
      jitter: 0,
    });

    strategy.getDelay(); // 1
    strategy.getDelay(); // 2
    strategy.getDelay(); // 3

    expect(strategy.getDelay()).toBe(-1);
  });

  it('should reset attempt counter', () => {
    const strategy = new RetryStrategy({
      baseDelay: 100,
      maxDelay: 1000,
      maxAttempts: 3,
      jitter: 0,
    });

    strategy.getDelay();
    strategy.getDelay();
    strategy.reset();

    expect(strategy.getDelay()).toBe(100); // Back to first attempt
  });

  it('should apply jitter correctly', () => {
    const strategy = new RetryStrategy({
      baseDelay: 1000,
      maxDelay: 10000,
      maxAttempts: 5,
      jitter: 0.3, // 30% jitter
    });

    const delays = [];
    for (let i = 0; i < 10; i++) {
      strategy.reset();
      delays.push(strategy.getDelay());
    }

    // With jitter, delays should vary
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });

  it('should check if retry is available', () => {
    const strategy = new RetryStrategy({
      baseDelay: 100,
      maxDelay: 1000,
      maxAttempts: 2,
      jitter: 0,
    });

    expect(strategy.canRetry()).toBe(true);
    strategy.getDelay();
    expect(strategy.canRetry()).toBe(true);
    strategy.getDelay();
    expect(strategy.canRetry()).toBe(false);
  });
});

describe('isRetryableError', () => {
  it('should retry on network errors', () => {
    expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
    expect(isRetryableError({ code: 'ENOTFOUND' })).toBe(true);
    expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
  });

  it('should retry on WebSocket abnormal closure', () => {
    expect(isRetryableError({ code: 1006 })).toBe(true);
  });

  it('should retry on 5xx errors', () => {
    expect(isRetryableError({ statusCode: 500 })).toBe(true);
    expect(isRetryableError({ statusCode: 502 })).toBe(true);
    expect(isRetryableError({ statusCode: 503 })).toBe(true);
  });

  it('should retry on rate limit', () => {
    expect(isRetryableError({ statusCode: 429 })).toBe(true);
  });

  it('should not retry on 4xx errors', () => {
    expect(isRetryableError({ statusCode: 400 })).toBe(false);
    expect(isRetryableError({ statusCode: 401 })).toBe(false);
    expect(isRetryableError({ statusCode: 403 })).toBe(false);
    expect(isRetryableError({ statusCode: 404 })).toBe(false);
  });
});
