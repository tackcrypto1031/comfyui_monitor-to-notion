import React from 'react';

interface HeaderProps {
  onAddMachine: () => void;
  onConnectAll: () => void;
  onDisconnectAll: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddMachine, onConnectAll, onDisconnectAll }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">ComfyUI Monitor</h1>
        <span className="header-subtitle">內網監控工具</span>
      </div>
      
      <div className="header-actions">
        <button className="btn btn-secondary" onClick={onConnectAll}>
          全部連接
        </button>
        <button className="btn btn-secondary" onClick={onDisconnectAll}>
          全部斷開
        </button>
        <button className="btn btn-primary" onClick={onAddMachine}>
          + 添加機器
        </button>
      </div>
    </header>
  );
};

export default Header;
