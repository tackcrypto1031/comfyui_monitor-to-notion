/**
 * Status Engine - Identifies machine status from WebSocket messages
 */

import { Logger } from '../utils/Logger';
import { eventBus } from './EventBus';
import { MachineStatus } from '../types/MachineConfig';
import { Throttler } from '../utils/Throttle';

export interface ComfyUIMessage {
  type: string;
  data: {
    prompt_id?: string;
    node?: string | null;
    queue_remaining?: number;
    value?: number;
    max?: number;
    [key: string]: any;
  };
}

interface MachineState {
  status: MachineStatus;
  queueRemaining: number;
  executingNode: string | null;
  lastProgress: number;
  promptId: string | null;
}

export class StatusEngine {
  private machineStates: Map<string, MachineState> = new Map();
  private statusThrottler: Map<string, Throttler> = new Map();
  private readonly throttleInterval = 500; // 500ms throttle

  /**
   * Process incoming WebSocket message
   */
  processMessage(machineId: string, message: ComfyUIMessage): MachineStatus | null {
    const state = this.getOrCreateState(machineId);
    const previousStatus = state.status;

    Logger.debug('Processing message', { 
      machineId, 
      type: message.type, 
      data: message.data 
    });

    // Update state based on message type
    switch (message.type) {
      case 'status':
        if (message.data.queue_remaining !== undefined) {
          state.queueRemaining = message.data.queue_remaining;
        }
        break;

      case 'executing':
        state.executingNode = message.data.node || null;
        if (state.executingNode) {
          state.promptId = message.data.prompt_id || null;
        }
        break;

      case 'progress':
        if (message.data.value !== undefined && message.data.max !== undefined) {
          state.lastProgress = message.data.value / message.data.max;
        }
        break;

      case 'execution_start':
        state.promptId = message.data.prompt_id || null;
        break;

      case 'execution_success':
      case 'execution_error':
      case 'execution_interrupted':
        // Execution completed
        state.executingNode = null;
        state.lastProgress = 0;
        break;
    }

    // Calculate current status
    const newStatus = this.calculateStatus(state);
    
    if (newStatus !== previousStatus) {
      Logger.info('Status changed', { 
        machineId, 
        from: previousStatus, 
        to: newStatus,
        queueRemaining: state.queueRemaining,
        executingNode: state.executingNode
      });
      
      state.status = newStatus;
      
      // Throttle status change events
      this.emitStatusChangeThrottled(machineId, newStatus, previousStatus);
    }

    return newStatus;
  }

  /**
   * Emit status change with throttling
   */
  private emitStatusChangeThrottled(
    machineId: string,
    status: MachineStatus,
    previousStatus: MachineStatus
  ): void {
    if (!this.statusThrottler.has(machineId)) {
      this.statusThrottler.set(machineId, new Throttler({
        interval: this.throttleInterval,
        leading: true,
        trailing: true,
      }));
    }

    const throttler = this.statusThrottler.get(machineId)!;
    throttler.call(() => {
      eventBus.emit('machine:status-change', {
        machineId,
        status,
        previousStatus
      });
    });
  }

  /**
   * Calculate status based on state
   */
  private calculateStatus(state: MachineState): MachineStatus {
    // Generating: actively executing a node with progress
    if (state.executingNode !== null && state.lastProgress > 0) {
      return 'generating';
    }

    // Running: has queue items or executing without progress yet
    if (state.queueRemaining > 0 || state.executingNode !== null) {
      return 'running';
    }

    // Idle: no queue and not executing
    return 'idle';
  }

  /**
   * Get or create machine state
   */
  private getOrCreateState(machineId: string): MachineState {
    if (!this.machineStates.has(machineId)) {
      this.machineStates.set(machineId, {
        status: 'idle',
        queueRemaining: 0,
        executingNode: null,
        lastProgress: 0,
        promptId: null
      });
    }
    return this.machineStates.get(machineId)!;
  }

  /**
   * Get current status for a machine
   */
  getStatus(machineId: string): MachineStatus {
    const state = this.machineStates.get(machineId);
    return state?.status || 'idle';
  }

  /**
   * Get all machine statuses
   */
  getAllStatuses(): Map<string, MachineStatus> {
    const statuses = new Map<string, MachineStatus>();
    this.machineStates.forEach((state, id) => {
      statuses.set(id, state.status);
    });
    return statuses;
  }

  /**
   * Reset state for a machine
   */
  reset(machineId: string): void {
    this.machineStates.delete(machineId);
    Logger.debug('Machine state reset', { machineId });
  }

  /**
   * Get state history for debugging
   */
  getStateHistory(): Map<string, MachineState> {
    return new Map(this.machineStates);
  }
}

// Export singleton instance
export const statusEngine = new StatusEngine();
