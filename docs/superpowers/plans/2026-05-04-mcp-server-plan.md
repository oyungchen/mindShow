# MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose MindShow brain map CRUD operations as MCP tools via stdio transport.

**Architecture:** Create an MCP server that wraps existing fileService operations. Uses @modelcontextprotocol/sdk for stdio communication. Server runs as independent process.

**Tech Stack:** Node.js, @modelcontextprotocol/sdk, TypeScript

---

## File Structure

- Create: `src/server/mcp/index.ts` - MCP server entry point (stdio transport)
- Create: `src/server/mcp/tools.ts` - Tool definitions and handlers
- Modify: `package.json` - Add `mcp` script

---

## Task 1: Install MCP SDK

**Files:**
- Modify: `package.json` - Add @modelcontextprotocol/sdk dependency

- [ ] **Step 1: Add dependency**

```bash
npm install @modelcontextprotocol/sdk
```

- [ ] **Step 2: Verify installation**

Run: `npm list @modelcontextprotocol/sdk`
Expected: @modelcontextprotocol/sdk version listed

---

## Task 2: Create Tool Handlers

**Files:**
- Create: `src/server/mcp/tools.ts`

- [ ] **Step 1: Write tool definitions and handlers**

```typescript
import * as fileService from '../services/fileService.js';
import type { MindMap } from '../../shared/types/mindmap.js';

export const tools = [
  {
    name: 'list_mindmaps',
    description: 'List all brain maps',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => fileService.getFiles()
  },
  {
    name: 'get_mindmap',
    description: 'Get a single brain map by ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'UUID of the brain map' } },
      required: ['id']
    },
    handler: async ({ id }: { id: string }) => {
      const file = fileService.getFile(id);
      if (!file) throw new Error(`Brain map not found: ${id}`);
      return file;
    }
  },
  {
    name: 'create_mindmap',
    description: 'Create a new brain map',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Root node text' },
        content: { type: 'object', description: 'Optional MindMap template' }
      },
      required: ['text']
    },
    handler: async ({ text, content }: { text: string; content?: MindMap }) =>
      fileService.createFile(text, content)
  },
  {
    name: 'update_mindmap',
    description: 'Update an existing brain map',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'UUID of the brain map' },
        content: { type: 'object', description: 'MindMap object' }
      },
      required: ['id', 'content']
    },
    handler: async ({ id, content }: { id: string; content: MindMap }) => {
      const file = fileService.saveFile(id, content);
      if (!file) throw new Error(`Brain map not found: ${id}`);
      return file;
    }
  },
  {
    name: 'delete_mindmap',
    description: 'Delete a brain map',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'UUID of the brain map' } },
      required: ['id']
    },
    handler: async ({ id }: { id: string }) => {
      const success = fileService.deleteFile(id);
      if (!success) throw new Error(`Brain map not found: ${id}`);
      return { success: true };
    }
  }
];

// Export tool definitions for tools/list response
export const toolDefs = tools.map(({ name, description, inputSchema }) => ({
  name, description, inputSchema
}));
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/server/mcp/tools.ts`
Expected: No errors

---

## Task 3: Create MCP Server Entry Point

**Files:**
- Create: `src/server/mcp/index.ts`

- [ ] **Step 1: Write MCP server with stdio transport**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { tools, toolDefs } from './tools.js';

const server = new Server(
  { name: 'mindshow-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler({ method: 'tools/list' }, async () => ({
  tools: toolDefs
}));

// Handle tool calls
server.setRequestHandler(
  { method: 'tools/call' },
  async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {
    const { name, arguments: args = {} } = request.params;
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    const result = await tool.handler(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MindShow MCP Server started');
}

main().catch(console.error);
```

**Note:** Update tools.ts to export both `tools` (with handlers) and `toolDefs` (for list response).

---

## Task 4: Add npm Script

**Files:**
- Modify: `package.json` - Add mcp script

- [ ] **Step 1: Add mcp script**

```json
{
  "scripts": {
    "mcp": "tsx src/server/mcp/index.ts"
  }
}
```

---

## Task 5: Test MCP Server

- [ ] **Step 1: Build TypeScript**

Run: `npm run build` or `npx tsc`
Expected: No errors

- [ ] **Step 2: Run MCP server (dry run test)**

Run: `echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | npm run mcp`
Expected: Server starts without error

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/server/mcp/
git commit -m "feat: add MCP server for brain map operations"

```
