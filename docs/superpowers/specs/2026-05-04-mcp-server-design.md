# MCP Server Design - MindShow

## Overview

Expose MindShow brain map operations as MCP tools via stdio transport, enabling AI agents to read/write brain maps programmatically.

## Architecture

```
Claude Code → stdio → MCP Server → fileService → data/*.brain.json
```

### Components

- **`src/server/mcp/index.ts`** - MCP server entry point using @modelcontextprotocol/sdk
- **`src/server/mcp/tools.ts`** - Tool definitions mapping to fileService operations
- **`package.json`** - Add `npm run mcp` script

### Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK for Node.js

## Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_mindmaps` | List all brain maps | None |
| `get_mindmap` | Get a single brain map by ID | `id: string` (UUID) |
| `create_mindmap` | Create a new brain map | `text: string` (required), `content?: object` (optional MindMap template) |
| `update_mindmap` | Update an existing brain map | `id: string`, `content: object` (MindMap) |
| `delete_mindmap` | Delete a brain map | `id: string` |

## Implementation

1. Install `@modelcontextprotocol/sdk`
2. Create `src/server/mcp/index.ts` with stdio server
3. Create `src/server/mcp/tools.ts` with tool handlers
4. Add `mcp` script to package.json
5. Reuse existing `fileService` for file operations

## Data Model

MindMap structure (from `src/shared/types/mindmap.ts`):
- `id: string` - UUID
- `text: string` - Root node text
- `children: MindMapNode[]` - Child nodes
- `layout: 'tree' | 'radial' | 'org'`
- `theme: string`
- `createdAt/updatedAt: string`
