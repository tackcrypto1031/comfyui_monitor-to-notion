/**
 * Simple logger utility with EPIPE protection
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class LoggerClass {
  private level: LogLevel = this.getInitialLevel();

  private getInitialLevel(): LogLevel {
    const level = process.env.COMFYUI_MONITOR_LOG_LEVEL as LogLevel | undefined;
    return level && ['debug', 'info', 'warn', 'error'].includes(level) ? level : 'error';
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private safeLog(fn: Function, level: LogLevel, message: string, ...args: any[]) {
    if (!this.shouldLog(level)) return;
    
    try {
      const timestamp = new Date().toISOString();
      fn(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
    } catch (error) {
      // Ignore EPIPE errors silently
      if ((error as any).code !== 'EPIPE') {
        // Only log non-EPIPE errors to stderr
        try {
          process.stderr.write(`[Logger Error] ${(error as Error).message}\n`);
        } catch {
          // Ignore
        }
      }
    }
  }

  debug(message: string, ...args: any[]) {
    this.safeLog(console.debug, 'debug', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.safeLog(console.info, 'info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.safeLog(console.warn, 'warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.safeLog(console.error, 'error', message, ...args);
  }
}

export const Logger = new LoggerClass();
