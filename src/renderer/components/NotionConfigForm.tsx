import React, { useState } from 'react';

interface NotionConfigFormProps {
  initialConfig: {
    configured: boolean;
    validated: boolean;
    databaseId: string | null;
  };
  onSave: () => void;
}

const NotionConfigForm: React.FC<NotionConfigFormProps> = ({ initialConfig, onSave }) => {
  const [token, setToken] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      if (!window.electronAPI) return;
      const result = await window.electronAPI.invoke('notion:test-connection', undefined);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!token.trim() || !databaseId.trim()) {
      alert('請填寫 Token 和資料庫 ID');
      return;
    }

    try {
      if (!window.electronAPI) return;
      const result = await window.electronAPI.invoke('notion:set-config', {
        token: token.trim(),
        databaseId: databaseId.trim(),
      });

      if (result.success) {
        // Test connection after saving
        await handleTestConnection();
        onSave();
      } else {
        alert('儲存失敗：' + result.error);
      }
    } catch (error) {
      alert('儲存失敗');
    }
  };

  const handleClear = async () => {
    if (!confirm('確定要清除 Notion 配置嗎？')) {
      return;
    }

    try {
      if (!window.electronAPI) return;
      await window.electronAPI.invoke('notion:clear-config', undefined);
      setToken('');
      setDatabaseId('');
      setTestResult(null);
      onSave();
    } catch (error) {
      alert('清除失敗');
    }
  };

  return (
    <div className="notion-config-form">
      <div className="form-section">
        <h3>Notion API 配置</h3>
        <p className="form-description">
          配置 Notion API 以自動記錄 ComfyUI 狀態變化
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="token">
          Notion Integration Token
          <span className="required">*</span>
        </label>
        <div className="input-with-button">
          <input
            type={showToken ? 'text' : 'password'}
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="flex-input"
          />
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => setShowToken(!showToken)}
            title={showToken ? '隱藏' : '顯示'}
          >
            {showToken ? '🙈' : '👁️'}
          </button>
        </div>
        <p className="form-help">
          在 <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer">Notion Integrations</a> 建立 Integration
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="databaseId">
          資料庫 ID
          <span className="required">*</span>
        </label>
        <input
          type="text"
          id="databaseId"
          value={databaseId}
          onChange={(e) => setDatabaseId(e.target.value)}
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
        <p className="form-help">
          資料庫 URL 中的 32 字元 ID (不包含破折號)
        </p>
      </div>

      {initialConfig.configured && (
        <div className="config-status">
          <div className="status-item">
            <span className="status-label">配置狀態:</span>
            <span className={`status-badge ${initialConfig.configured ? 'status-success' : 'status-error'}`}>
              {initialConfig.configured ? '已配置' : '未配置'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">驗證狀態:</span>
            <span className={`status-badge ${initialConfig.validated ? 'status-success' : 'status-warning'}`}>
              {initialConfig.validated ? '已驗證' : '未驗證'}
            </span>
          </div>
          {initialConfig.databaseId && (
            <div className="status-item">
              <span className="status-label">資料庫:</span>
              <span className="status-value">{initialConfig.databaseId}</span>
            </div>
          )}
        </div>
      )}

      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          {testResult.success ? (
            <span>✓ 連接成功</span>
          ) : (
            <span>✗ {testResult.error}</span>
          )}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleTestConnection}
          disabled={testing || !token || !databaseId}
        >
          {testing ? '測試中...' : '測試連接'}
        </button>
        
        {initialConfig.configured && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleClear}
          >
            清除配置
          </button>
        )}
        
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!token || !databaseId}
        >
          儲存配置
        </button>
      </div>

      <div className="setup-guide">
        <h4>設置步驟:</h4>
        <ol>
          <li>前往 <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer">Notion Integrations</a></li>
          <li>點擊 "+ New integration" 建立新的 Integration</li>
          <li>選擇工作區，輸入名稱，點擊 "Submit"</li>
          <li>複製 "Internal Integration Token" (Token)</li>
          <li>在 Notion 中建立資料庫，使用模板或自行建立</li>
          <li>點擊資料庫右上角 "···" → "Connect to" → 選擇剛建立的 Integration</li>
          <li>複製資料庫 URL 中的 32 字元 ID (資料庫 ID)</li>
          <li>填入 Token 和資料庫 ID，點擊 "儲存配置"</li>
        </ol>
      </div>
    </div>
  );
};

export default NotionConfigForm;
