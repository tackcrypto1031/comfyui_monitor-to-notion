import React from 'react';
import type { MachineData } from '../../shared/api-types';

interface StatusBarProps {
  machines: MachineData[];
}

const StatusBar: React.FC<StatusBarProps> = ({ machines }) => {
  const connectedCount = machines.filter(m => m.connectionStatus === 'connected').length;
  const totalMachines = machines.length;
  const idleCount = machines.filter(m => m.status === 'idle').length;
  const runningCount = machines.filter(m => m.status === 'running').length;
  const generatingCount = machines.filter(m => m.status === 'generating').length;

  return (
    <footer className="status-bar">
      <div className="status-bar-section">
        <span className="status-bar-label">機器總數:</span>
        <span className="status-bar-value">{totalMachines}</span>
      </div>
      
      <div className="status-bar-section">
        <span className="status-bar-label">已連接:</span>
        <span className="status-bar-value connected">{connectedCount}</span>
      </div>

      <div className="status-bar-divider"></div>

      <div className="status-bar-section">
        <span className="status-bar-label">閒置:</span>
        <span className="status-badge-mini status-idle">{idleCount}</span>
      </div>

      <div className="status-bar-section">
        <span className="status-bar-label">運行:</span>
        <span className="status-badge-mini status-running">{runningCount}</span>
      </div>

      <div className="status-bar-section">
        <span className="status-bar-label">算圖:</span>
        <span className="status-badge-mini status-generating">{generatingCount}</span>
      </div>

      <div className="status-bar-right">
        <span className="status-bar-timestamp">
          {new Date().toLocaleTimeString('zh-TW')}
        </span>
      </div>
    </footer>
  );
};

export default StatusBar;
