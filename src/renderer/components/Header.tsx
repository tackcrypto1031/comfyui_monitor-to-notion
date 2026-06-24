import React from 'react';
import type { ListenStatus } from '../../shared/api-types';

interface HeaderProps {
  canManage: boolean;
  listenStatus: ListenStatus;
  onAddMachine: () => void;
  onConnectAll: () => void;
  onDisconnectAll: () => void;
  onSettings: () => void;
  onToggleListen: () => void;
  onCopyListenUrl: (url: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  canManage,
  listenStatus,
  onAddMachine,
  onConnectAll,
  onDisconnectAll,
  onSettings,
  onToggleListen,
  onCopyListenUrl,
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">塔克小工具 / 內網comfui運行監控</h1>
        <span className="header-subtitle">{canManage ? '本機管理' : '內網只讀查看'}</span>
      </div>

      <div className="listen-panel">
        <div className={`listen-state ${listenStatus.enabled ? 'enabled' : 'disabled'}`}>
          <span className="listen-dot"></span>
          <span>{listenStatus.enabled ? '監聽已開啟' : '監聽未開啟'}</span>
        </div>
        {listenStatus.urls.length > 0 && (
          <div className="listen-urls">
            {listenStatus.urls.map((url) => (
              <button
                key={url}
                className="listen-url"
                type="button"
                onClick={() => onCopyListenUrl(url)}
                title="複製分享網址"
              >
                {url}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="header-actions">
        {canManage && (
          <>
            <button className="btn btn-secondary" onClick={onToggleListen}>
              {listenStatus.enabled ? '關閉監聽' : '開啟監聽'}
            </button>
            <button className="btn btn-secondary" onClick={onSettings}>
              設定
            </button>
            <button className="btn btn-secondary" onClick={onConnectAll}>
              全部連接
            </button>
            <button className="btn btn-secondary" onClick={onDisconnectAll}>
              全部斷開
            </button>
            <button className="btn btn-primary" onClick={onAddMachine}>
              添加機器
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
