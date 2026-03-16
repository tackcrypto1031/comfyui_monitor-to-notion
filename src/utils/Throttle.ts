/**
 * Throttle utility for rate limiting
 */

export interface ThrottleConfig {
  interval: number;     // Minimum interval between calls (ms)
  leading: boolean;     // Call on leading edge
  trailing: boolean;    // Call on trailing edge
}

const DEFAULT_THROTTLE_CONFIG: ThrottleConfig = {
  interval: 500,
  leading: true,
  trailing: true,
};

export class Throttler {
  private config: ThrottleConfig;
  private lastCall: number = 0;
  private timeout: NodeJS.Timeout | null = null;
  private pendingArgs: any[] | null = null;

  constructor(config: Partial<ThrottleConfig> = {}) {
    this.config = { ...DEFAULT_THROTTLE_CONFIG, ...config };
  }

  /**
   * Throttle a function call
   */
  call<T extends (...args: any[]) => any>(fn: T, ...args: Parameters<T>): void {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall >= this.config.interval) {
      // Execute immediately
      this.lastCall = now;
      fn(...args);
    } else if (this.config.trailing) {
      // Schedule trailing call
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.pendingArgs = args;
      this.timeout = setTimeout(() => {
        this.lastCall = Date.now();
        this.timeout = null;
        if (this.pendingArgs) {
          fn(...this.pendingArgs);
          this.pendingArgs = null;
        }
      }, this.config.interval - timeSinceLastCall);
    }
  }

  /**
   * Cancel pending call
   */
  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.pendingArgs = null;
  }

  /**
   * Reset throttle state
   */
  reset(): void {
    this.cancel();
    this.lastCall = 0;
  }
}

/**
 * Batch processor for grouping operations
 */
export class BatchProcessor<T> {
  private queue: T[] = [];
  private maxSize: number;
  private maxDelay: number;
  private timer: NodeJS.Timeout | null = null;
  private processor: (items: T[]) => void | Promise<void>;

  constructor(
    processor: (items: T[]) => void | Promise<void>,
    maxSize: number = 10,
    maxDelay: number = 100
  ) {
    this.processor = processor;
    this.maxSize = maxSize;
    this.maxDelay = maxDelay;
  }

  /**
   * Add item to batch
   */
  add(item: T): void {
    this.queue.push(item);

    // Process if batch is full
    if (this.queue.length >= this.maxSize) {
      this.flush();
    } else if (!this.timer) {
      // Start timer for delayed processing
      this.timer = setTimeout(() => this.flush(), this.maxDelay);
    }
  }

  /**
   * Flush batch immediately
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    const items = [...this.queue];
    this.queue = [];

    try {
      await this.processor(items);
    } catch (error) {
      console.error('Batch processor error:', error);
      // Re-queue failed items
      this.queue.unshift(...items);
    }
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
