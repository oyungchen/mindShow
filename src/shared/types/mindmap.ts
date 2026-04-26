export interface MindMap {
  id: string;
  text: string;
  children: MindMapNode[];
  layout: 'tree' | 'radial' | 'org';
  theme: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}

export interface MindMapNode {
  id: string;
  text: string;
  icon?: string;           // 前缀图标
  suffixIcon?: string;     // 后缀图标
  style?: {
    color?: string;
    backgroundColor?: string;
    gradient?: string;      // 渐变背景
    borderColor?: string;
    bold?: boolean;
    italic?: boolean;
    fontSize?: number;
    lineColor?: string;     // 连线颜色
  };
  children: MindMapNode[];
  collapsed?: boolean;
  layoutOffset?: {
    x: number;
    y: number;
  };
}

export interface FileInfo {
  id: string;
  name: string;
  updatedAt: string;
}
