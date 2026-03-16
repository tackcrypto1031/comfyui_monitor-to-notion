/**
 * IPC Handler - Main process
 */

import { ipcMain, BrowserWindow } from 'electron';
import { configStore } from '../services/ConfigStore';
import { webSocketManager } from '../services/WebSocketManager';
import { statusEngine } from '../services/StatusEngine';
import { eventBus } from '../services/EventBus';
import { Logger } from '../utils/Logger';
import { MachineConfig } from '../types/MachineConfig';
import type { MachineData, IPCPayload } from '../shared/ipc-types';

export function setupIPC(mainWindow: BrowserWindow) {
  Logger.info('Setting up IPC handlers');

  // Helper to send data to renderer
  const sendToRenderer = <T extends keyof IPCPayload>(channel: T, data: IPCPayload[T]) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data);
      Logger.debug('Sent to renderer', { channel, data });
    }
  };

  // Subscribe to EventBus events and forward to renderer
  eventBus.on('machine:status-change', (_payload) => {
    const machines = configStore.getMachines().map(toMachineData);
    sendToRenderer('machines:status-update', { machines });
  });

  eventBus.on('machine:connected', (payload) => {
    sendToRenderer('machines:connected', payload);
    const machines = configStore.getMachines().map(toMachineData);
    sendToRenderer('machines:status-update', { machines });
  });

  eventBus.on('machine:disconnected', (payload) => {
    sendToRenderer('machines:disconnected', payload);
    const machines = configStore.getMachines().map(toMachineData);
    sendToRenderer('machines:status-update', { machines });
  });

  eventBus.on('machine:error', (payload) => {
    sendToRenderer('machines:error', payload);
    const machines = configStore.getMachines().map(toMachineData);
    sendToRenderer('machines:status-update', { machines });
  });

  // IPC Handlers

  // Get all machines
  ipcMain.handle('machines:get', () => {
    Logger.debug('IPC: machines:get');
    const machines = configStore.getMachines().map(toMachineData);
    return { success: true, data: { machines } };
  });

  // Add machine
  ipcMain.handle('machines:add', (event, payload: IPCPayload['machines:add']) => {
    try {
      Logger.info('IPC: machines:add', payload);
      const machine = configStore.addMachine(payload);
      
      // Auto-connect to the new machine
      webSocketManager.connect(machine.id, machine.ip, machine.port);
      
      return { success: true, data: { machine: toMachineData(machine) } };
    } catch (error) {
      Logger.error('IPC: machines:add failed', error);
      return { success: false, error: 'Failed to add machine' };
    }
  });

  // Remove machine
  ipcMain.handle('machines:remove', (event, payload: IPCPayload['machines:remove']) => {
    try {
      Logger.info('IPC: machines:remove', payload);
      webSocketManager.disconnect(payload.id);
      statusEngine.reset(payload.id);
      const removed = configStore.removeMachine(payload.id);
      return { success: true, data: { removed } };
    } catch (error) {
      Logger.error('IPC: machines:remove failed', error);
      return { success: false, error: 'Failed to remove machine' };
    }
  });

  // Update machine
  ipcMain.handle('machines:update', (event, payload: IPCPayload['machines:update']) => {
    try {
      Logger.info('IPC: machines:update', payload);
      const machine = configStore.updateMachine(payload.id, payload.updates);
      if (!machine) {
        return { success: false, error: 'Machine not found' };
      }
      return { success: true, data: { machine: toMachineData(machine) } };
    } catch (error) {
      Logger.error('IPC: machines:update failed', error);
      return { success: false, error: 'Failed to update machine' };
    }
  });

  // Connect to machine
  ipcMain.handle('machines:connect', (event, payload: IPCPayload['machines:connect']) => {
    try {
      Logger.info('IPC: machines:connect', payload);
      const machine = configStore.getMachine(payload.id);
      if (!machine) {
        return { success: false, error: 'Machine not found' };
      }
      webSocketManager.connect(machine.id, machine.ip, machine.port);
      return { success: true };
    } catch (error) {
      Logger.error('IPC: machines:connect failed', error);
      return { success: false, error: 'Failed to connect' };
    }
  });

  // Disconnect from machine
  ipcMain.handle('machines:disconnect', (event, payload: IPCPayload['machines:disconnect']) => {
    try {
      Logger.info('IPC: machines:disconnect', payload);
      webSocketManager.disconnect(payload.id);
      return { success: true };
    } catch (error) {
      Logger.error('IPC: machines:disconnect failed', error);
      return { success: false, error: 'Failed to disconnect' };
    }
  });

  // Connect to all machines
  ipcMain.handle('machines:connect-all', () => {
    try {
      Logger.info('IPC: machines:connect-all');
      const machines = configStore.getMachines();
      machines.forEach((machine: MachineConfig) => {
        webSocketManager.connect(machine.id, machine.ip, machine.port);
      });
      return { success: true, data: { count: machines.length } };
    } catch (error) {
      Logger.error('IPC: machines:connect-all failed', error);
      return { success: false, error: 'Failed to connect all' };
    }
  });

  // Disconnect from all machines
  ipcMain.handle('machines:disconnect-all', () => {
    try {
      Logger.info('IPC: machines:disconnect-all');
      webSocketManager.disconnectAll();
      return { success: true };
    } catch (error) {
      Logger.error('IPC: machines:disconnect-all failed', error);
      return { success: false, error: 'Failed to disconnect all' };
    }
  });

  Logger.info('IPC handlers setup complete');
}

/**
 * Convert MachineConfig to MachineData for IPC
 */
function toMachineData(config: MachineConfig): MachineData {
  // Update status from StatusEngine
  const engineStatus = statusEngine.getStatus(config.id);
  const wsStatus = webSocketManager.getStatus(config.id);
  
  return {
    ...config,
    status: engineStatus,
    connectionStatus: wsStatus,
    lastUpdate: config.lastUpdate,
    errorMessage: config.errorMessage,
  };
}
