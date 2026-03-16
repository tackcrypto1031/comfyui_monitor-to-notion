/**
 * Notion Logger - Logs status changes to Notion
 */

import { eventBus } from './EventBus';
import { notionClient, StatusChangeRecord } from './NotionClient';
import { configStore } from './ConfigStore';
import { Logger } from '../utils/Logger';

export class NotionLoggerClass {
  private enabled: boolean = false;
  private queue: StatusChangeRecord[] = [];
  private processing: boolean = false;
  private processInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize Notion logger
   */
  init(): void {
    Logger.info('Initializing Notion logger');

    // Subscribe to status change events
    eventBus.on('machine:status-change', (payload) => {
      this.handleStatusChange(payload);
    });

    // Start queue processor
    this.startQueueProcessor();

    this.enabled = true;
  }

  /**
   * Handle status change event
   */
  private handleStatusChange(payload: {
    machineId: string;
    status: 'idle' | 'running' | 'generating';
    previousStatus: 'idle' | 'running' | 'generating';
  }): void {
    if (!this.enabled) {
      Logger.debug('Notion logger disabled, skipping status change');
      return;
    }

    if (!notionClient.isInitialized()) {
      Logger.debug('Notion client not initialized, skipping status change');
      return;
    }

    // Get machine details
    const machine = configStore.getMachine(payload.machineId);
    if (!machine) {
      Logger.warn('Machine not found for status change', { machineId: payload.machineId });
      return;
    }

    // Create record
    const record: StatusChangeRecord = {
      machineName: machine.name,
      status: payload.status,
      previousStatus: payload.previousStatus,
      ip: machine.ip,
      port: machine.port,
      timestamp: new Date(),
      connectionStatus: machine.connectionStatus === 'connecting' ? 'disconnected' : machine.connectionStatus,
    };

    Logger.info('Queuing status change for Notion', {
      machine: record.machineName,
      from: payload.previousStatus,
      to: payload.status,
    });

    // Add to queue
    this.queue.push(record);

    // Process immediately if queue was empty
    if (this.queue.length === 1) {
      this.processQueue();
    }
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    // Process queue every 2 seconds
    this.processInterval = setInterval(() => {
      if (this.queue.length > 0 && !this.processing) {
        this.processQueue();
      }
    }, 2000);
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const record = this.queue.shift();
      if (!record) continue;

      try {
        const result = await notionClient.createStatusRecord(record);
        
        if (result.success) {
          Logger.debug('Status change logged to Notion', {
            machine: record.machineName,
            pageId: result.pageId,
          });
        } else {
          Logger.error('Failed to log status change to Notion', {
            error: result.error,
            machine: record.machineName,
          });
          
          // Re-queue on failure (with limit)
          if (this.queue.length < 10) {
            this.queue.unshift(record);
          }
        }
      } catch (error) {
        Logger.error('Error processing Notion queue', { error });
      }
    }

    this.processing = false;
  }

  /**
   * Stop logger
   */
  stop(): void {
    this.enabled = false;
    
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    Logger.info('Notion logger stopped');
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const notionLogger = new NotionLoggerClass();
