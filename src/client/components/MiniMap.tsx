import { useMemo } from 'react';
import { MindMap } from '../../shared/types/mindmap';
import { NodePosition } from '../utils/layout';

interface MiniMapProps {
  file: MindMap;
  layoutPositions: Map<string, NodePosition>;
  layoutWidth: number;
  layoutHeight: number;
  scale: number;
  offset: { x: number; y: number };
  onNavigate: (x: number, y: number) => void;
  style?: React.CSSProperties;
}

function MiniMap({
  file,
  layoutPositions,
  layoutWidth,
  layoutHeight,
  scale,
  offset,
  onNavigate,
  style
}: MiniMapProps) {
  const miniMapSize = 150;
  const padding = 10;

  const { viewBox, miniScale } = useMemo(() => {
    if (!layoutWidth || !layoutHeight) {
      return { viewBox: `0 0 ${miniMapSize} ${miniMapSize}`, miniScale: 1 };
    }

    const contentWidth = layoutWidth + 100;
    const contentHeight = layoutHeight + 100;
    const s = Math.min(
      (miniMapSize - padding * 2) / contentWidth,
      (miniMapSize - padding * 2) / contentHeight
    );

    return {
      viewBox: `0 0 ${contentWidth} ${contentHeight}`,
      miniScale: s
    };
  }, [layoutWidth, layoutHeight]);

  const viewRect = useMemo(() => {
    // 计算当前视图在迷你地图中的位置
    const viewWidth = (miniMapSize - padding * 2) / (scale * miniScale);
    const viewHeight = (miniMapSize - padding * 2) / (scale * miniScale);
    const viewX = (-offset.x / scale - 50) * miniScale + padding;
    const viewY = (-offset.y / scale - 50) * miniScale + padding;

    return {
      x: Math.max(padding, viewX),
      y: Math.max(padding, viewY),
      width: Math.min(viewWidth * miniScale, miniMapSize - padding * 2),
      height: Math.min(viewHeight * miniScale, miniMapSize - padding * 2),
    };
  }, [offset, scale, miniScale]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 转换坐标到画布坐标
    const canvasX = (x - padding) / miniScale - 50 + (miniMapSize / scale / 2);
    const canvasY = (y - padding) / miniScale - 50 + (miniMapSize / scale / 2);

    onNavigate(-canvasX * scale, -canvasY * scale);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: miniMapSize,
        height: miniMapSize,
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid #ccc',
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
        ...style,
      }}
      onClick={handleClick}
    >
      <svg width={miniMapSize} height={miniMapSize} viewBox={viewBox}>
        {/* 节点 */}
        {Array.from(layoutPositions.entries()).map(([id, pos]) => (
          <rect
            key={id}
            x={pos.x + 50}
            y={pos.y + 50}
            width={pos.width}
            height={pos.height}
            fill="#4a90d9"
            rx="2"
          />
        ))}
      </svg>
      {/* 当前视图区域 */}
      <div
        style={{
          position: 'absolute',
          left: viewRect.x,
          top: viewRect.y,
          width: viewRect.width,
          height: viewRect.height,
          border: '2px solid rgba(74, 144, 217, 0.5)',
          background: 'rgba(74, 144, 217, 0.1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default MiniMap;
