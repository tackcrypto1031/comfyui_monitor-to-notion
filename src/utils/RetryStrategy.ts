/**
 * Retry Strategy with Exponential Backoff and Jitter
 */

export interface RetryConfig {
  baseDelay: number;      // 基礎延遲 (ms)
  maxDelay: number;       // 最大延遲 (ms)
  maxAttempts: number;    // 最大嘗試次數
  jitter: number;         // 抖動比例 (0-1)
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  baseDelay: 1000,        // 1 second
  maxDelay: 30000,        // 30 seconds
  maxAttempts: 10,
  jitter: 0.3,            // 30% jitter
};

export class RetryStrategy {
  private config: RetryConfig;
  private attempts: number = 0;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  getDelay(): number {
    if (this.attempts >= this.config.maxAttempts) {
      return -1; // No more retries
    }

    // Exponential backoff
    const exponentialDelay = Math.min(
      this.config.baseDelay * Math.pow(2, this.attempts),
      this.config.maxDelay
    );

    // Add jitter
    const jitterRange = exponentialDelay * this.config.jitter;
    const jitter = (Math.random() * 2 - 1) * jitterRange;

    this.attempts++;
    return Math.round(exponentialDelay + jitter);
  }

  /**
   * Reset attempt counter
   */
  reset(): void {
    this.attempts = 0;
  }

  /**
   * Get current attempt number
   */
  getAttempts(): number {
    return this.attempts;
  }

  /**
   * Check if more retries are available
   */
  canRetry(): boolean {
    return this.attempts < this.config.maxAttempts;
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (error.code === 'ECONNRESET' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED') {
    return true;
  }

  // WebSocket close codes
  if (error.code === 1006) { // Abnormal closure
    return true;
  }

  // HTTP errors
  if (error.statusCode) {
    // 429 (rate limit) - retry with backoff
    // 5xx (server errors) - retry
    // 4xx (client errors) - don't retry
    return error.statusCode >= 500 || error.statusCode === 429;
  }

  // Default: retry on unknown errors
  return true;
}
