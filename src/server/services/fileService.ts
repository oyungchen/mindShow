import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { MindMap } from '../../shared/types/mindmap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../../data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getFiles(): Array<{ id: string; name: string; updatedAt: string }> {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.brain.json'))
    .map(f => {
      const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
      const data: MindMap = JSON.parse(content);
      return {
        id: data.id,
        name: data.text,
        updatedAt: data.updatedAt,
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return files;
}

export function getFile(id: string): MindMap | null {
  const filePath = path.join(DATA_DIR, `${id}.brain.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function createFile(text: string, content?: MindMap): MindMap {
  const id = uuidv4();
  const now = new Date().toISOString();
  const mindmap: MindMap = content ? {
    ...content,
    id,
    text,
    createdAt: now,
    updatedAt: now,
  } : {
    id,
    text,
    children: [],
    layout: 'tree',
    theme: 'light',
    createdAt: now,
    updatedAt: now,
  };
  fs.writeFileSync(path.join(DATA_DIR, `${id}.brain.json`), JSON.stringify(mindmap, null, 2));
  return mindmap;
}

export function saveFile(id: string, content: MindMap): MindMap | null {
  const filePath = path.join(DATA_DIR, `${id}.brain.json`);
  if (!fs.existsSync(filePath)) return null;

  // 验证必需字段
  if (!content.id || !content.text || !Array.isArray(content.children)) {
    throw new Error('Invalid MindMap structure');
  }

  content.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  return content;
}

export function deleteFile(id: string): boolean {
  const filePath = path.join(DATA_DIR, `${id}.brain.json`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}
