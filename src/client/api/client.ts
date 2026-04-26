import { MindMap } from '../../shared/types/mindmap';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getFiles() {
  const res = await fetch(`${API_BASE}/files`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data.files;
}

export async function getFile(id: string): Promise<MindMap> {
  const res = await fetch(`${API_BASE}/files/${id}`);
  return handleResponse<MindMap>(res);
}

export async function createFile(text: string, content?: MindMap): Promise<MindMap> {
  const res = await fetch(`${API_BASE}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, content }),
  });
  return handleResponse<MindMap>(res);
}

export async function saveFile(id: string, content: MindMap): Promise<MindMap> {
  const res = await fetch(`${API_BASE}/files/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return handleResponse<MindMap>(res);
}

export async function deleteFile(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/files/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Failed to delete file');
  }
}
