/**
 * WebSocket Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigStore } from '../src/services/ConfigStore';
import { WebSocketManager } from '../src/services/WebSocketManager';
import { StatusEngine } from '../src/services/StatusEngine';
import { eventBus } from '../src/services/EventBus';
import path from 'path';
import fs from 'fs';

describe('Phase 1 Integration Tests', () => {
  let configStore: ConfigStore;
  let wsManager: WebSocketManager;
  let statusEngine: StatusEngine;
  let testConfigPath: string;

  beforeEach(() => {
    // Create unique test config path for each test
    testConfigPath = path.join(process.cwd(), 'test-config', `test-${Date.now()}.json`);
    configStore = new ConfigStore(testConfigPath);
    wsManager = new WebSocketManager();
    statusEngine = new StatusEngine();
  });

  afterEach(() => {
    wsManager.disconnectAll();
    eventBus.removeAllListeners();
    // Clean up test config file
    if (testConfigPath && fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    wsManager.disconnectAll();
    eventBus.removeAllListeners();
  });

  describe('ConfigStore', () => {
    it('should add and retrieve machines', () => {
      const machine1 = configStore.addMachine({
        name: 'Test Machine 1',
        ip: '192.168.1.100',
        port: 8188
      });

      expect(machine1.id).toBeDefined();
      expect(machine1.name).toBe('Test Machine 1');
      expect(machine1.ip).toBe('192.168.1.100');
      expect(machine1.port).toBe(8188);
      expect(machine1.status).toBe('idle');
      expect(machine1.connectionStatus).toBe('disconnected');
    });

    it('should support 5+ machines', () => {
      for (let i = 1; i <= 6; i++) {
        configStore.addMachine({
          name: `Machine ${i}`,
          ip: `192.168.1.${100 + i}`,
          port: 8188
        });
      }

      expect(configStore.getCount()).toBe(6);
    });

    it('should update machine configuration', () => {
      const machine = configStore.addMachine({
        name: 'Original Name',
        ip: '192.168.1.100',
        port: 8188
      });

      const updated = configStore.updateMachine(machine.id, {
        name: 'Updated Name',
        ip: '192.168.1.200'
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.ip).toBe('192.168.1.200');
    });

    it('should remove machine', () => {
      const machine = configStore.addMachine({
        name: 'To Remove',
        ip: '192.168.1.100',
        port: 8188
      });

      const removed = configStore.removeMachine(machine.id);
      expect(removed).toBe(true);
      expect(configStore.getCount()).toBe(0);
    });
  });

  describe('StatusEngine', () => {
    it('should identify idle status', () => {
      const machineId = 'test-machine';
      
      statusEngine.processMessage(machineId, {
        type: 'status',
        data: { queue_remaining: 0 }
      });

      expect(statusEngine.getStatus(machineId)).toBe('idle');
    });

    it('should identify running status when queue > 0', () => {
      const machineId = 'test-machine';
      
      statusEngine.processMessage(machineId, {
        type: 'status',
        data: { queue_remaining: 5 }
      });

      expect(statusEngine.getStatus(machineId)).toBe('running');
    });

    it('should identify generating status with progress', () => {
      const machineId = 'test-machine';
      
      // Start execution
      statusEngine.processMessage(machineId, {
        type: 'executing',
        data: { node: 'node1', prompt_id: 'prompt1' }
      });

      // Add progress
      statusEngine.processMessage(machineId, {
        type: 'progress',
        data: { node: 'node1', value: 50, max: 100 }
      });

      expect(statusEngine.getStatus(machineId)).toBe('generating');
    });

    it('should transition from running to generating', () => {
      const machineId = 'test-machine';
      let statusChanges = 0;
      let lastStatus: string | null = null;

      eventBus.on('machine:status-change', (payload) => {
        statusChanges++;
        lastStatus = payload.status;
      });

      // Start with queue
      statusEngine.processMessage(machineId, {
        type: 'status',
        data: { queue_remaining: 1 }
      });

      expect(statusEngine.getStatus(machineId)).toBe('running');

      // Add execution with progress
      statusEngine.processMessage(machineId, {
        type: 'executing',
        data: { node: 'node1' }
      });

      statusEngine.processMessage(machineId, {
        type: 'progress',
        data: { value: 25, max: 100 }
      });

      expect(statusEngine.getStatus(machineId)).toBe('generating');
      expect(statusChanges).toBeGreaterThan(0);
    });
  });

  describe('EventBus', () => {
    it('should emit and receive events', () => {
      const handler = vi.fn();
      eventBus.on('machine:status-change', handler);

      eventBus.emit('machine:status-change', {
        machineId: 'test',
        status: 'running',
        previousStatus: 'idle'
      });

      expect(handler).toHaveBeenCalledWith({
        machineId: 'test',
        status: 'running',
        previousStatus: 'idle'
      });
    });

    it('should remove listeners', () => {
      const handler = vi.fn();
      eventBus.on('test:event', handler);
      eventBus.off('test:event', handler);

      eventBus.emit('test:event', { data: 'test' });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Multi-machine scenario', () => {
    it('should handle 5+ machines simultaneously', () => {
      const machineIds: string[] = [];

      // Add 6 machines
      for (let i = 1; i <= 6; i++) {
        const machine = configStore.addMachine({
          name: `Machine ${i}`,
          ip: `192.168.1.${100 + i}`,
          port: 8188
        });
        machineIds.push(machine.id);
      }

      // Verify all machines exist
      const machines = configStore.getMachines();
      expect(machines.length).toBe(6);

      // Simulate different statuses
      statusEngine.processMessage(machineIds[0], {
        type: 'status',
        data: { queue_remaining: 0 }
      });

      statusEngine.processMessage(machineIds[1], {
        type: 'status',
        data: { queue_remaining: 5 }
      });

      statusEngine.processMessage(machineIds[2], {
        type: 'status',
        data: { queue_remaining: 10 }
      });

      const statuses = statusEngine.getAllStatuses();
      expect(statuses.get(machineIds[0])).toBe('idle');
      expect(statuses.get(machineIds[1])).toBe('running');
      expect(statuses.get(machineIds[2])).toBe('running');
    });
  });

  describe('StatusEngine transitions', () => {
    it('should transition from running to generating', () => {
      const machineId = 'test-machine';
      let statusChanges = 0;
      let lastStatus: string | null = null;

      eventBus.on('machine:status-change', (payload) => {
        statusChanges++;
        lastStatus = payload.status;
      });

      // Start with queue
      statusEngine.processMessage(machineId, {
        type: 'status',
        data: { queue_remaining: 1 }
      });

      expect(statusEngine.getStatus(machineId)).toBe('running');

      // Add execution with progress
      statusEngine.processMessage(machineId, {
        type: 'executing',
        data: { node: 'node1' }
      });

      statusEngine.processMessage(machineId, {
        type: 'progress',
        data: { value: 25, max: 100 }
      });

      expect(statusEngine.getStatus(machineId)).toBe('generating');
      expect(statusChanges).toBeGreaterThan(0);
      expect(lastStatus).toBe('generating');
    });
  });
});
