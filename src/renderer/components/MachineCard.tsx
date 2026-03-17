import React from 'react';
import type { MachineData } from '../../shared/ipc-types';

interface MachineCardProps {
  machine: MachineData;
  onRemove: (id: string) => void;
  onToggleConnection: (machine: MachineData) => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onRemove, onToggleConnection }) => {
  const getStatusText = (status: MachineData['status']) => {
    // Only show status if connected
    if (machine.connectionStatus === 'disconnected' || machine.connectionStatus === 'error') {
      return '未連接';
    }
    
    switch (status) {
      case 'idle': return '閒置中';
      case 'running': return '運行中';
      case 'generating': return '算圖中';
      default: return status;
    }
  };

  const getConnectionText = (status: MachineData['connectionStatus']) => {
    switch (status) {
      case 'connected': return '已連接';
      case 'connecting': return '連接中...';
      case 'disconnected': return '未連接';
      case 'error': return '錯誤';
      default: return status;
    }
  };

  const formatLastUpdate = (timestamp?: number) => {
    if (!timestamp) return '從未更新';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}秒前`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分鐘前`;
  };

  return (
    <div className={`machine-card ${machine.connectionStatus}`}>
      <div className="machine-card-header">
        <h3 className="machine-name">{machine.name}</h3>
        <div className="machine-actions">
          <button
            className="btn btn-small btn-icon"
            onClick={() => onToggleConnection(machine)}
            title={machine.connectionStatus === 'connected' ? '斷開' : '連接'}
          >
            {machine.connectionStatus === 'connected' ? '🔌' : '🔌'}
          </button>
          <button
            className="btn btn-small btn-icon btn-danger"
            onClick={() => onRemove(machine.id)}
            title="刪除"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="machine-card-body">
        <div className="machine-info">
          <div className="machine-address">
            <span className="label">地址:</span>
            <span className="value">{machine.ip}:{machine.port}</span>
          </div>
          
          <div className="machine-status-row">
            <div className="status-item">
              <span className="label">狀態:</span>
              <span className={`status-badge status-${machine.status}`}>
                {getStatusText(machine.status)}
              </span>
            </div>
            
            <div className="status-item">
              <span className="label">連接:</span>
              <span className={`connection-status connection-${machine.connectionStatus}`}>
                {getConnectionText(machine.connectionStatus)}
              </span>
            </div>
          </div>

          <div className="machine-last-update">
            <span className="label">最後更新:</span>
            <span className="value">{formatLastUpdate(machine.lastUpdate)}</span>
          </div>

          {machine.errorMessage && (
            <div className="machine-error">
              <span className="label">錯誤:</span>
              <span className="value">{machine.errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineCard;
