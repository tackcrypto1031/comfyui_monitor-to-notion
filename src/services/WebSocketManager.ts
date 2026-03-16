/**
 * WebSocket Manager for ComfyUI connections
 */

import WebSocket from 'ws';
import { Logger } from '../utils/Logger';
import { eventBus } from './EventBus';
import { ConnectionStatus } from '../types/MachineConfig';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private readonly maxReconnectAttempts = 6;
  private readonly reconnectDelays = [1000, 2000, 4000, 8000, 16000, 30000]; // Exponential backoff

  /**
   * Connect to a ComfyUI instance
   */
  connect(machineId: string, ip: string, port: number): void {
    // Disconnect existing connection first
    if (this.connections.has(machineId)) {
      this.disconnect(machineId);
    }

    const connection = new WebSocketConnection(
      machineId,
      ip,
      port,
      this.reconnectDelays,
      this.maxReconnectAttempts,
      (status) => this.onConnectionStatusChange(machineId, status),
      (message) => this.onMessage(machineId, message),
      (error) => this.onError(machineId, error)
    );

    this.connections.set(machineId, connection);
    Logger.info('Connecting to ComfyUI', { machineId, ip, port });
    connection.connect();
  }

  /**
   * Disconnect from a ComfyUI instance
   */
  disconnect(machineId: string): void {
    const connection = this.connections.get(machineId);
    if (connection) {
      connection.dispose();
      this.connections.delete(machineId);
      Logger.info('Disconnected from ComfyUI', { machineId });
    }
  }

  /**
   * Disconnect all instances
   */
  disconnectAll(): void {
    this.connections.forEach((_, machineId) => this.disconnect(machineId));
  }

  /**
   * Get connection status
   */
  getStatus(machineId: string): ConnectionStatus {
    const connection = this.connections.get(machineId);
    return connection?.status || 'disconnected';
  }

  /**
   * Get all connection statuses
   */
  getAllStatuses(): Map<string, ConnectionStatus> {
    const statuses = new Map<string, ConnectionStatus>();
    this.connections.forEach((conn, id) => {
      statuses.set(id, conn.status);
    });
    return statuses;
  }

  /**
   * Handle connection status change
   */
  private onConnectionStatusChange(machineId: string, status: ConnectionStatus): void {
    Logger.info('Connection status changed', { machineId, status });

    if (status === 'connected') {
      eventBus.emit('machine:connected', { machineId });
    } else if (status === 'disconnected' || status === 'error') {
      eventBus.emit('machine:disconnected', { machineId, reason: status });
    }
  }

  /**
   * Handle incoming message
   */
  private onMessage(machineId: string, message: WebSocketMessage): void {
    // Messages will be processed by StatusEngine
    Logger.debug('WebSocket message received', { machineId, type: message.type });
  }

  /**
   * Handle error
   */
  private onError(machineId: string, error: string): void {
    Logger.error('WebSocket error', { machineId, error });
    eventBus.emit('machine:error', { machineId, error });
  }

  /**
   * Get active connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

/**
 * Individual WebSocket connection handler
 */
class WebSocketConnection {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  public status: ConnectionStatus = 'disconnected';

  constructor(
    private machineId: string,
    private ip: string,
    private port: number,
    private reconnectDelays: number[],
    private maxReconnectAttempts: number,
    private onStatusChange: (status: ConnectionStatus) => void,
    private onMessage: (message: WebSocketMessage) => void,
    private onError: (error: string) => void
  ) {}

  /**
   * Establish WebSocket connection
   */
  connect(): void {
    try {
      this.setStatus('connecting');
      
      const clientId = `${this.machineId}_${Date.now()}`;
      const url = `ws://${this.ip}:${this.port}/ws?clientId=${clientId}`;
      
      Logger.debug('Creating WebSocket connection', { url });
      this.ws = new WebSocket(url);

      this.ws.on('open', () => this.onOpen());
      this.ws.on('message', (data) => this.onMessageEvent(data));
      this.ws.on('error', (error) => this.onErrorEvent(error));
      this.ws.on('close', () => this.onClose());
    } catch (error) {
      this.handleError(`Connection failed: ${error}`);
    }
  }

  /**
   * Handle connection opened
   */
  private onOpen(): void {
    Logger.info('WebSocket connected', { machineId: this.machineId });
    this.setStatus('connected');
    this.reconnectAttempts = 0;
    this.startPing();
  }

  /**
   * Handle incoming message
   */
  private onMessageEvent(data: any): void {
    try {
      const message = JSON.parse(data.toString());
      this.onMessage(message);
    } catch (error) {
      Logger.warn('Failed to parse message', { machineId: this.machineId, error });
    }
  }

  /**
   * Handle WebSocket error
   */
  private onErrorEvent(error: Error): void {
    Logger.warn('WebSocket error event', { machineId: this.machineId, error: error.message });
  }

  /**
   * Handle connection closed
   */
  private onClose(): void {
    Logger.info('WebSocket closed', { machineId: this.machineId });
    this.stopPing();
    
    if (this.status !== 'disconnected') {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      Logger.warn('Max reconnect attempts reached', { machineId: this.machineId });
      this.setStatus('error');
      this.onError('Max reconnect attempts reached');
      return;
    }

    const delay = this.reconnectDelays[Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1)];
    this.reconnectAttempts++;
    
    Logger.info('Scheduling reconnect', { machineId: this.machineId, attempt: this.reconnectAttempts, delay });
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat ping
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        Logger.debug('Ping sent', { machineId: this.machineId });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat ping
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Handle error
   */
  private handleError(error: string): void {
    this.setStatus('error');
    this.onError(error);
    this.scheduleReconnect();
  }

  /**
   * Update connection status
   */
  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.onStatusChange(status);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.setStatus('disconnected');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopPing();
    
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    
    Logger.info('Connection disposed', { machineId: this.machineId });
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();
