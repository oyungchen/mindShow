import { MindMap, MindMapNode } from '../../shared/types/mindmap';
import { v4 as uuidv4 } from 'uuid';

// XMind 导入（简化版）
// XMind 文件是 ZIP 格式，内部有 content.json
//
// 注意：当前版本只支持 JSON 格式的导入
// 完整 XMind ZIP 格式导入需要额外依赖（如 JSZip）来解压文件
export async function importFromXMind(file: File): Promise<MindMap> {
  // 注意：完整实现需要 JSZip 库
  // 这里提供简化版本，假设用户已解压或提供 content.json

  const text = await file.text();

  try {
    const data = JSON.parse(text);

    // 尝试解析 XMind 格式
    if (data.root && data.root.children) {
      return convertXMindToMindMap(data);
    }

    // 尝试解析我们的 JSON 格式
    if (data.id && data.text) {
      return data as MindMap;
    }

    throw new Error('Unknown file format');
  } catch (error) {
    throw new Error('Failed to parse file: ' + (error as Error).message);
  }
}

// XMind 转换为内部格式
function convertXMindToMindMap(xmindData: any): MindMap {
  const root = xmindData.root;

  const convertNode = (xmNode: any): MindMapNode => {
    return {
      id: uuidv4(),
      text: xmNode.text || 'Untitled',
      children: (xmNode.children || []).map((child: any) => convertNode(child)),
    };
  };

  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    text: root?.text || 'Imported Mind Map',
    children: root?.children ? root.children.map((child: any) => convertNode(child)) : [],
    layout: 'tree',
    theme: 'light',
    createdAt: now,
    updatedAt: now,
  };
}

// XMind 导出
export function exportToXMind(file: MindMap): Blob {
  const rootNode = file.children[0] || { id: file.id, text: file.text, children: [] } as MindMapNode;

  const convertNode = (node: MindMapNode): any => {
    return {
      id: node.id,
      text: node.text,
      children: node.children.map(child => convertNode(child)),
    };
  };

  const xmindData = {
    root: convertNode(rootNode),
    meta: {
      version: '1.0',
      app: 'MindShow',
    },
  };

  const jsonStr = JSON.stringify(xmindData, null, 2);
  return new Blob([jsonStr], { type: 'application/json' });
}
