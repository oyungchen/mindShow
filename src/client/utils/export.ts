import { MindMap, MindMapNode } from '../../shared/types/mindmap';
import { calculateTreeLayout } from './layout';
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

// 导出为 SVG - 使用实际布局和配色
export function exportToSVG(file: MindMap): string {
  // 使用与 Canvas 相同的布局计算
  const rootNode = file.children[0] || { id: file.id, text: file.text, children: [] } as MindMapNode;
  const layout = calculateTreeLayout(rootNode, {
    nodeWidth: 120,
    nodeHeight: 36,
    horizontalGap: 80,
    verticalGap: 16,
  });

  // 计算 SVG 尺寸
  const padding = 50;
  const width = Math.max(1200, layout.width + padding * 2);
  const height = Math.max(800, layout.height + padding * 2);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<style>
    .node { font-family: Arial, sans-serif; font-size: 14px; }
    text { dominant-baseline: middle; text-anchor: middle; }
  </style>`;
  svg += `<rect width="100%" height="100%" fill="#f9fafb"/>`;

  // 绘制所有节点
  layout.positions.forEach((pos, id) => {
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
        const parentPos = layout.positions.get(node.id);
        if (parentPos) {
          node.children.forEach(child => {
            const childPos = layout.positions.get(child.id);
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
