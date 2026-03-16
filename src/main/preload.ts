import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI, MainToRendererChannel, RendererToMainChannel, IPCPayload } from '../shared/ipc-types';

const electronAPI: ElectronAPI = {
  // Invoke (Renderer → Main with response)
  invoke: async (channel, payload) => {
    const validChannels: RendererToMainChannel[] = [
      'machines:get',
      'machines:add',
      'machines:remove',
      'machines:update',
      'machines:connect',
      'machines:disconnect',
      'machines:connect-all',
      'machines:disconnect-all'
    ];

    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }

    try {
      const result = await ipcRenderer.invoke(channel, payload);
      return result;
    } catch (error) {
      console.error('IPC invoke error:', error);
      return { success: false, error: 'IPC communication failed' };
    }
  },

  // Subscribe (Main → Renderer events)
  on: (channel, callback) => {
    const validChannels: MainToRendererChannel[] = [
      'machines:status-update',
      'machines:connected',
      'machines:disconnected',
      'machines:error'
    ];

    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }

    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on(channel, subscription);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  platform: process.platform,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Preload script loaded, electronAPI exposed');
