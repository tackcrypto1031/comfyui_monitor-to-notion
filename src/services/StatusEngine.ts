/**
 * Status Engine - Identifies machine status from WebSocket messages
 */

import { eventBus } from './EventBus';
import { MachineStatus } from '../types/MachineConfig';
import { Throttler } from '../utils/Throttle';
import { Logger } from '../utils/Logger';

export interface ComfyUIMessage {
  type: string;
  data: {
    prompt_id?: string;
    node?: string | null;
    queue_remaining?: number;
    value?: number;
    max?: number;
    exec_info?: {
      queue_remaining?: number;
    };
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

export class StatusEngineClass {
  private machineStates: Map<string, MachineState> = new Map();
  private statusThrottler: Map<string, Throttler> = new Map();
  private readonly throttleInterval = 500;

  processMessage(machineId: string, message: ComfyUIMessage): MachineStatus | null {
    const state = this.getOrCreateState(machineId);
    const previousStatus = state.status;

    if (message.type.includes('monitor') || message.type.includes('system_stats')) {
      return state.status;
    }

    switch (message.type) {
      case 'status':
        if (message.data.exec_info?.queue_remaining !== undefined) {
          state.queueRemaining = message.data.exec_info.queue_remaining;
        }
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
        state.executingNode = null;
        state.lastProgress = 0;
        break;
    }

    const newStatus = this.calculateStatus(state);
    
    if (newStatus !== previousStatus) {
      state.status = newStatus;
      this.emitStatusChangeThrottled(machineId, newStatus, previousStatus);
    }

    return newStatus;
  }

  private calculateStatus(state: MachineState): MachineStatus {
    if (state.executingNode !== null) {
      return 'generating';
    }
    if (state.queueRemaining > 0) {
      return 'running';
    }
    return 'idle';
  }

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

  getStatus(machineId: string): MachineStatus {
    const state = this.machineStates.get(machineId);
    return state?.status || 'idle';
  }

  getAllStatuses(): Map<string, MachineStatus> {
    const statuses = new Map<string, MachineStatus>();
    this.machineStates.forEach((state, machineId) => {
      statuses.set(machineId, state.status);
    });
    return statuses;
  }

  reset(machineId: string): void {
    this.machineStates.delete(machineId);
  }
}

export const StatusEngine = StatusEngineClass;
export const statusEngine = new StatusEngineClass();
