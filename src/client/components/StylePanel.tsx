import { useState, useEffect } from 'react';
import { MindMapNode } from '../../shared/types/mindmap';
import { colorThemes } from '../utils/colorTheme';

interface StylePanelProps {
  node: MindMapNode | null;
  onStyleChange: (nodeId: string, style: MindMapNode['style']) => void;
}

const colors = [
  '#333333', '#666666', '#999999', '#cccccc',
  '#e53935', '#d81b60', '#8e24aa', '#5e35b1',
  '#3949ab', '#1e88e5', '#039be5', '#00acc1',
  '#00897b', '#43a047', '#7cb342', '#c0ca33',
  '#fdd835', '#ffb300', '#fb8c00', '#f4511e',
];

// 添加预设渐变
const gradients = [
  'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
  'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  'linear-gradient(135deg, #FFFDE7, #FFF9C4)',
  'linear-gradient(135deg, #FCE4EC, #F8BBD9)',
  'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
  'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
];

function StylePanel({ node, onStyleChange }: StylePanelProps) {
  const [localStyle, setLocalStyle] = useState(node?.style || {});

  useEffect(() => {
    setLocalStyle(node?.style || {});
  }, [node]);

  if (!node) {
    return (
      <div style={{
        width: 240,
        height: '100%',
        background: '#fafafa',
        borderLeft: '1px solid #e0e0e0',
        padding: '16px',
      }}>
        <p style={{ color: '#999', fontSize: '14px' }}>选择一个节点来编辑样式</p>
      </div>
    );
  }

  const handleStyleChange = (key: string, value: any) => {
    const newStyle = { ...localStyle, [key]: value };
    setLocalStyle(newStyle);
    onStyleChange(node.id, newStyle);
  };

  const panelStyle: React.CSSProperties = {
    width: 240,
    height: '100%',
    background: '#fafafa',
    borderLeft: '1px solid #e0e0e0',
    padding: '16px',
    overflowY: 'auto',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '8px',
  };

  const colorSwatchStyle = (color: string): React.CSSProperties => ({
    width: 24,
    height: 24,
    borderRadius: 4,
    background: color,
    cursor: 'pointer',
    border: localStyle.color === color ? '2px solid #4a90d9' : '1px solid #ddd',
  });

  const bgSwatchStyle = (color: string): React.CSSProperties => ({
    width: 24,
    height: 24,
    borderRadius: 4,
    background: color,
    cursor: 'pointer',
    border: localStyle.backgroundColor === color ? '2px solid #4a90d9' : '1px solid #ddd',
  });

  return (
    <div style={panelStyle}>
      <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>节点样式</h3>

      {/* 文字颜色 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>文字颜色</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {colors.map(color => (
            <div
              key={color}
              style={colorSwatchStyle(color)}
              onClick={() => handleStyleChange('color', color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 背景颜色 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>背景颜色</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {['#ffffff', '#fff9c4', '#fff3e0', '#e8f5e9', '#e3f2fd', '#fce4ec', '#f3e5f5'].map(color => (
            <div
              key={color}
              style={bgSwatchStyle(color)}
              onClick={() => handleStyleChange('backgroundColor', color)}
              title={color}
            />
          ))}
          {colors.map(color => (
            <div
              key={color}
              style={bgSwatchStyle(color)}
              onClick={() => handleStyleChange('backgroundColor', color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 边框颜色 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>边框颜色</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {colors.map(color => (
            <div
              key={color}
              style={{
                ...colorSwatchStyle(color),
                border: localStyle.borderColor === color ? '2px solid #4a90d9' : '1px solid #ddd',
              }}
              onClick={() => handleStyleChange('borderColor', color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 渐变背景 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>渐变背景</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {gradients.map(gradient => (
            <div
              key={gradient}
              style={{
                width: 48,
                height: 24,
                borderRadius: 4,
                background: gradient,
                cursor: 'pointer',
                border: localStyle.gradient === gradient ? '2px solid #4a90d9' : '1px solid #ddd',
              }}
              onClick={() => handleStyleChange('gradient', gradient)}
              title={gradient}
            />
          ))}
        </div>
      </div>

      {/* 字体样式 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>字体样式</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleStyleChange('bold', !localStyle.bold)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: localStyle.bold ? '#4a90d9' : '#fff',
              color: localStyle.bold ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            B
          </button>
          <button
            onClick={() => handleStyleChange('italic', !localStyle.italic)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: localStyle.italic ? '#4a90d9' : '#fff',
              color: localStyle.italic ? '#fff' : '#333',
              cursor: 'pointer',
              fontStyle: 'italic',
            }}
          >
            I
          </button>
        </div>
      </div>

      {/* 字体大小 */}
      <div style={sectionStyle}>
        <label style={labelStyle}>字体大小: {localStyle.fontSize || 14}px</label>
        <input
          type="range"
          min="10"
          max="24"
          value={localStyle.fontSize || 14}
          onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* 重置按钮 */}
      <div style={sectionStyle}>
        <button
          onClick={() => {
            setLocalStyle({});
            onStyleChange(node.id, {});
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          重置样式
        </button>
      </div>
    </div>
  );
}

export default StylePanel;
