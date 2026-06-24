/**
 * ComfyUI HTTP API Client for status polling
 */

import { eventBus } from './EventBus';
import { Logger } from '../utils/Logger';

export interface ComfyUIStatus {
  queueRemaining: number;
  executingNode: string | null;
  isExecuting: boolean;
}

export class ComfyUIClient {
  private ip: string;
  private port: number;
  private machineId: string;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastStatus: ComfyUIStatus | null = null;
  private lastErrorMessage: string | null = null;
  private lastErrorLoggedAt = 0;
  private readonly pollIntervalMs = 1000;
  private readonly errorLogIntervalMs = 30000;

  constructor(machineId: string, ip: string, port: number) {
    this.machineId = machineId;
    this.ip = ip;
    this.port = port;
  }

  startPolling(): void {
    if (this.pollInterval) {
      return;
    }

    this.pollStatus();
    this.pollInterval = setInterval(() => {
      this.pollStatus();
    }, this.pollIntervalMs);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async pollStatus(): Promise<void> {
    try {
      const queueResponse = await this.fetchQueue();
      
      const queueRemaining = queueResponse?.queue_remaining || 0;
      const queueRunning = queueResponse?.queue_running || [];
      const isExecuting = queueRunning.length > 0;

      const newStatus: ComfyUIStatus = {
        queueRemaining,
        executingNode: isExecuting ? 'executing' : null,
        isExecuting
      };

      this.lastStatus = newStatus;

      eventBus.emit('comfyui:status-change', {
        machineId: this.machineId,
        status: newStatus
      });
    } catch (error) {
      this.logPollingError(error);
    }
  }

  private logPollingError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const now = Date.now();
    const shouldLog =
      message !== this.lastErrorMessage ||
      now - this.lastErrorLoggedAt >= this.errorLogIntervalMs;

    if (!shouldLog) {
      return;
    }

    this.lastErrorMessage = message;
    this.lastErrorLoggedAt = now;
    Logger.error('HTTP polling failed', {
      machineId: this.machineId,
      target: `${this.ip}:${this.port}`,
      error: message,
    });
  }

  private async fetchQueue(): Promise<any> {
    try {
      const response = await fetch(`http://${this.ip}:${this.port}/queue`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  private hasStatusChanged(newStatus: ComfyUIStatus): boolean {
    if (!this.lastStatus) {
      return true;
    }
    return (
      this.lastStatus.queueRemaining !== newStatus.queueRemaining ||
      this.lastStatus.executingNode !== newStatus.executingNode ||
      this.lastStatus.isExecuting !== newStatus.isExecuting
    );
  }

  getCurrentStatus(): ComfyUIStatus | null {
    return this.lastStatus;
  }
}
