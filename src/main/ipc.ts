/**
 * IPC Handler - Main process
 */

import { ipcMain, BrowserWindow } from 'electron';
import { configStore } from '../services/ConfigStore';
import { webSocketManager } from '../services/WebSocketManager';
import { statusEngine } from '../services/StatusEngine';
import { eventBus } from '../services/EventBus';
import { notionClient } from '../services/NotionClient';
import { ComfyUIClient } from '../services/ComfyUIClient';
import { MachineConfig } from '../types/MachineConfig';
import type { MachineData, IPCPayload } from '../shared/ipc-types';

// Store HTTP polling clients
const httpClients = new Map<string, ComfyUIClient>();

// Subscribe to WebSocket messages and forward to StatusEngine
eventBus.on('websocket:message', (data: { machineId: string; message: any }) => {
  statusEngine.processMessage(data.machineId, data.message);
});

// Subscribe to status updates and forward to renderer
eventBus.on('machine:status-update', (data: { machines: any[] }) => {
  data.machines.forEach((m: any) => {
    const machine = configStore.getMachine(m.id);
    if (machine) {
      configStore.updateStatus(m.id, {
        status: m.status,
        connectionStatus: m.connectionStatus,
        lastUpdate: m.lastUpdate
      });
    }
  });
});

let mainWindowRef: BrowserWindow | null = null;

export function broadcastMachinesUpdate() {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    const machines = configStore.getMachines().map(toMachineData);
    mainWindowRef.webContents.send('machines:status-update', { machines });
    machines.forEach((m: any) => {
      eventBus.emit('notion:check-status', { machineId: m.id, status: m.status });
    });
  }
}

// Subscribe to status changes from StatusEngine and forward to renderer
eventBus.on('machine:status-change', (data: { machineId: string; status: any; previousStatus: any }) => {
  const machine = configStore.getMachine(data.machineId);
  if (machine) {
    configStore.updateStatus(data.machineId, {
      status: data.status,
      lastUpdate: Date.now()
    });
    broadcastMachinesUpdate();
  }
});

// Subscribe to HTTP polling status updates and directly send to renderer
eventBus.on('comfyui:status-change', (data: { machineId: string; status: any }) => {
  const machine = configStore.getMachine(data.machineId);
  if (machine) {
    let newStatus = 'idle';
    if (data.status.isExecuting) {
      newStatus = 'generating';
    } else if (data.status.queueRemaining > 0) {
      newStatus = 'running';
    }

    configStore.updateStatus(data.machineId, {
      status: newStatus as any,
      lastUpdate: Date.now()
    });
    broadcastMachinesUpdate();
  }
});

