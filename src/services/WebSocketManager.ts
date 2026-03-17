/**
 * WebSocket Manager for ComfyUI connections with HTTP polling fallback
 */

import WebSocket from 'ws';
import { eventBus } from './EventBus';
import { ConnectionStatus } from '../types/MachineConfig';
import { RetryStrategy, isRetryableError } from '../utils/RetryStrategy';
import { Logger } from '../utils/Logger';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface WebSocketManagerConfig {
  maxConnections: number;
  maxReconnectAttempts: number;
  reconnectBaseDelay: number;
  reconnectMaxDelay: number;
  pingInterval: number;
}

const DEFAULT_CONFIG: WebSocketManagerConfig = {
  maxConnections: 20,
  maxReconnectAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  pingInterval: 30000,
};

export class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private config: WebSocketManagerConfig;

  constructor(config: Partial<WebSocketManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  connect(machineId: string, ip: string, port: number): void {
    // HTTP polling is started by ComfyUIClient directly
    // WebSocket is used for connection status only
    if (this.connections.has(machineId)) {
      this.disconnect(machineId);
    }

    const retryStrategy = new RetryStrategy({
      baseDelay: this.config.reconnectBaseDelay,
      maxDelay: this.config.reconnectMaxDelay,
      maxAttempts: this.config.maxReconnectAttempts,
      jitter: 0.3,
    });

    const connection = new WebSocketConnection(
      machineId,
      ip,
      port,
      retryStrategy,
      this.config.pingInterval,
      (status) => this.onConnectionStatusChange(machineId, status),
      (message) => this.onMessage(machineId, message),
      (error) => this.onError(machineId, error)
    );

    this.connections.set(machineId, connection);
    connection.connect();
  }

  disconnect(machineId: string): void {
    const connection = this.connections.get(machineId);
    if (connection) {
      connection.dispose();
      this.connections.delete(machineId);
    }
  }

  disconnectAll(): void {
    this.connections.forEach((_, machineId) => this.disconnect(machineId));
  }

  getStatus(machineId: string): ConnectionStatus {
    const connection = this.connections.get(machineId);
    return connection?.status || 'disconnected';
  }

  getAllStatuses(): Map<string, ConnectionStatus> {
    const statuses = new Map<string, ConnectionStatus>();
    this.connections.forEach((conn, id) => {
      statuses.set(id, conn.status);
    });
    return statuses;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  private onConnectionStatusChange(machineId: string, status: ConnectionStatus): void {
    if (status === 'connected') {
      eventBus.emit('machine:connected', { machineId });
    } else if (status === 'disconnected' || status === 'error') {
      eventBus.emit('machine:disconnected', { machineId, reason: status });
    }
  }

  private onMessage(machineId: string, message: WebSocketMessage): void {
    eventBus.emit('websocket:message', { machineId, message });
    const connection = this.connections.get(machineId);
    if (connection) {
      connection.processMessage(message);
    }
  }

  private onError(machineId: string, error: string): void {
    eventBus.emit('machine:error', { machineId, error });
  }
}

class WebSocketConnection {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  public status: ConnectionStatus = 'disconnected';
  private isConnecting = false;
  private isDisposing = false;

  constructor(
    private machineId: string,
    private ip: string,
    private port: number,
    private retryStrategy: RetryStrategy,
    private pingIntervalMs: number,
    private onStatusChange: (status: ConnectionStatus) => void,
    public onMessage: (message: WebSocketMessage) => void,
    private onError: (error: string) => void
  ) {}

  connect(): void {
    if (this.isConnecting || this.isDisposing) {
      return;
    }

    this.isConnecting = true;
    
    try {
      this.setStatus('connecting');
      
      const clientId = `${this.machineId}_${Date.now()}`;
      const url = `ws://${this.ip}:${this.port}/ws?clientId=${clientId}`;
      
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.isConnecting = false;
        this.onOpen();
      });
      
      this.ws.on('message', (data) => {
        this.onMessageEvent(data);
      });
      
      this.ws.on('error', (error) => {
        this.isConnecting = false;
        this.onErrorEvent(error);
      });
      
      this.ws.on('close', () => {
        this.isConnecting = false;
        this.onClose();
      });
    } catch (error) {
      this.isConnecting = false;
      this.handleError(`Connection failed: ${error}`);
    }
  }

  private onOpen(): void {
    this.setStatus('connected');
    this.retryStrategy.reset();
    this.startPing();
  }

  private onMessageEvent(data: any): void {
    try {
      const message = JSON.parse(data.toString());
      // Only log non-crystools messages
      if (message.type !== 'crystools.monitor') {
        Logger.debug(`[WS Message] ${this.machineId} Type: ${message.type}`);
      }
      this.processMessage(message);
    } catch (error) {
      // Ignore parse errors
    }
  }

  processMessage(message: WebSocketMessage): void {
    this.onMessage(message);
  }

  private onErrorEvent(error: Error): void {
    // Ignore
  }

  private onClose(): void {
    this.stopPing();
    
    if (this.status === 'connected' || this.status === 'connecting') {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    const delay = this.retryStrategy.getDelay();
    
    if (delay < 0) {
      this.setStatus('error');
      this.onError('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, this.pingIntervalMs);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleError(error: string): void {
    this.setStatus('error');
    this.onError(error);
    
    if (isRetryableError(error)) {
      this.scheduleReconnect();
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.onStatusChange(status);
  }

  dispose(): void {
    if (this.isDisposing) {
      return;
    }
    this.isDisposing = true;
    
    this.setStatus('disconnected');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopPing();
    
    if (this.ws) {
      try {
        this.ws.removeAllListeners();
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.close(1000, 'Connection disposed');
        }
      } catch (error) {
        // Ignore
      } finally {
        this.ws = null;
      }
    }
    
    this.retryStrategy.reset();
    this.isDisposing = false;
  }
}

export const webSocketManager = new WebSocketManager({
  maxConnections: 20,
  maxReconnectAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  pingInterval: 30000,
});
