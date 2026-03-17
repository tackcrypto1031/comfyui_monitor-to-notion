import React, { useEffect, useState, useCallback } from 'react';
import Header from './Header';
import MachineList from './MachineList';
import StatusBar from './StatusBar';
import AddMachineModal from './AddMachineModal';
import SettingsModal from './SettingsModal';
import type { MachineData } from '../../shared/ipc-types';

const App: React.FC = () => {
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load initial machines
  useEffect(() => {
    const loadMachines = async () => {
      try {
        if (!window.electronAPI) return;
        const result = await window.electronAPI.invoke('machines:get', undefined);
        if (result.success && result.data.machines) {
          setMachines(result.data.machines);
        }
      } catch (error) {
        console.error('Failed to load machines:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMachines();
  }, []);

  // Subscribe to status updates
  useEffect(() => {
    if (!window.electronAPI) {
      console.error('electronAPI not available for subscription');
      return;
    }
    console.log('App: Subscribing to machines:status-update');
    const unsubscribe = window.electronAPI.on('machines:status-update', (data) => {
      console.log('App: Received machines:status-update', data.machines?.length, 'machines');
      if (data.machines && data.machines.length > 0) {
        console.log('App: First machine status:', data.machines[0].status);
      }
      setMachines(data.machines);
    });

    return () => {
      console.log('App: Unsubscribing from machines:status-update');
      unsubscribe();
    };
  }, []);

  // Handle add machine
  const handleAddMachine = useCallback(async (machineInput: { name: string; ip: string; port: number }) => {
    console.log('Adding machine:', machineInput);
    
    // Check if electronAPI is available
    const api = (window as any).electronAPI;
    if (!api) {
      console.error('electronAPI not found on window');
      alert('electronAPI not available - please check preload script');
      return;
    }
    
    try {
      console.log('Invoking machines:add via electronAPI...');
      const result = await api.invoke('machines:add', machineInput);
      console.log('Result:', result);
      
      if (result && result.success) {
        setShowAddModal(false);
      } else {
        alert('Failed to add machine: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add machine:', error);
      alert('Failed to add machine: ' + (error as Error).message);
    }
  }, []);

  // Handle remove machine
  const handleRemoveMachine = useCallback(async (id: string) => {
    if (!confirm('確定要刪除此機器嗎？')) {
      return;
    }

    try {
      const api = (window as any).electronAPI;
      if (!api) {
        alert('electronAPI not available');
        return;
      }
      
      const result = await api.invoke('machines:remove', { id });
      if (!result || !result.success) {
        alert('刪除失敗：' + (result?.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('Failed to remove machine:', error);
      alert('刪除失敗：' + (error as Error).message);
    }
  }, []);

  // Handle connect/disconnect
  const handleToggleConnection = useCallback(async (machine: MachineData) => {
    const api = (window as any).electronAPI;
    if (!api) {
      console.error('electronAPI not available');
      return;
    }
    
    try {
      if (machine.connectionStatus === 'connected' || machine.connectionStatus === 'connecting') {
        await api.invoke('machines:disconnect', { id: machine.id });
      } else {
        // Connect is async, status will update via event
        await api.invoke('machines:connect', { id: machine.id });
      }
    } catch (error) {
      console.error('Failed to toggle connection:', error);
      // Don't show error popup - status will update in UI
    }
  }, []);

  // Handle connect all
  const handleConnectAll = useCallback(async () => {
    try {
      if (!window.electronAPI) return;
      await window.electronAPI.invoke('machines:connect-all', undefined);
    } catch (error) {
      console.error('Failed to connect all:', error);
    }
  }, []);

  // Handle disconnect all
  const handleDisconnectAll = useCallback(async () => {
    try {
      if (!window.electronAPI) return;
      await window.electronAPI.invoke('machines:disconnect-all', undefined);
    } catch (error) {
      console.error('Failed to disconnect all:', error);
    }
  }, []);

  return (
    <div className="app">
      <Header
        onAddMachine={() => setShowAddModal(true)}
        onConnectAll={handleConnectAll}
        onDisconnectAll={handleDisconnectAll}
        onSettings={() => setShowSettings(true)}
      />
      
      <main className="main-content">
        <MachineList
          machines={machines}
          loading={loading}
          onRemove={handleRemoveMachine}
          onToggleConnection={handleToggleConnection}
        />
      </main>

      <StatusBar machines={machines} />

      {showAddModal && (
        <AddMachineModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMachine}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;