export function setupIPC(mainWindow: BrowserWindow) {
  mainWindowRef = mainWindow;
  

  // Helper to send data to renderer
  const sendToRenderer = <T extends keyof IPCPayload>(channel: T, data: IPCPayload[T]) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data);
      
    }
  };

  eventBus.on('machine:connected', (payload) => {
    sendToRenderer('machines:connected', payload);
    broadcastMachinesUpdate();
  });

  eventBus.on('machine:disconnected', (payload) => {
    sendToRenderer('machines:disconnected', payload);
    broadcastMachinesUpdate();
  });

  eventBus.on('machine:error', (payload) => {
    sendToRenderer('machines:error', payload);
    broadcastMachinesUpdate();
  });

  // IPC Handlers

  // Get all machines
  ipcMain.handle('machines:get', () => {
    
    const machines = configStore.getMachines().map(toMachineData);
    return { success: true, data: { machines } };
  });

  // Add machine
  ipcMain.handle('machines:add', (event, payload: IPCPayload['machines:add']) => {
    try {
      const machine = configStore.addMachine(payload);
      
      // Start HTTP polling for status
      const httpClient = new ComfyUIClient(machine.id, machine.ip, machine.port);
      httpClient.startPolling();
      httpClients.set(machine.id, httpClient);
      
      // Also connect WebSocket for connection status
      webSocketManager.connect(machine.id, machine.ip, machine.port);
      
      return { success: true, data: { machine: toMachineData(machine) } };
    } catch (error) {
      return { success: false, error: 'Failed to add machine' };
    }
  });

  // Remove machine
  ipcMain.handle('machines:remove', (event, payload: IPCPayload['machines:remove']) => {
    try {
      // Stop HTTP polling
      const httpClient = httpClients.get(payload.id);
      if (httpClient) {
        httpClient.stopPolling();
        httpClients.delete(payload.id);
      }
      
      // Disconnect WebSocket
      webSocketManager.disconnect(payload.id);
      
      // Reset status engine
      statusEngine.reset(payload.id);
      
      // Remove from config
      const removed = configStore.removeMachine(payload.id);
      
      if (removed) {
        // Send updated list to renderer
        const machines = configStore.getMachines().map(toMachineData);
        sendToRenderer('machines:status-update', { machines });
        return { success: true, data: { removed: true } };
      } else {
        return { success: false, error: 'Machine not found' };
      }
    } catch (error) {
      
      return { success: false, error: 'Failed to remove machine' };
    }
  });

  // Update machine
  ipcMain.handle('machines:update', (event, payload: IPCPayload['machines:update']) => {
    try {
      
      const machine = configStore.updateMachine(payload.id, payload.updates);
      if (!machine) {
        return { success: false, error: 'Machine not found' };
      }
      return { success: true, data: { machine: toMachineData(machine) } };
    } catch (error) {
      
      return { success: false, error: 'Failed to update machine' };
    }
  });

  // Connect to machine
  ipcMain.handle('machines:connect', (event, payload: IPCPayload['machines:connect']) => {
    const machine = configStore.getMachine(payload.id);
    if (!machine) {
      return { success: false, error: 'Machine not found' };
    }
    
    // Connection is async - errors are handled by WebSocketManager
    // Don't wait for connection result, just start the connection
    webSocketManager.connect(machine.id, machine.ip, machine.port);
    
    let httpClient = httpClients.get(machine.id);
    if (!httpClient) {
      httpClient = new ComfyUIClient(machine.id, machine.ip, machine.port);
      httpClients.set(machine.id, httpClient);
    }
    // Start polling to catch state, even for existing machines
    httpClient.startPolling();
    
    return { success: true };
  });

  // Disconnect from machine
  ipcMain.handle('machines:disconnect', (event, payload: IPCPayload['machines:disconnect']) => {
    try {
      webSocketManager.disconnect(payload.id);
      
      const httpClient = httpClients.get(payload.id);
      if (httpClient) {
        httpClient.stopPolling();
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to disconnect' };
    }
  });

  // Connect to all machines
  ipcMain.handle('machines:connect-all', () => {
    try {
      
      const machines = configStore.getMachines();
      machines.forEach((machine: MachineConfig) => {
        webSocketManager.connect(machine.id, machine.ip, machine.port);
        
        let httpClient = httpClients.get(machine.id);
        if (!httpClient) {
          httpClient = new ComfyUIClient(machine.id, machine.ip, machine.port);
          httpClients.set(machine.id, httpClient);
        }
        httpClient.startPolling();
      });
      return { success: true, data: { count: machines.length } };
    } catch (error) {
      
      return { success: false, error: 'Failed to connect all' };
    }
  });

  // Disconnect from all machines
  ipcMain.handle('machines:disconnect-all', () => {
    try {
      
      webSocketManager.disconnectAll();
      
      httpClients.forEach(client => client.stopPolling());

      return { success: true };
    } catch (error) {
      
      return { success: false, error: 'Failed to disconnect all' };
    }
  });

  // Notion: Get config
  ipcMain.handle('notion:get-config', () => {
    try {
      
      const config = configStore.getNotionConfig();
      return { 
        success: true, 
        data: { 
          configured: !!config,
          validated: config?.validated || false,
          databaseId: config?.databaseId ? config.databaseId.substring(0, 8) + '...' : null,
        }
      };
    } catch (error) {
      
      return { success: false, error: 'Failed to get Notion config' };
    }
  });

  // Notion: Set config
  ipcMain.handle('notion:set-config', (event, payload: IPCPayload['notion:set-config']) => {
    try {
      
      configStore.setNotionConfig(payload.token, payload.databaseId);
      
      // Initialize Notion client with new config
      const config = configStore.getNotionConfig();
      if (config && config.token && config.databaseId) {
        notionClient.init({
          token: config.token,
          databaseId: config.databaseId,
        });
      }
      
      return { success: true };
    } catch (error) {
      
      return { success: false, error: 'Failed to set Notion config' };
    }
  });

  // Notion: Test connection
  ipcMain.handle('notion:test-connection', async () => {
    try {
      
      const result = await notionClient.testConnection();
      
      if (result.success) {
        configStore.markNotionValidated(true);
      }
      
      return { success: result.success, error: result.error };
    } catch (error) {
      
      return { success: false, error: 'Connection test failed' };
    }
  });

  // Notion: Clear config
  ipcMain.handle('notion:clear-config', () => {
    try {
      
      configStore.clearNotionConfig();
      notionClient.reset();
      return { success: true };
    } catch (error) {
      
      return { success: false, error: 'Failed to clear Notion config' };
    }
  });

  
}

/**
 * Convert MachineConfig to MachineData for IPC
 */
function toMachineData(config: MachineConfig): MachineData {
  // Update status from StatusEngine
  const engineStatus = statusEngine.getStatus(config.id);
  const wsStatus = webSocketManager.getStatus(config.id);
  const httpClient = httpClients.get(config.id);
  const httpStatusObj = httpClient?.getCurrentStatus();
  
  let finalStatus = engineStatus;
  
  // Aggregate HTTP polling status to avoid it being overridden by idle WebSocket state
  if (httpStatusObj) {
    let httpStatus: typeof engineStatus = 'idle';
    if (httpStatusObj.isExecuting) {
      httpStatus = 'generating';
    } else if (httpStatusObj.queueRemaining > 0) {
      httpStatus = 'running';
    }
    
    // Priority: generating > running > idle
    if (httpStatus === 'generating' || engineStatus === 'generating') {
      finalStatus = 'generating';
    } else if (httpStatus === 'running' || engineStatus === 'running') {
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
