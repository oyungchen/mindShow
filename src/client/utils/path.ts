// 贝塞尔曲线路径计算
export function getBezierPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const midX = (startX + endX) / 2;
  const dx = Math.abs(endX - startX);
  const controlOffset = Math.min(dx * 0.5, 100);

  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
}

// 计算连接点位置
export function getConnectionPoint(
  nodeX: number,
  nodeY: number,
  width: number,
  height: number,
  direction: 'left' | 'right' | 'top' | 'bottom'
): { x: number; y: number } {
  switch (direction) {
    case 'left':
      return { x: nodeX, y: nodeY + height / 2 };
    case 'right':
      return { x: nodeX + width, y: nodeY + height / 2 };
    case 'top':
      return { x: nodeX + width / 2, y: nodeY };
    case 'bottom':
      return { x: nodeX + width / 2, y: nodeY + height };
  }
}

// 获取最佳连接方向（使用节点中心点）
export function getBestConnectionDirection(
  parentX: number,
  parentY: number,
  parentWidth: number,
  parentHeight: number,
  childX: number,
  childY: number,
  childWidth: number,
  childHeight: number
): 'left' | 'right' | 'top' | 'bottom' {
  const parentCenterX = parentX + parentWidth / 2;
  const parentCenterY = parentY + parentHeight / 2;
  const childCenterX = childX + childWidth / 2;
  const childCenterY = childY + childHeight / 2;

  if (childCenterX > parentCenterX) return 'right';
  if (childCenterX < parentCenterX) return 'left';
  if (childCenterY > parentCenterY) return 'bottom';
  return 'top';
}
