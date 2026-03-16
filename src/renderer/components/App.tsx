import React, { useEffect, useState, useCallback } from 'react';
import Header from './Header';
import MachineList from './MachineList';
import StatusBar from './StatusBar';
import AddMachineModal from './AddMachineModal';
import type { MachineData } from '../../shared/ipc-types';

const App: React.FC = () => {
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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
    if (!window.electronAPI) return;
    const unsubscribe = window.electronAPI.on('machines:status-update', (data) => {
      setMachines(data.machines);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle add machine
  const handleAddMachine = useCallback(async (machineInput: { name: string; ip: string; port: number }) => {
    try {
      if (!window.electronAPI) return;
      const result = await window.electronAPI.invoke('machines:add', machineInput);
      if (result.success) {
        setShowAddModal(false);
      } else {
        alert('Failed to add machine: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to add machine:', error);
      alert('Failed to add machine');
    }
  }, []);

  // Handle remove machine
  const handleRemoveMachine = useCallback(async (id: string) => {
    if (!confirm('確定要刪除此機器嗎？')) {
      return;
    }

    try {
      if (!window.electronAPI) return;
      const result = await window.electronAPI.invoke('machines:remove', { id });
      if (!result.success) {
        alert('Failed to remove machine: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to remove machine:', error);
      alert('Failed to remove machine');
    }
  }, []);

  // Handle connect/disconnect
  const handleToggleConnection = useCallback(async (machine: MachineData) => {
    try {
      if (!window.electronAPI) return;
      if (machine.connectionStatus === 'connected' || machine.connectionStatus === 'connecting') {
        await window.electronAPI.invoke('machines:disconnect', { id: machine.id });
      } else {
        await window.electronAPI.invoke('machines:connect', { id: machine.id });
      }
    } catch (error) {
      console.error('Failed to toggle connection:', error);
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
    </div>
  );
};

export default App;
