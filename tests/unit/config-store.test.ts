/**
 * Unit tests for ConfigStore
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigStore } from '../../src/services/ConfigStore';
import fs from 'fs';
import path from 'path';

describe('ConfigStore', () => {
  let testConfigPath: string;

  beforeEach(() => {
    testConfigPath = path.join(process.cwd(), 'test-config', `test-${Date.now()}.json`);
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    const notionConfigPath = path.join(path.dirname(testConfigPath), 'notion-config.json');
    if (fs.existsSync(notionConfigPath)) {
      fs.unlinkSync(notionConfigPath);
    }
  });

  describe('Machine Management', () => {
    it('should add machine', () => {
      const store = new ConfigStore(testConfigPath);
      
      const machine = store.addMachine({
        name: 'Test Machine',
        ip: '192.168.1.100',
        port: 8188,
      });

      expect(machine.id).toBeDefined();
      expect(machine.name).toBe('Test Machine');
      expect(machine.ip).toBe('192.168.1.100');
      expect(machine.port).toBe(8188);
      expect(machine.status).toBe('idle');
      expect(machine.connectionStatus).toBe('disconnected');
    });

    it('should remove machine', () => {
      const store = new ConfigStore(testConfigPath);
      
      const machine = store.addMachine({
        name: 'Test',
        ip: '192.168.1.100',
        port: 8188,
      });

      const removed = store.removeMachine(machine.id);
      expect(removed).toBe(true);
      expect(store.getCount()).toBe(0);
    });

    it('should update machine', () => {
      const store = new ConfigStore(testConfigPath);
      
      const machine = store.addMachine({
        name: 'Original',
        ip: '192.168.1.100',
        port: 8188,
      });

      const updated = store.updateMachine(machine.id, {
        name: 'Updated',
        ip: '192.168.1.200',
      });

      expect(updated?.name).toBe('Updated');
      expect(updated?.ip).toBe('192.168.1.200');
      expect(updated?.port).toBe(8188); // Unchanged
    });

    it('should get all machines', () => {
      const store = new ConfigStore(testConfigPath);
      
      store.addMachine({ name: 'Machine 1', ip: '192.168.1.1', port: 8188 });
      store.addMachine({ name: 'Machine 2', ip: '192.168.1.2', port: 8188 });
      store.addMachine({ name: 'Machine 3', ip: '192.168.1.3', port: 8188 });

      const machines = store.getMachines();
      expect(machines.length).toBe(3);
    });

    it('should support 20+ machines (optimization target)', () => {
      const store = new ConfigStore(testConfigPath);
      
      for (let i = 1; i <= 20; i++) {
        store.addMachine({
          name: `Machine ${i}`,
          ip: `192.168.1.${i}`,
          port: 8188,
        });
      }

      expect(store.getCount()).toBe(20);
    });
  });

  describe('Notion Configuration', () => {
    it('should set and get Notion config', () => {
      const store = new ConfigStore(testConfigPath);
      
      store.setNotionConfig('test-token-123', 'test-database-id-456');
      
      const config = store.getNotionConfig();
      
      expect(config).not.toBeNull();
      expect(config?.token).toBe('test-token-123');
      expect(config?.databaseId).toBe('test-database-id-456');
      expect(config?.validated).toBe(false);
    });

    it('should mark Notion as validated', () => {
      const store = new ConfigStore(testConfigPath);
      
      store.setNotionConfig('token', 'database');
      store.markNotionValidated(true);
      
      const config = store.getNotionConfig();
      
      expect(config?.validated).toBe(true);
      expect(config?.lastValidated).toBeDefined();
    });

    it('should clear Notion config', () => {
      const store = new ConfigStore(testConfigPath);
      
      store.setNotionConfig('token', 'database');
      store.clearNotionConfig();
      
      const config = store.getNotionConfig();
      expect(config).toBeNull();
    });

    it('should encrypt token for storage', () => {
      const store = new ConfigStore(testConfigPath);
      
      store.setNotionConfig('secret-token', 'database');
      
      // Read raw file to verify encryption
      const notionConfigPath = path.join(path.dirname(testConfigPath), 'notion-config.json');
      const rawData = fs.readFileSync(notionConfigPath, 'utf-8');
      const parsed = JSON.parse(rawData);
      
      // Token should be encrypted (not plain text)
      expect(parsed.token).not.toBe('secret-token');
      expect(parsed.token).toBeDefined();
    });
  });

  describe('Persistence', () => {
    it('should persist machines to file', () => {
      const store = new ConfigStore(testConfigPath);
      
      store.addMachine({ name: 'Test', ip: '192.168.1.100', port: 8188 });
      
      // Create new store instance to test persistence
      const store2 = new ConfigStore(testConfigPath);
      store2.load();
      
      const machines = store2.getMachines();
      expect(machines.length).toBe(1);
      expect(machines[0].name).toBe('Test');
    });

    it('should persist Notion config to file', () => {
      const store = new ConfigStore(testConfigPath);
      
      store.setNotionConfig('token', 'database');
      
      // Create new store instance
      const store2 = new ConfigStore(testConfigPath);
      
      const config = store2.getNotionConfig();
      expect(config).not.toBeNull();
      expect(config?.databaseId).toBe('database');
    });
  });
});
