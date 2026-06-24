import { ConfigStore, configStore as defaultConfigStore } from '../services/ConfigStore';
import { webSocketManager as defaultWebSocketManager, WebSocketManager } from '../services/WebSocketManager';
import { statusEngine as defaultStatusEngine, StatusEngineClass } from '../services/StatusEngine';
import { eventBus as defaultEventBus, EventBusClass, EventPayload, EventType } from '../services/EventBus';
import { notionClient as defaultNotionClient, NotionClientClass } from '../services/NotionClient';
import { notionLogger as defaultNotionLogger, NotionLoggerClass } from '../services/NotionLogger';
import { ComfyUIClient } from '../services/ComfyUIClient';
import { MachineConfig } from '../types/MachineConfig';
import { Logger } from '../utils/Logger';
import type { MachineData, MachineInput, NotionConfigStatus } from '../shared/api-types';

type MachineUpdateListener = (machines: MachineData[]) => void;

interface ControllerDependencies {
  configStore?: ConfigStore;
  webSocketManager?: WebSocketManager;
  statusEngine?: StatusEngineClass;
  eventBus?: EventBusClass;
  notionClient?: NotionClientClass;
  notionLogger?: NotionLoggerClass;
  createHttpClient?: (machine: MachineConfig) => ComfyUIClient;
}

export class MonitorController {
  private configStore: ConfigStore;
  private webSocketManager: WebSocketManager;
  private statusEngine: StatusEngineClass;
  private eventBus: EventBusClass;
  private notionClient: NotionClientClass;
  private notionLogger: NotionLoggerClass;
  private createHttpClient: (machine: MachineConfig) => ComfyUIClient;
  private httpClients = new Map<string, ComfyUIClient>();
  private machineUpdateListeners = new Set<MachineUpdateListener>();
  private eventUnsubscribers: Array<() => void> = [];
  private initialized = false;

  constructor(dependencies: ControllerDependencies = {}) {
    this.configStore = dependencies.configStore ?? defaultConfigStore;
    this.webSocketManager = dependencies.webSocketManager ?? defaultWebSocketManager;
    this.statusEngine = dependencies.statusEngine ?? defaultStatusEngine;
    this.eventBus = dependencies.eventBus ?? defaultEventBus;
    this.notionClient = dependencies.notionClient ?? defaultNotionClient;
    this.notionLogger = dependencies.notionLogger ?? defaultNotionLogger;
    this.createHttpClient = dependencies.createHttpClient ?? ((machine) => new ComfyUIClient(machine.id, machine.ip, machine.port));
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.configStore.load();
    this.initializeNotionFromConfig();
    this.registerEventHandlers();
    this.initialized = true;
  }

  onMachinesUpdate(listener: MachineUpdateListener): () => void {
    this.machineUpdateListeners.add(listener);
    return () => this.machineUpdateListeners.delete(listener);
  }

  getMachines(): MachineData[] {
    return this.configStore.getMachines().map((machine) => this.toMachineData(machine));
  }

  addMachine(input: MachineInput): MachineData {
    const machine = this.configStore.addMachine(input);
    this.startMonitoring(machine);
    this.broadcastMachinesUpdate();
    return this.toMachineData(machine);
  }

  removeMachine(id: string): boolean {
    const httpClient = this.httpClients.get(id);
    if (httpClient) {
      httpClient.stopPolling();
      this.httpClients.delete(id);
    }

    this.webSocketManager.disconnect(id);
    this.statusEngine.reset(id);
    const removed = this.configStore.removeMachine(id);

    if (removed) {
      this.broadcastMachinesUpdate();
    }

    return removed;
  }

  updateMachine(id: string, updates: Partial<MachineInput>): MachineData | null {
    const machine = this.configStore.updateMachine(id, updates);
    if (!machine) {
      return null;
    }

    this.broadcastMachinesUpdate();
    return this.toMachineData(machine);
  }

  connectMachine(id: string): boolean {
    const machine = this.configStore.getMachine(id);
    if (!machine) {
      return false;
    }

    this.startMonitoring(machine);
    return true;
  }

  disconnectMachine(id: string): boolean {
    this.webSocketManager.disconnect(id);

    const httpClient = this.httpClients.get(id);
    if (httpClient) {
      httpClient.stopPolling();
    }

    this.broadcastMachinesUpdate();
    return true;
  }

  connectAll(): number {
    const machines = this.configStore.getMachines();
    machines.forEach((machine) => this.startMonitoring(machine));
    return machines.length;
  }

  disconnectAll(): void {
    this.webSocketManager.disconnectAll();
    this.httpClients.forEach((client) => client.stopPolling());
    this.broadcastMachinesUpdate();
  }

  getNotionConfigStatus(): NotionConfigStatus {
    const config = this.configStore.getNotionConfig();
    return {
      configured: !!config,
      validated: config?.validated || false,
      databaseId: config?.databaseId ? `${config.databaseId.substring(0, 8)}...` : null,
    };
  }

