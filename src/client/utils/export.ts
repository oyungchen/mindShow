import { MindMap, MindMapNode } from '../../shared/types/mindmap';
import { calculateTreeLayout, NodePosition } from './layout';
import { getBezierPath } from './path';

// HTML 转义函数，防止 XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Base64 编码（处理 Unicode）
function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

// 导出为 SVG - 使用实际布局和配色，并嵌入脑图数据以便导入
export function exportToSVG(file: MindMap): string {
  // 使用与 Canvas 相同的布局计算（支持多根节点）
  const rootNodes = file.children.length > 0 ? file.children : [{ id: file.id, text: file.text, children: [] } as MindMapNode];

  const allPositions = new Map<string, NodePosition>();
  let maxWidth = 0;
  let maxHeight = 0;
  const horizontalGapBetweenRoots = 100;

  let accumulatedWidth = 0;
  rootNodes.forEach((rootNode, index) => {
    const rootLayout = calculateTreeLayout(rootNode, {
      nodeWidth: 120,
      nodeHeight: 36,
      horizontalGap: 80,
      verticalGap: 16,
    });

    // 水平偏移每个根节点，累加前面所有根节点的宽度
    const xOffset = accumulatedWidth;

    // 合并位置（带偏移）
    rootLayout.positions.forEach((pos, id) => {
      allPositions.set(id, {
        ...pos,
        x: pos.x + xOffset,
        y: pos.y,
      });
    });

    maxWidth = Math.max(maxWidth, xOffset + (rootLayout.width || 0));
    maxHeight = Math.max(maxHeight, rootLayout.height || 0);

    // 更新累积宽度：当前根节点宽度 + 间隔
    accumulatedWidth += (rootLayout.width || 0) + horizontalGapBetweenRoots;
  });

  // 计算 SVG 尺寸
  const padding = 50;
  const width = Math.max(1200, maxWidth + padding * 2);
  const height = Math.max(800, maxHeight + padding * 2);

  const encoded = base64Encode(JSON.stringify(file));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-mindshow="${encoded}">`;
  svg += `<style>
    .node { font-family: Arial, sans-serif; font-size: 14px; }
    text { dominant-baseline: middle; text-anchor: middle; }
  </style>`;
  svg += `<rect width="100%" height="100%" fill="#f9fafb"/>`;

  // 绘制所有节点
  allPositions.forEach((pos, id) => {
    // 找到对应的节点数据
    const findNode = (nodes: MindMapNode[], targetId: string): MindMapNode | null => {
      for (const node of nodes) {
        if (node.id === targetId) return node;
        const found = findNode(node.children, targetId);
        if (found) return found;
      }
      return null;
    };
    const node = findNode(file.children, id);
    if (!node) return;

    // 节点样式
    const bgColor = node.style?.backgroundColor || '#ffffff';
    const textColor = node.style?.color || '#333333';
    const borderColor = node.style?.borderColor || '#cccccc';

    // 绘制节点
    svg += `<rect x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" fill="${bgColor}" stroke="${borderColor}" rx="4"/>`;
    svg += `<text x="${pos.x + pos.width/2}" y="${pos.y + pos.height/2}" fill="${textColor}">${escapeHtml(node.text)}</text>`;
  });

  // 绘制连线
  const drawConnections = (nodes: MindMapNode[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0 && !node.collapsed) {
        const parentPos = allPositions.get(node.id);
        if (parentPos) {
          node.children.forEach(child => {
            const childPos = allPositions.get(child.id);
            if (childPos) {
              const startX = parentPos.x + parentPos.width;
              const startY = parentPos.y + parentPos.height / 2;
              const endX = childPos.x;
              const endY = childPos.y + childPos.height / 2;
              const lineColor = node.style?.lineColor || node.style?.backgroundColor || '#999999';
              const path = getBezierPath(startX, startY, endX, endY);
              svg += `<path d="${path}" fill="none" stroke="${lineColor}" stroke-width="2"/>`;
            }
          });
        }
        drawConnections(node.children);
      }
    });
  };
  drawConnections(file.children);

  svg += '</svg>';
  return svg;
}

// 导出为 PNG
export async function exportToPNG(svgString: string, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  });
}

// 下载文件辅助函数
export function downloadFile(content: string | Blob, filename: string, type: string = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
