import { MindMapNode } from '../../shared/types/mindmap';

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  positions: Map<string, NodePosition>;
  width: number;
  height: number;
}

// 根据文字计算节点宽度（估算）
function calculateNodeWidth(text: string, baseWidth: number): number {
  // 中文字符约 16px 宽，英文字符约 10px 宽
  // 加上 padding (16px * 2 = 32px) 和安全边距 10px
  let textWidth = 0;
  for (const char of text) {
    textWidth += /[\u4e00-\u9fa5]/.test(char) ? 16 : 10;
  }
  return Math.max(baseWidth, textWidth + 42);
}

// 根据文字计算节点高度
function calculateNodeHeight(text: string, baseHeight: number): number {
  // 字体大小14px，行高约20px
  // 加上 padding (8px * 2 = 16px)
  return baseHeight;
}

export function calculateTreeLayout(
  root: MindMapNode,
  options: { nodeWidth: number; nodeHeight: number; horizontalGap: number; verticalGap: number }
): LayoutResult {
  const { nodeWidth, nodeHeight, horizontalGap, verticalGap } = options;
  const positions = new Map<string, NodePosition>();

  function measure(node: MindMapNode): { width: number; height: number } {
    // 根据文字长度计算节点宽度和高度
    const actualNodeWidth = calculateNodeWidth(node.text, nodeWidth);
    const actualNodeHeight = calculateNodeHeight(node.text, nodeHeight);

    if (node.children.length === 0 || node.collapsed) {
      return { width: actualNodeWidth, height: actualNodeHeight };
    }

    let totalHeight = 0;
    const childResults: { width: number; height: number }[] = [];
    node.children.forEach(child => {
      const result = measure(child);
      childResults.push(result);
      totalHeight += result.height + verticalGap;
    });
    totalHeight -= verticalGap;

    const maxChildWidth = Math.max(...childResults.map(c => c.width));
    const width = maxChildWidth + horizontalGap + actualNodeWidth;

    return { width, height: Math.max(actualNodeHeight, totalHeight) };
  }

  function layout(node: MindMapNode, x: number, y: number): void {
    // 应用布局偏移量（拖拽产生）
    const offsetX = node.layoutOffset?.x || 0;
    const offsetY = node.layoutOffset?.y || 0;

    // 根据文字长度计算节点宽度和高度
    const actualNodeWidth = calculateNodeWidth(node.text, nodeWidth);
    const actualNodeHeight = calculateNodeHeight(node.text, nodeHeight);

    // 如果有子节点，计算子节点的总高度，让父节点居中
    let childTotalHeight = 0;
    if (node.children.length > 0 && !node.collapsed) {
      node.children.forEach(child => {
        const childSize = measure(child);
        childTotalHeight += childSize.height + verticalGap;
      });
      childTotalHeight -= verticalGap;
    }

    // 父节点在子节点中垂直居中
    let nodeY = y;
    if (node.children.length > 0 && !node.collapsed && childTotalHeight > actualNodeHeight) {
      nodeY = y + (childTotalHeight - actualNodeHeight) / 2;
    }

    positions.set(node.id, { id: node.id, x: x + offsetX, y: nodeY + offsetY, width: actualNodeWidth, height: actualNodeHeight });

    if (node.children.length === 0 || node.collapsed) return;

    // 子节点从 y 位置开始布局
    let currentY = y;
    node.children.forEach(child => {
      const childSize = measure(child);
      layout(child, x + actualNodeWidth + horizontalGap, currentY);
      currentY += childSize.height + verticalGap;
    });
  }

  layout(root, 0, 0);
  const rootSize = measure(root);

  return { positions, width: rootSize.width, height: rootSize.height };
}
