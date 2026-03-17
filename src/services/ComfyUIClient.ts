/**
 * ComfyUI HTTP API Client for status polling
 */

import { eventBus } from './EventBus';

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
  private readonly pollIntervalMs = 1000;

  constructor(machineId: string, ip: string, port: number) {
    this.machineId = machineId;
    this.ip = ip;
    this.port = port;
  }

  startPolling(): void {
    console.log('[HTTP Client] Starting polling', this.machineId, this.ip, this.port);
    this.pollStatus();
    this.pollInterval = setInterval(() => {
      this.pollStatus();
    }, this.pollIntervalMs);
  }

  stopPolling(): void {
    console.log('[HTTP Client] Stopping polling', this.machineId);
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

      console.log('[HTTP Client] Poll result', this.machineId, {
        queueRemaining,
        queueRunning: queueRunning.length,
        isExecuting
      });

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
      console.error('[HTTP Polling Error]', this.machineId, error);
    }
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