  setNotionConfig(token: string, databaseId: string): void {
    this.configStore.setNotionConfig(token, databaseId);
    this.initializeNotionFromConfig();
  }

  async testNotionConnection(): Promise<{ success: boolean; error?: string }> {
    const result = await this.notionClient.testConnection();
    if (result.success) {
      this.configStore.markNotionValidated(true);
    }
    return result;
  }

  clearNotionConfig(): void {
    this.configStore.clearNotionConfig();
    this.notionClient.reset();
  }

  broadcastMachinesUpdate(): void {
    const machines = this.getMachines();
    this.machineUpdateListeners.forEach((listener) => listener(machines));
    machines.forEach((machine) => {
      this.eventBus.emit('notion:check-status', {
        machineId: machine.id,
        status: machine.status,
        connectionStatus: machine.connectionStatus,
      });
    });
  }

  dispose(): void {
    this.eventUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.eventUnsubscribers = [];
    this.httpClients.forEach((client) => client.stopPolling());
    this.httpClients.clear();
    this.webSocketManager.disconnectAll();
    this.notionLogger.stop();
    this.machineUpdateListeners.clear();
    this.initialized = false;
  }

  private startMonitoring(machine: MachineConfig): void {
    let httpClient = this.httpClients.get(machine.id);
    if (!httpClient) {
      httpClient = this.createHttpClient(machine);
      this.httpClients.set(machine.id, httpClient);
    }
    httpClient.startPolling();
    this.webSocketManager.connect(machine.id, machine.ip, machine.port);
  }

  private initializeNotionFromConfig(): void {
    const notionConfig = this.configStore.getNotionConfig();
    if (notionConfig?.token && notionConfig.databaseId) {
      this.notionClient.init({
        token: notionConfig.token,
        databaseId: notionConfig.databaseId,
      });
      this.notionLogger.init();
      Logger.info('Notion logger initialized');
    } else {
      Logger.info('Notion not configured, skipping initialization');
    }
  }

  private registerEventHandlers(): void {
    this.onEvent('websocket:message', (data) => {
      this.statusEngine.processMessage(data.machineId, data.message);
    });

    this.onEvent('machine:status-update', (data) => {
      data.machines.forEach((machine) => {
        const existing = this.configStore.getMachine(machine.id);
        if (existing) {
          this.configStore.updateStatus(machine.id, {
            status: machine.status,
            connectionStatus: machine.connectionStatus,
            lastUpdate: machine.lastUpdate,
          });
        }
      });
    });

    this.onEvent('machine:status-change', (data) => {
      const machine = this.configStore.getMachine(data.machineId);
      if (machine) {
        this.configStore.updateStatus(data.machineId, {
          status: data.status,
          lastUpdate: Date.now(),
        });
        this.broadcastMachinesUpdate();
      }
    });

    this.onEvent('comfyui:status-change', (data) => {
      const machine = this.configStore.getMachine(data.machineId);
      if (!machine) {
        return;
      }

      let newStatus: MachineConfig['status'] = 'idle';
      if (data.status.isExecuting) {
        newStatus = 'generating';
      } else if (data.status.queueRemaining > 0) {
        newStatus = 'running';
      }

      this.configStore.updateStatus(data.machineId, {
        status: newStatus,
        lastUpdate: Date.now(),
      });
      this.broadcastMachinesUpdate();
    });

    this.onEvent('machine:connected', () => this.broadcastMachinesUpdate());
    this.onEvent('machine:disconnected', () => this.broadcastMachinesUpdate());
    this.onEvent('machine:error', () => this.broadcastMachinesUpdate());
  }

  private onEvent<T extends EventType>(event: T, handler: (payload: EventPayload[T]) => void): void {
    this.eventBus.on(event, handler);
    this.eventUnsubscribers.push(() => this.eventBus.off(event, handler));
  }

  private toMachineData(config: MachineConfig): MachineData {
    const engineStatus = this.statusEngine.getStatus(config.id);
    const wsStatus = this.webSocketManager.getStatus(config.id);
    const httpClient = this.httpClients.get(config.id);
    const httpStatus = httpClient?.getCurrentStatus();

    let finalStatus = engineStatus;
    if (httpStatus) {
      let httpMachineStatus: MachineConfig['status'] = 'idle';
      if (httpStatus.isExecuting) {
        httpMachineStatus = 'generating';
      } else if (httpStatus.queueRemaining > 0) {
        httpMachineStatus = 'running';
      }

      if (httpMachineStatus === 'generating' || engineStatus === 'generating') {
        finalStatus = 'generating';
      } else if (httpMachineStatus === 'running' || engineStatus === 'running') {
        finalStatus = 'running';
      }
    }

    return {
      ...config,
      status: finalStatus,
      connectionStatus: wsStatus,
      lastUpdate: config.lastUpdate,
      errorMessage: config.errorMessage,
    };
  }
}

export const monitorController = new MonitorController();
