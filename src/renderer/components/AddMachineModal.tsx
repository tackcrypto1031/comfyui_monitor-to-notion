import React, { useState } from 'react';

interface AddMachineModalProps {
  onClose: () => void;
  onAdd: (machine: { name: string; ip: string; port: number }) => void;
}

const AddMachineModal: React.FC<AddMachineModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('8188');
  const [errors, setErrors] = useState<{ name?: string; ip?: string; port?: string }>({});

  const validateIP = (ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  };

  const validate = (): boolean => {
    const newErrors: { name?: string; ip?: string; port?: string } = {};

    if (!name.trim()) {
      newErrors.name = '請輸入名稱';
    } else if (name.length > 50) {
      newErrors.name = '名稱不能超過 50 字元';
    }

    if (!ip.trim()) {
      newErrors.ip = '請輸入 IP 地址';
    } else if (!validateIP(ip)) {
      newErrors.ip = '請輸入有效的 IPv4 地址';
    }

    if (!port) {
      newErrors.port = '請輸入埠號';
    } else {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        newErrors.port = '埠號必須在 1-65535 之間';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onAdd({
      name: name.trim(),
      ip: ip.trim(),
      port: parseInt(port, 10),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>添加機器</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="name">名稱</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：ComfyUI-01"
              className={errors.name ? 'error' : ''}
              autoFocus
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ip">IP 地址</label>
            <input
              type="text"
              id="ip"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.100"
              className={errors.ip ? 'error' : ''}
            />
            {errors.ip && <span className="error-message">{errors.ip}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="port">埠號</label>
            <input
              type="number"
              id="port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="8188"
              min="1"
              max="65535"
              className={errors.port ? 'error' : ''}
            />
            {errors.port && <span className="error-message">{errors.port}</span>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMachineModal;
