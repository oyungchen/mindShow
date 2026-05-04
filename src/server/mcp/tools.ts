import * as fileService from '../services/fileService.js';
import type { MindMap } from '../../shared/types/mindmap.js';

export const tools = [
  {
    name: 'list_mindmaps',
    description: 'List all brain maps',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => fileService.getFiles(),
  },
  {
    name: 'get_mindmap',
    description: 'Get single brain map by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Mind map ID' },
      },
      required: ['id'],
    },
    handler: async ({ id }: { id: string }) => fileService.getFile(id),
  },
  {
    name: 'create_mindmap',
    description: 'Create new brain map',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Mind map title' },
        content: {
          type: 'object',
          description: 'Optional MindMap content to use as template',
        },
      },
      required: ['text'],
    },
    handler: async ({ text, content }: { text: string; content?: MindMap }) =>
      fileService.createFile(text, content),
  },
  {
    name: 'update_mindmap',
    description: 'Update existing brain map',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Mind map ID' },
        content: { type: 'object', description: 'MindMap content' },
      },
      required: ['id', 'content'],
    },
    handler: async ({ id, content }: { id: string; content: MindMap }) =>
      fileService.saveFile(id, content),
  },
  {
    name: 'delete_mindmap',
    description: 'Delete brain map',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Mind map ID' },
      },
      required: ['id'],
    },
    handler: async ({ id }: { id: string }) => fileService.deleteFile(id),
  },
];

export const toolDefs = tools.map(({ name, description, inputSchema }) => ({
  name,
  description,
  inputSchema,
}));
