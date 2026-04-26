import { getBezierPath } from '../utils/path';

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  width?: number;
  arrow?: boolean;
}

function ConnectionLine({
  startX,
  startY,
  endX,
  endY,
  color = '#999',
  width = 2,
  arrow = false,
}: ConnectionLineProps) {
  const path = getBezierPath(startX, startY, endX, endY);

  // 计算箭头位置
  const arrowSize = 8;
  const angle = Math.atan2(endY - startY, endX - startX);
  const arrowPoints = [
    `${endX},${endY}`,
    `${endX - arrowSize * Math.cos(angle - Math.PI / 6)},${endY - arrowSize * Math.sin(angle - Math.PI / 6)}`,
    `${endX - arrowSize * Math.cos(angle + Math.PI / 6)},${endY - arrowSize * Math.sin(angle + Math.PI / 6)}`,
  ].join(' ');

  return (
    <g>
      <path
        d={path}
        stroke={color}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
      />
      {arrow && (
        <polygon points={arrowPoints} fill={color} />
      )}
    </g>
  );
}

export default ConnectionLine;
