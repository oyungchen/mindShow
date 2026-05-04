# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MindShow is a mind map (思维导图) web application with React frontend and Express backend.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev mode (Vite + Express concurrently)
npm run build        # Build frontend + compile server TypeScript
npm start            # Run production server (serves from dist/)
npm run dev:client   # Vite dev server only (port 5173)
npm run dev:server   # Express server only (port 3000)
```

## Architecture

```
src/
├── client/           # React frontend (Vite)
│   ├── components/   # React components (Canvas, MindMapNode, Sidebar, etc.)
│   ├── hooks/       # Custom React hooks
│   ├── api/         # API client (axios/fetch wrapper)
│   ├── utils/       # Layout algorithms, export/import utilities
│   ├── theme/       # Color themes (bright, deep, light, medium, etc.)
│   └── types/       # Client-side TypeScript types
├── server/           # Express backend
│   ├── routes/       # API route handlers
│   └── services/     # Business logic (fileService)
├── shared/types/     # Shared types (MindMap, MindMapNode interfaces)
└── index.ts          # Server entry point
```

**Frontend dev server proxies `/api` to Express on port 3000.**

## Data Model

Mind maps stored as `data/*.brain.json`:

```typescript
interface MindMap {
  id: string;
  text: string;
  children: MindMapNode[];
  layout: 'tree' | 'radial' | 'org';
  theme: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}

interface MindMapNode {
  id: string;
  text: string;
  icon?: string;
  suffixIcon?: string;
  style?: { color, backgroundColor, gradient, borderColor, bold, italic, fontSize, lineColor };
  children: MindMapNode[];
  collapsed?: boolean;
  layoutOffset?: { x: number; y: number };
}
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/files` | List all mind map files |
| GET | `/api/files/:id` | Get single mind map |
| POST | `/api/files` | Create new mind map |
| PUT | `/api/files/:id` | Update mind map |
| DELETE | `/api/files/:id` | Delete mind map |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Insert child node | Tab |
| Insert sibling node | Enter |
| Edit node | Double-click |
| Delete node | Delete/Backspace |
| Zoom | Ctrl + scroll |
| Pan | Drag canvas / Space + drag |
