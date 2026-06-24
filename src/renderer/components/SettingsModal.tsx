import React, { useState, useEffect } from 'react';
import NotionConfigForm from './NotionConfigForm';
import { api } from '../api';

interface SettingsModalProps {
  onClose: () => void;
}

interface NotionConfigStatus {
  configured: boolean;
  validated: boolean;
  databaseId: string | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [notionConfig, setNotionConfig] = useState<NotionConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notion'>('notion');

  useEffect(() => {
    loadNotionConfig();
  }, []);

  const loadNotionConfig = async () => {
    try {
      const result = await api.getNotionConfig();
      setNotionConfig(result);
    } catch (error) {
      console.error('Failed to load Notion config:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>設定</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'notion' ? 'active' : ''}`}
            onClick={() => setActiveTab('notion')}
          >
            Notion 整合
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>載入中...</p>
            </div>
          ) : (
            <>
              {activeTab === 'notion' && notionConfig && (
                <NotionConfigForm
                  initialConfig={notionConfig}
                  onSave={loadNotionConfig}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
