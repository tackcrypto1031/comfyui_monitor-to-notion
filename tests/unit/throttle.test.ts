/**
 * Unit tests for Throttle utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Throttler, BatchProcessor } from '../../src/utils/Throttle';

describe('Throttler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call function immediately on leading edge', () => {
    const fn = vi.fn();
    const throttler = new Throttler({
      interval: 100,
      leading: true,
      trailing: false,
    });

    throttler.call(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    // Call again within interval - should be ignored
    throttler.call(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    // Advance time past interval
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    // Call again after interval - should execute
    throttler.call(fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should schedule trailing call when within interval', () => {
    const fn = vi.fn();
    const throttler = new Throttler({
      interval: 100,
      leading: true,
      trailing: true,
    });

    // First call - leading
    throttler.call(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    // Second call within interval - should schedule trailing
    throttler.call(fn);
    expect(fn).toHaveBeenCalledTimes(1); // Still 1

    // Advance time to trigger trailing call
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2); // Now 2 (trailing)
  });

  it('should cancel pending trailing call', () => {
    const fn = vi.fn();
    const throttler = new Throttler({
      interval: 100,
      leading: true,
      trailing: true,
    });

    // First call - leading
    throttler.call(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    // Second call within interval - schedules trailing
    throttler.call(fn);
    
    // Cancel before trailing executes
    throttler.cancel();
    
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1); // Still 1, trailing cancelled
  });

  it('should reset throttle state', () => {
    const fn = vi.fn();
    const throttler = new Throttler({
      interval: 100,
      leading: true,
      trailing: false,
    });

    throttler.call(fn);
    throttler.reset();

    // After reset, should be able to call immediately
    throttler.call(fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('BatchProcessor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should process batch when size limit reached', async () => {
    const processor = vi.fn();
    const batch = new BatchProcessor(processor, 3, 1000);

    batch.add(1);
    batch.add(2);
    expect(processor).not.toHaveBeenCalled();

    batch.add(3); // Should trigger processing
    await vi.advanceTimersByTimeAsync(0);
    
    expect(processor).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('should process batch after delay', async () => {
    const processor = vi.fn();
    const batch = new BatchProcessor(processor, 10, 100);

    batch.add(1);
    expect(processor).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(processor).toHaveBeenCalledWith([1]);
  });

  it('should clear queue', () => {
    const processor = vi.fn();
    const batch = new BatchProcessor(processor, 3, 100);

    batch.add(1);
    batch.add(2);
    batch.clear();

    expect(batch.getQueueLength()).toBe(0);
  });

  it('should re-queue failed items', async () => {
    const processor = vi.fn().mockRejectedValue(new Error('Failed'));
    const batch = new BatchProcessor(processor, 2, 1000);

    batch.add(1);
    batch.add(2);

    await vi.advanceTimersByTimeAsync(0);
    
    // Should have tried to process
    expect(processor).toHaveBeenCalledWith([1, 2]);
    
    // Items should be re-queued
    expect(batch.getQueueLength()).toBe(2);
  });
});
