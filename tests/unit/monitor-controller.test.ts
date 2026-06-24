import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ConfigStore } from '../../src/services/ConfigStore';
import { EventBusClass } from '../../src/services/EventBus';
import { StatusEngineClass } from '../../src/services/StatusEngine';
import { MonitorController } from '../../src/server/MonitorController';
import type { ConnectionStatus, MachineConfig } from '../../src/types/MachineConfig';
import type { WebSocketManager } from '../../src/services/WebSocketManager';
import type { ComfyUIClient, ComfyUIStatus } from '../../src/services/ComfyUIClient';

class FakeHttpClient {
  startCount = 0;
  stopCount = 0;
  currentStatus: ComfyUIStatus | null = null;

  startPolling(): void {
    this.startCount += 1;
  }

  stopPolling(): void {
    this.stopCount += 1;
  }

  getCurrentStatus(): ComfyUIStatus | null {
    return this.currentStatus;
  }
}

function createFakeWebSocketManager() {
  const statuses = new Map<string, ConnectionStatus>();
  const connectCalls: string[] = [];
  const disconnectCalls: string[] = [];

  const manager = {
    connect(machineId: string) {
      connectCalls.push(machineId);
      statuses.set(machineId, 'connected');
    },
    disconnect(machineId: string) {
      disconnectCalls.push(machineId);
      statuses.set(machineId, 'disconnected');
    },
    disconnectAll() {
      statuses.forEach((_, machineId) => {
        disconnectCalls.push(machineId);
        statuses.set(machineId, 'disconnected');
      });
    },
    getStatus(machineId: string) {
      return statuses.get(machineId) || 'disconnected';
    },
  } as unknown as WebSocketManager;

  return { manager, connectCalls, disconnectCalls };
}

describe('MonitorController', () => {
  let testConfigDir: string;
  let testConfigPath: string;
  let controller: MonitorController;
  let httpClients: Map<string, FakeHttpClient>;
  let fakeWs: ReturnType<typeof createFakeWebSocketManager>;

  beforeEach(() => {
    const parentDir = path.join(process.cwd(), 'test-config');
    fs.mkdirSync(parentDir, { recursive: true });
    testConfigDir = fs.mkdtempSync(path.join(parentDir, 'controller-'));
    testConfigPath = path.join(testConfigDir, 'machines.json');
    httpClients = new Map();
    fakeWs = createFakeWebSocketManager();

    controller = new MonitorController({
      configStore: new ConfigStore(testConfigPath),
      eventBus: new EventBusClass(),
      statusEngine: new StatusEngineClass(),
      webSocketManager: fakeWs.manager,
      createHttpClient: (machine: MachineConfig) => {
        const client = new FakeHttpClient();
        httpClients.set(machine.id, client);
        return client as unknown as ComfyUIClient;
      },
    });
    controller.initialize();
  });

  afterEach(() => {
    controller.dispose();
    if (testConfigDir && fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  it('adds a machine and starts HTTP polling plus WebSocket monitoring', () => {
    const machine = controller.addMachine({
      name: 'GPU-01',
      ip: '192.168.1.10',
      port: 8188,
    });

    expect(machine.name).toBe('GPU-01');
    expect(machine.connectionStatus).toBe('connected');
    expect(fakeWs.connectCalls).toEqual([machine.id]);
    expect(httpClients.get(machine.id)?.startCount).toBe(1);
  });

  it('removes a machine and stops monitoring', () => {
    const machine = controller.addMachine({
      name: 'GPU-01',
      ip: '192.168.1.10',
      port: 8188,
    });

    expect(controller.removeMachine(machine.id)).toBe(true);
    expect(fakeWs.disconnectCalls).toContain(machine.id);
    expect(httpClients.get(machine.id)?.stopCount).toBe(1);
    expect(controller.getMachines()).toEqual([]);
  });

  it('does not expose the full Notion token in config status', () => {
    controller.setNotionConfig('secret-token-value', 'database-id-1234567890');

    const status = controller.getNotionConfigStatus();

    expect(status.configured).toBe(true);
    expect(status.databaseId).toBe('database...');
    expect(JSON.stringify(status)).not.toContain('secret-token-value');
  });
});
