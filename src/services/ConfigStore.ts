/**
 * Configuration store for machine settings
 */

import fs from 'fs';
import path from 'path';
import { MachineConfig, MachineConfigInput } from '../types/MachineConfig';
import { Logger } from '../utils/Logger';

export class ConfigStore {
  private configPath: string;
  private machines: Map<string, MachineConfig> = new Map();

  constructor(configPath?: string) {
    // Use provided path for testing, or app data directory for production
    if (configPath) {
      this.configPath = configPath;
    } else {
      try {
        const { app } = require('electron');
        const userDataPath = app.getPath('userData');
        this.configPath = path.join(userDataPath, 'machines.json');
      } catch {
        // Fallback for test environment
        this.configPath = path.join(process.cwd(), 'test-config', 'machines.json');
      }
    }
    Logger.info('ConfigStore initialized', { path: this.configPath });
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
   * Add a new machine configuration
   */
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

  /**
   * Remove a machine configuration
   */
  removeMachine(id: string): boolean {
    const existed = this.machines.delete(id);
    if (existed) {
      this.save();
      Logger.info('Machine removed', { id });
    }
    return existed;
  }

  /**
   * Update a machine configuration
   */
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

  /**
   * Update machine status
   */
  updateStatus(id: string, status: Partial<Pick<MachineConfig, 'status' | 'connectionStatus' | 'lastUpdate' | 'errorMessage'>>): MachineConfig | null {
    const machine = this.machines.get(id);
    if (!machine) {
      return null;
    }

    const updated = { ...machine, ...status };
    this.machines.set(id, updated);
    return updated;
  }

  /**
   * Get all machines
   */
  getMachines(): MachineConfig[] {
    return Array.from(this.machines.values());
  }

  /**
   * Get a specific machine
   */
  getMachine(id: string): MachineConfig | undefined {
    return this.machines.get(id);
  }

  /**
   * Generate unique ID for machine
   */
  private generateId(): string {
    return `machine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get machine count
   */
  getCount(): number {
    return this.machines.size;
  }
}

// Export singleton instance
export const configStore = new ConfigStore();
