/**
 * Configuration store for machine settings and Notion config
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MachineConfig, MachineConfigInput } from '../types/MachineConfig';
import { Logger } from '../utils/Logger';

export interface NotionConfigData {
  token?: string;
  databaseId?: string;
  validated?: boolean;
  lastValidated?: number;
}

const ENCRYPTION_KEY = 'comfyui-monitor-notion-token-key-32bytes!'; // 32 bytes for AES-256

export class ConfigStore {
  private configPath: string;
  private notionConfigPath: string;
  private machines: Map<string, MachineConfig> = new Map();
  private notionConfig: NotionConfigData = {};

  constructor(configPath?: string) {
    // Use provided path for testing, or app data directory for production
    if (configPath) {
      this.configPath = configPath;
      this.notionConfigPath = path.join(path.dirname(configPath), 'notion-config.json');
    } else {
      try {
        const { app } = require('electron');
        const userDataPath = app.getPath('userData');
        this.configPath = path.join(userDataPath, 'machines.json');
        this.notionConfigPath = path.join(userDataPath, 'notion-config.json');
      } catch {
        // Fallback for test environment
        this.configPath = path.join(process.cwd(), 'test-config', 'machines.json');
        this.notionConfigPath = path.join(process.cwd(), 'test-config', 'notion-config.json');
      }
    }
    Logger.info('ConfigStore initialized', { path: this.configPath });
    this.loadNotionConfig();
  }

  /**
   * Load configurations from file
   */
  load(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const configs = JSON.parse(data) as MachineConfig[];
        this.machines = new Map(configs.map(m => [m.id, m]));
        Logger.info('Loaded configurations', { count: this.machines.size });
      } else {
        Logger.info('No existing configuration file found');
        this.machines = new Map();
      }
    } catch (error) {
      Logger.error('Failed to load configuration', error);
      this.machines = new Map();
    }
  }

  /**
   * Save configurations to file
   */
  private save(): void {
    try {
      const configs = Array.from(this.machines.values());
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(configs, null, 2), 'utf-8');
      Logger.debug('Configuration saved');
    } catch (error) {
      Logger.error('Failed to save configuration', error);
    }
  }

  /**
   * Load Notion config from file
   */
  private loadNotionConfig(): void {
    try {
      if (fs.existsSync(this.notionConfigPath)) {
        const data = fs.readFileSync(this.notionConfigPath, 'utf-8');
        this.notionConfig = JSON.parse(data);
        Logger.info('Loaded Notion configuration');
      } else {
        Logger.info('No existing Notion configuration file found');
        this.notionConfig = {};
      }
    } catch (error) {
      Logger.error('Failed to load Notion configuration', error);
      this.notionConfig = {};
    }
  }

  /**
   * Save Notion config to file
   */
  private saveNotionConfig(): void {
    try {
      const dir = path.dirname(this.notionConfigPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.notionConfigPath, JSON.stringify(this.notionConfig, null, 2), 'utf-8');
      Logger.debug('Notion configuration saved');
    } catch (error) {
      Logger.error('Failed to save Notion configuration', error);
    }
  }

  /**
   * Encrypt token for storage (simple obfuscation for test compatibility)
   */
  private encryptToken(token: string): string {
    try {
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), Buffer.alloc(16, 0));
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch {
      // Fallback for test environment
      return Buffer.from(token).toString('base64');
    }
  }

  /**
   * Decrypt token from storage
   */
  private decryptToken(encrypted: string): string {
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), Buffer.alloc(16, 0));
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // Fallback for test environment
      return Buffer.from(encrypted, 'base64').toString('utf8');
    }
  }

  // Machine management methods

  addMachine(input: MachineConfigInput): MachineConfig {
    const id = this.generateId();
    const machine: MachineConfig = {
      ...input,
      id,
      status: 'idle',
      connectionStatus: 'disconnected',
    };
    this.machines.set(id, machine);
    this.save();
    Logger.info('Machine added', { id, name: input.name });
    return machine;
  }

  removeMachine(id: string): boolean {
    const existed = this.machines.delete(id);
    if (existed) {
      this.save();
      Logger.info('Machine removed', { id });
    }
    return existed;
  }

  updateMachine(id: string, updates: Partial<MachineConfigInput>): MachineConfig | null {
    const machine = this.machines.get(id);
    if (!machine) {
      Logger.warn('Machine not found for update', { id });
      return null;
    }

    const updated = { ...machine, ...updates };
    this.machines.set(id, updated);
    this.save();
    Logger.info('Machine updated', { id });
    return updated;
  }

  updateStatus(id: string, status: Partial<Pick<MachineConfig, 'status' | 'connectionStatus' | 'lastUpdate' | 'errorMessage'>>): MachineConfig | null {
    const machine = this.machines.get(id);
    if (!machine) {
      return null;
    }

    const updated = { ...machine, ...status };
    this.machines.set(id, updated);
    return updated;
  }

  getMachines(): MachineConfig[] {
    return Array.from(this.machines.values());
  }

  getMachine(id: string): MachineConfig | undefined {
    return this.machines.get(id);
  }

  // Notion config methods

  setNotionConfig(token: string, databaseId: string): void {
    this.notionConfig = {
      token: this.encryptToken(token),
      databaseId,
      validated: false,
      lastValidated: undefined,
    };
    this.saveNotionConfig();
    Logger.info('Notion configuration saved');
  }

  getNotionConfig(): NotionConfigData | null {
    if (!this.notionConfig.token || !this.notionConfig.databaseId) {
      return null;
    }

    try {
      const token = this.decryptToken(this.notionConfig.token);
      return {
        ...this.notionConfig,
        token,
      };
    } catch (error) {
      Logger.error('Failed to decrypt Notion token', error);
      return null;
    }
  }

  markNotionValidated(validated: boolean): void {
    this.notionConfig.validated = validated;
    this.notionConfig.lastValidated = validated ? Date.now() : undefined;
    this.saveNotionConfig();
  }

  clearNotionConfig(): void {
    this.notionConfig = {};
    this.saveNotionConfig();
    Logger.info('Notion configuration cleared');
  }

  // Utility methods

  private generateId(): string {
    return `machine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCount(): number {
    return this.machines.size;
  }
}

// Export singleton instance
export const configStore = new ConfigStore();
