# MindShow

一个现代化的脑图（思维导图）Web 应用，支持本地存储和多种格式导入/导出。

## 功能特性

- **节点操作**：添加、删除、编辑、复制、粘贴、拖拽
- **结构操作**：展开/折叠、调整层级、插入同级/下级节点
- **样式定制**：字体、颜色、背景、边框等
- **多种布局**：树状、放射状、组织结构图
- **视图控制**：缩放、平移、Fit 到窗口、迷你地图
- **本地存储**：文件 CRUD、侧边栏文件列表
- **导入/导出**：XMind、PNG/SVG、PDF

## 技术栈

- **前端**：React 18 + TypeScript + Vite
- **后端**：Express + TypeScript
- **渲染**：SVG（缩放不失真）
- **存储**：本地文件系统（data/*.brain.json）

## 快速开始

### 前置要求

- Node.js 18+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 使用提供的脚本（推荐）
./start.sh          # macOS/Linux
start.bat           # Windows

# 或直接使用 npm
npm run dev
```

这会同时启动 Vite 开发服务器（前端）和 Express 服务器（后端）。

**开发模式访问地址**：
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000

### 生产模式

```bash
# 构建前端
npm run build

# 启动服务器
npm start
```

**生产模式访问地址**：
- 应用：http://localhost:3000

生产模式下，Express 服务器会同时托管前端静态文件和 API 服务。

## 项目结构

```
mindshow/
├── src/
│   ├── client/          # 前端代码
│   │   ├── components/  # React 组件
│   │   ├── hooks/       # 自定义 hooks
│   │   ├── utils/       # 工具函数
│   │   ├── types/       # TypeScript 类型
│   │   └── api/         # API 请求
│   └── server/          # 后端代码
│       ├── routes/      # API 路由
│       ├── services/    # 业务逻辑
│       └── index.ts     # 服务器入口
├── data/                # 脑图文件存储目录
├── dist/                # 构建输出
├── docs/                # 文档
└── package.json
```

## 快捷键

| 操作 | 快捷键 |
|------|--------|
| 插入子节点 | Tab |
| 插入同级节点 | Enter |
| 编辑节点 | 双击 |
| 删除节点 | Delete / Backspace |
| 缩放 | Ctrl + 滚轮 |
| 平移 | 拖拽画布 / 空格 + 拖拽 |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/files` | 获取文件列表 |
| GET | `/api/files/:id` | 获取文件内容 |
| POST | `/api/files` | 创建新文件 |
| PUT | `/api/files/:id` | 保存文件 |
| DELETE | `/api/files/:id` | 删除文件 |

## 数据格式

脑图数据以 JSON 格式存储在 `data/` 目录下，文件扩展名为 `.brain.json`。

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
```

## 许可证

MIT
