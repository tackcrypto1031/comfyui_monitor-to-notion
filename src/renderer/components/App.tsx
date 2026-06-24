import React, { useEffect, useState, useCallback } from 'react';
import Header from './Header';
import MachineList from './MachineList';
import StatusBar from './StatusBar';
import AddMachineModal from './AddMachineModal';
import SettingsModal from './SettingsModal';
import { api } from '../api';
import type { ListenStatus, MachineData } from '../../shared/api-types';

const App: React.FC = () => {
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [listenStatus, setListenStatus] = useState<ListenStatus>({
    enabled: false,
    urls: [],
    port: 7890,
    canManage: true,
  });

  // Load initial machines
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const [loadedMachines, loadedListenStatus] = await Promise.all([
          api.getMachines(),
          api.getListenStatus(),
        ]);
        setMachines(loadedMachines);
        setListenStatus(loadedListenStatus);
      } catch (error) {
        console.error('Failed to load app state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialState();
  }, []);

  // Subscribe to status updates
  useEffect(() => {
    let reconnectTimer: number | undefined;
    let unsubscribe: (() => void) | undefined;

    const subscribe = () => {
      unsubscribe = api.subscribe(
        (message) => {
          if (message.type === 'machines:status-update') {
            setMachines(message.data.machines);
          }
          if (message.type === 'listen:status-update') {
            setListenStatus(message.data);
          }
        },
        () => {
          reconnectTimer = window.setTimeout(subscribe, 2000);
        }
      );
    };

    subscribe();

    return () => {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      unsubscribe?.();
    };
  }, []);

  // Handle add machine
  const handleAddMachine = useCallback(async (machineInput: { name: string; ip: string; port: number }) => {
    if (!listenStatus.canManage) {
      return;
    }

    try {
      await api.addMachine(machineInput);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add machine:', error);
      alert('Failed to add machine: ' + (error as Error).message);
    }
  }, [listenStatus.canManage]);

  // Handle remove machine
  const handleRemoveMachine = useCallback(async (id: string) => {
    if (!listenStatus.canManage) {
      return;
    }

    if (!confirm('確定要刪除此機器嗎？')) {
      return;
    }

    try {
      await api.removeMachine(id);
    } catch (error) {
      console.error('Failed to remove machine:', error);
      alert('刪除失敗：' + (error as Error).message);
    }
  }, [listenStatus.canManage]);

  // Handle connect/disconnect
  const handleToggleConnection = useCallback(async (machine: MachineData) => {
    if (!listenStatus.canManage) {
      return;
    }

    try {
      if (machine.connectionStatus === 'connected' || machine.connectionStatus === 'connecting') {
        await api.disconnectMachine(machine.id);
      } else {
        await api.connectMachine(machine.id);
      }
    } catch (error) {
      console.error('Failed to toggle connection:', error);
    }
  }, [listenStatus.canManage]);

  // Handle connect all
  const handleConnectAll = useCallback(async () => {
    if (!listenStatus.canManage) {
      return;
    }

    try {
      await api.connectAll();
    } catch (error) {
      console.error('Failed to connect all:', error);
    }
  }, [listenStatus.canManage]);

  // Handle disconnect all
  const handleDisconnectAll = useCallback(async () => {
    if (!listenStatus.canManage) {
      return;
    }

    try {
      await api.disconnectAll();
    } catch (error) {
      console.error('Failed to disconnect all:', error);
    }
  }, [listenStatus.canManage]);

  const handleToggleListen = useCallback(async () => {
    if (!listenStatus.canManage) {
      return;
    }

    try {
      const status = await api.setListenEnabled(!listenStatus.enabled);
      setListenStatus(status);
    } catch (error) {
      alert('監聽切換失敗：' + (error as Error).message);
    }
  }, [listenStatus.canManage, listenStatus.enabled]);

  const handleCopyListenUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, []);

  return (
    <div className="app">
      <Header
        canManage={listenStatus.canManage}
        listenStatus={listenStatus}
        onAddMachine={() => listenStatus.canManage && setShowAddModal(true)}
        onConnectAll={handleConnectAll}
        onDisconnectAll={handleDisconnectAll}
        onSettings={() => listenStatus.canManage && setShowSettings(true)}
        onToggleListen={handleToggleListen}
        onCopyListenUrl={handleCopyListenUrl}
      />
      
      <main className="main-content">
        <MachineList
          machines={machines}
          loading={loading}
          canManage={listenStatus.canManage}
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
