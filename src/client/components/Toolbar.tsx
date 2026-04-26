import { useState } from 'react';

interface ToolbarProps {
  onInsertIcon: (icon?: string) => void;
  onInsertImage: () => void;
  onChangeLayout: (layout: 'tree' | 'radial' | 'org') => void;
  currentLayout: string;
}

const presets = ['🔷', '⭐', '💡', '📌', '⚡', '🎯', '📎', '✅', '❌', '❤️'];

function Toolbar({ onInsertIcon, onInsertImage, onChangeLayout, currentLayout }: ToolbarProps) {
  const [activeTab, setActiveTab] = useState<'insert' | 'layout'>('insert');

  const handleIconSelect = (icon: string) => {
    onInsertIcon(icon);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-tabs">
        <button
          className={activeTab === 'insert' ? 'active' : ''}
          onClick={() => setActiveTab('insert')}
        >
          插入
        </button>
        <button
          className={activeTab === 'layout' ? 'active' : ''}
          onClick={() => setActiveTab('layout')}
        >
          布局
        </button>
      </div>

      {activeTab === 'insert' && (
        <div className="toolbar-content">
          <div className="toolbar-section">
            <label>图标</label>
            <div className="icon-grid">
              {presets.map(icon => (
                <button
                  key={icon}
                  onClick={() => handleIconSelect(icon)}
                  className="icon-btn"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <button className="toolbar-btn" onClick={onInsertImage}>
            <span>🖼️</span> 插入图片
          </button>
        </div>
      )}

      {activeTab === 'layout' && (
        <div className="toolbar-content">
          <button
            className={`layout-btn ${currentLayout === 'tree' ? 'active' : ''}`}
            onClick={() => onChangeLayout('tree')}
          >
            思维导图
          </button>
          <button
            className={`layout-btn ${currentLayout === 'org' ? 'active' : ''}`}
            onClick={() => onChangeLayout('org')}
          >
            组织图
          </button>
          <button
            className={`layout-btn ${currentLayout === 'radial' ? 'active' : ''}`}
            onClick={() => onChangeLayout('radial')}
          >
            放射状
          </button>
        </div>
      )}
    </div>
  );
}

export default Toolbar;
