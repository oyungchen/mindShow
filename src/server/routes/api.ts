import { Router } from 'express';
import * as fileService from '../services/fileService.js';

const router = Router();

// UUID 验证辅助函数
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// 基础健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取文件列表
router.get('/files', (req, res) => {
  try {
    const files = fileService.getFiles();
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// 获取单个文件
router.get('/files/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid UUID format' });
    }
    const file = fileService.getFile(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// 创建新文件
router.post('/files', (req, res) => {
  try {
    const { text, content } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required and must be a non-empty string' });
    }
    const file = fileService.createFile(text.trim(), content);
    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create file' });
  }
});

// 保存文件
router.put('/files/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid UUID format' });
    }
    const { content } = req.body;
    if (!content || typeof content !== 'object') {
      return res.status(400).json({ error: 'Content is required and must be an object' });
    }
    const file = fileService.saveFile(id, content);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// 删除文件
router.delete('/files/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid UUID format' });
    }
    const success = fileService.deleteFile(id);
    if (!success) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
