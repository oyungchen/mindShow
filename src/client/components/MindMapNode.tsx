import { useState, useEffect, useRef, useCallback } from 'react';
import type { MindMapNode } from '../../shared/types/mindmap';
import { NodePosition } from '../utils/layout';
import '../styles/node.css';

interface Props {
  node: MindMapNode;
  position: NodePosition;
  onEdit: (id: string, text: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onCopy?: (nodeId: string) => void;
  onPaste?: (nodeId: string) => void;
  onDrag?: (nodeId: string, newX: number, newY: number) => void;
  isRoot?: boolean;
  isSelected?: boolean;
  onSelect?: (nodeId: string) => void;
  isReorderTarget?: boolean;
  onDragMove?: (nodeId: string, x: number, y: number, delta: { dx: number; dy: number }) => void;
  onDragEnd?: (nodeId: string, finalDragDelta?: { dx: number; dy: number }) => void;
}

function MindMapNode({ node, position, onEdit, onToggleCollapse, onAddChild, onAddSibling, onDelete, onCopy, onPaste, onDrag, isRoot, isSelected, onSelect, isReorderTarget, onDragMove, onDragEnd }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(node.text);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; nodeX: number; nodeY: number; startTime: number }>({ x: 0, y: 0, nodeX: 0, nodeY: 0, startTime: 0 });
  const dragPreviewRef = useRef<{ x: number; y: number } | null>(null);

  // 同步外部 node.text 变化到本地状态
  useEffect(() => {
    setText(node.text);
  }, [node.text]);

  // 清理函数 - 组件卸载时移除事件监听器
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', () => {});
      window.removeEventListener('mouseup', () => {});
    };
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中，不处理快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        onAddChild(node.id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isRoot) {
          onAddSibling?.(node.id);
        }
      } else if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCopy?.(node.id);
      } else if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onPaste?.(node.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editing, node.id, onAddChild, onAddSibling, onDelete, onCopy, onPaste, isRoot]);

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // 点击其他地方关闭菜单
  useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    if (showContextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
    if (text !== node.text) {
      onEdit(node.id, text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setText(node.text);
      setEditing(false);
    }
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: position.width,
    height: position.height,
    background: (node.style?.gradient && node.style.gradient !== '')
      ? node.style.gradient
      : (node.style?.backgroundColor || '#fff'),
    border: isSelected
      ? '2px solid #2196F3'
      : `1px solid ${node.style?.borderColor || '#ccc'}`,
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isDragging ? 'grabbing' : 'grab',
    color: node.style?.color || '#333',
    fontWeight: node.style?.bold ? 'bold' : 'normal',
    fontStyle: node.style?.italic ? 'italic' : 'normal',
    fontSize: node.style?.fontSize || 14,
    padding: '8px',
    userSelect: 'none',
    boxShadow: isSelected
      ? '0 0 0 2px rgba(74, 144, 217, 0.3)'
      : isReorderTarget
      ? '0 0 0 3px rgba(74, 144, 217, 0.4)'
      : 'none',
    transition: dragPreview ? 'none' : undefined,
  };

  // 预览位置样式
  const previewStyle: React.CSSProperties = dragPreview
    ? {
        transform: `translate(${dragPreview.x - position.x}px, ${dragPreview.y - position.y}px)`,
      }
    : {};

  const contextMenuStyle: React.CSSProperties = {
    position: 'fixed',
    left: contextMenuPos.x,
    top: contextMenuPos.y,
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: '120px',
  };

  const menuItemStyle: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setShowContextMenu(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(node.id);
  };

  // 拖拽处理函数
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // 只在非编辑状态下处理拖拽
    if (editing) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX: position.x,
      nodeY: position.y,
      startTime: Date.now(),
    };
    dragPreviewRef.current = null;

    const handleDrag = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;

      dragPreviewRef.current = {
        x: dragStartRef.current.nodeX + dx,
        y: dragStartRef.current.nodeY + dy,
      };

      // 更新视觉预览位置
      setDragPreview(dragPreviewRef.current);

      onDragMove?.(node.id, dragStartRef.current.nodeX + dx, dragStartRef.current.nodeY + dy, { dx, dy });
    };

    const handleDragEnd = () => {
      // 保存最终位置信息
      const finalDx = dragPreviewRef.current ? dragPreviewRef.current.x - dragStartRef.current.nodeX : 0;
      const finalDy = dragPreviewRef.current ? dragPreviewRef.current.y - dragStartRef.current.nodeY : 0;
      const finalX = dragPreviewRef.current?.x ?? 0;
      const finalY = dragPreviewRef.current?.y ?? 0;
      const isVertical = Math.abs(finalDy) > Math.abs(finalDx) && Math.abs(finalDy) > 20;

      console.log('[DragEnd] finalDx:', finalDx, 'finalDy:', finalDy, 'isVertical:', isVertical);

      // 移除监听器
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);

      // 调用回调（在设置状态之前）
      if (isVertical) {
        onDragEnd?.(node.id, { dx: finalDx, dy: finalDy });
      } else {
        onDrag?.(node.id, finalX, finalY);
      }

      // 清除状态
      dragPreviewRef.current = null;
      setDragPreview(null);
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
  }, [editing, position, node.id, onDrag, onDragEnd, onDragMove]);

  return (
    <div
      ref={nodeRef}
      className={`mindmap-node ${isSelected ? 'selected' : ''}`}
      style={{ ...style, ...previewStyle }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleDragStart}
      onContextMenu={handleContextMenu}
    >
      {editing ? (
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            // 编辑模式下阻止退格键删除节点
            if (e.key === 'Backspace' || e.key === 'Delete') {
              e.stopPropagation();
            }
            handleKeyDown(e);
          }}
          autoFocus
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            textAlign: 'center',
            fontSize: 'inherit',
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap', overflow: 'visible' }}>
          {node.icon && <span className="node-icon">{node.icon}</span>}
          <span className="node-text" style={{ overflow: 'visible', textOverflow: 'clip', flexShrink: 0 }}>{node.text}</span>
          {node.suffixIcon && <span className="node-icon">{node.suffixIcon}</span>}
          {node.children.length > 0 && (
            <span
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }}
              style={{ marginLeft: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {node.collapsed ? '+' : '-'}
            </span>
          )}
        </span>
      )}

      {showContextMenu && (
        <div style={contextMenuStyle} onClick={e => e.stopPropagation()}>
          <div
            style={menuItemStyle}
            onClick={() => handleMenuItemClick(() => onCopy?.(node.id))}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            复制
          </div>
          <div
            style={menuItemStyle}
            onClick={() => handleMenuItemClick(() => onPaste?.(node.id))}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            粘贴
          </div>
          <div
            style={menuItemStyle}
            onClick={() => handleMenuItemClick(() => onAddChild(node.id))}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            添加子节点
          </div>
          {!isRoot && (
            <div
              style={{ ...menuItemStyle, color: '#ff4d4f' }}
              onClick={() => handleMenuItemClick(() => onDelete?.(node.id))}
              onMouseEnter={e => (e.currentTarget.style.background = '#fff1f0')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              删除
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MindMapNode;
