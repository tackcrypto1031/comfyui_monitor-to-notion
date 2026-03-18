/**
 * Notion Logger - Logs status changes to Notion
 */

import { eventBus } from './EventBus';
import { notionClient, StatusChangeRecord, NotionStatus } from './NotionClient';
import { configStore } from './ConfigStore';
import { Logger } from '../utils/Logger';

export class NotionLoggerClass {
  private enabled: boolean = false;
  private queue: StatusChangeRecord[] = [];
  private processing: boolean = false;
  private processInterval: NodeJS.Timeout | null = null;

  private lastStatusMap: Map<string, string> = new Map();
  private lastConnectionMap: Map<string, string> = new Map();

  /**
   * Initialize Notion logger
   */
  init(): void {
    // Guard against duplicate initialization
    if (this.enabled) {
      Logger.info('Notion logger already initialized, skipping');
      return;
    }
    
    Logger.info('Initializing Notion logger');

    // Subscribe to aggregated status updates with both status and connectionStatus
    eventBus.on('notion:check-status', (payload: { machineId: string, status: 'idle' | 'running' | 'generating', connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' }) => {
      const prevStatus = this.lastStatusMap.get(payload.machineId) || 'idle';
      const prevConnection = this.lastConnectionMap.get(payload.machineId) || 'disconnected';

      // Determine effective status: if disconnected/error, override to 'disconnected'
      const isDisconnected = payload.connectionStatus === 'disconnected' || payload.connectionStatus === 'error' || payload.connectionStatus === 'connecting';
      const effectiveStatus: NotionStatus = isDisconnected ? 'disconnected' : payload.status;
      const effectivePrev: NotionStatus = (prevConnection === 'disconnected' || prevConnection === 'error' || prevConnection === 'connecting') ? 'disconnected' : (prevStatus as NotionStatus);

      const statusChanged = effectiveStatus !== effectivePrev;
      const connectionChanged = payload.connectionStatus !== prevConnection;

      if (statusChanged || connectionChanged) {
        this.lastStatusMap.set(payload.machineId, payload.status);
        this.lastConnectionMap.set(payload.machineId, payload.connectionStatus);
        this.handleStatusChange({
          machineId: payload.machineId,
          status: effectiveStatus,
          previousStatus: effectivePrev,
          connectionStatus: payload.connectionStatus,
        });
      }
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
    status: NotionStatus;
    previousStatus: NotionStatus;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
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

    // Map connectionStatus for Notion record
    const notionConnectionStatus: 'connected' | 'disconnected' | 'error' =
      payload.connectionStatus === 'connecting' ? 'disconnected' : payload.connectionStatus;

    // Create record
    const record: StatusChangeRecord = {
      machineName: machine.name,
      status: payload.status,
      previousStatus: payload.previousStatus,
      ip: machine.ip,
      port: machine.port,
      timestamp: new Date(),
      connectionStatus: notionConnectionStatus,
    };

    Logger.info('Queuing status change for Notion', {
      machine: record.machineName,
      from: payload.previousStatus,
      to: payload.status,
      connectionStatus: payload.connectionStatus,
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
        const result = await notionClient.upsertStatusRecord(record);
        
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
