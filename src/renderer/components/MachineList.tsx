import React from 'react';
import type { MachineData } from '../../shared/ipc-types';
import MachineCard from './MachineCard';

interface MachineListProps {
  machines: MachineData[];
  loading: boolean;
  onRemove: (id: string) => void;
  onToggleConnection: (machine: MachineData) => void;
}

const MachineList: React.FC<MachineListProps> = ({
  machines,
  loading,
  onRemove,
  onToggleConnection,
}) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🖥️</div>
        <h3>尚未添加機器</h3>
        <p>點擊右上角的「添加機器」按鈕開始監控 ComfyUI</p>
      </div>
    );
  }

  return (
    <div className="machine-list">
      {machines.map((machine) => (
        <MachineCard
          key={machine.id}
          machine={machine}
          onRemove={onRemove}
          onToggleConnection={onToggleConnection}
        />
      ))}
    </div>
  );
};

export default MachineList;
