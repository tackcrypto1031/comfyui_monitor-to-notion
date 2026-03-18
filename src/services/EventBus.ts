/**
 * Event Bus for internal communication
 */

import { Logger } from '../utils/Logger';
import { MachineConfig } from '../types/MachineConfig';

// Event types
export type EventType =
  | 'machine:status-change'
  | 'machine:connected'
  | 'machine:disconnected'
  | 'machine:error'
  | 'machine:config-updated'
  | 'config:updated'
  | 'websocket:message'
  | 'comfyui:status-change'
  | 'machine:status-update'
  | 'notion:check-status';

export interface EventPayload {
  'machine:status-change': { machineId: string; status: MachineConfig['status']; previousStatus: MachineConfig['status'] };
  'machine:connected': { machineId: string };
  'machine:disconnected': { machineId: string; reason?: string };
  'machine:error': { machineId: string; error: string };
  'machine:config-updated': { machineId: string };
  'config:updated': { machines: MachineConfig[] };
  'websocket:message': { machineId: string; message: any };
  'comfyui:status-change': { machineId: string; status: any };
  'machine:status-update': { machines: any[] };
  'notion:check-status': { machineId: string; status: 'idle' | 'running' | 'generating'; connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' };
}

type Handler<T extends EventType> = (payload: EventPayload[T]) => void;

export class EventBusClass {
  private listeners: Map<EventType, Set<Function>> = new Map();

  /**
   * Subscribe to an event
   */
  on<T extends EventType>(event: T, handler: Handler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    Logger.debug('Event listener registered', { event });
  }

  /**
   * Unsubscribe from an event
   */
  off<T extends EventType>(event: T, handler: Handler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      Logger.debug('Event listener removed', { event });
    }
  }

  /**
   * Emit an event
   */
  emit<T extends EventType>(event: T, payload: EventPayload[T]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      Logger.debug('Event emitted', { event, payload });
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          Logger.error('Event handler error', { event, error });
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: EventType): void {
    if (event) {
      this.listeners.delete(event);
      Logger.debug('All listeners removed for event', { event });
    } else {
      this.listeners.clear();
      Logger.debug('All listeners removed');
    }
  }

  /**
   * Get listener count for an event
   */
  getListenerCount(event: EventType): number {
    return this.listeners.get(event)?.size || 0;
  }
}

// Export singleton instance
export const eventBus = new EventBusClass();
