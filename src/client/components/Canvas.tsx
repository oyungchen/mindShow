import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { MindMap, MindMapNode } from '../../shared/types/mindmap';
import { calculateTreeLayout, NodePosition } from '../utils/layout';
import MindMapNodeComponent from './MindMapNode';
import MiniMap from './MiniMap';
import ConnectionLine from './ConnectionLine';
import { exportToSVG, exportToPNG, downloadFile } from '../utils/export';
import { exportToXMind } from '../utils/import';
import { getBestConnectionDirection, getConnectionPoint } from '../utils/path';
import { v4 as uuidv4 } from 'uuid';
import { themeMap, themeList, getTextColor } from '../theme';

// 辅助函数：查找节点的父节点
function findNodeParent(nodes: MindMapNode[], nodeId: string, parent: MindMapNode | null = null): MindMapNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return parent;
    const found = findNodeParent(node.children, nodeId, node);
    if (found !== null) return found;
  }
  return null;
}

// 辅助函数：根据ID移除节点
function removeNodeById(nodes: MindMapNode[], nodeId: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === nodeId) {
      nodes.splice(i, 1);
      return true;
    }
    if (removeNodeById(nodes[i].children, nodeId)) return true;
  }
  return false;
}

// 辅助函数：在节点列表中查找并更新节点
function updateNodeInTree(nodes: MindMapNode[], nodeId: string, updateFn: (node: MindMapNode) => boolean): boolean {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return updateFn(node);
    }
    if (updateNodeInTree(node.children, nodeId, updateFn)) return true;
  }
  return false;
}

// 辅助函数：在节点列表中添加子节点
function addChildNode(nodes: MindMapNode[], parentId: string, newNode: MindMapNode): boolean {
  for (const node of nodes) {
    if (node.id === parentId) {
      node.children.push(newNode);
      return true;
    }
    if (addChildNode(node.children, parentId, newNode)) return true;
  }
  return false;
}

// 辅助函数：查找节点的兄弟节点
function findSiblings(nodes: MindMapNode[], nodeId: string, parentId: string | null): MindMapNode[] | null {
  if (parentId === null) {
    // 根节点层级，nodes 就是根节点数组
    return nodes;
  }
  for (const node of nodes) {
    if (node.id === parentId) return node.children;
    const found = findSiblings(node.children, nodeId, parentId);
    if (found !== null) return found;
  }
  return null;
}

// 辅助函数：获取节点的父节点ID
function findNodeParentId(nodes: MindMapNode[], nodeId: string, parentId: string | null = null): string | null {
  for (const node of nodes) {
    if (node.id === nodeId) return parentId;
    const found = findNodeParentId(node.children, nodeId, node.id);
    if (found !== null) return found;
  }
  return null;
}

// 辅助函数：将 MindMap 转换为 MindMapNode（安全转换）
function mindMapToNode(mindmap: MindMap): MindMapNode {
  return {
    id: mindmap.id,
    text: mindmap.text,
    children: mindmap.children,
  };
}

// 辅助函数：获取根节点数组（处理file可能是根节点的情况）
function getRootNodes(file: MindMap): MindMapNode[] {
  return file.children.length > 0 ? file.children : [mindMapToNode(file)];
}

interface CanvasProps {
  file: MindMap;
  onSave: (content: MindMap) => void;
  onSelectNode?: (node: MindMapNode | null) => void;
}

function Canvas({ file, onSave, onSelectNode }: CanvasProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clipboard, setClipboard] = useState<MindMapNode | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodePos, setSelectedNodePos] = useState<{x: number, y: number} | null>(null);
  const [reorderTargetId, setReorderTargetId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 主题状态
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mindmap-theme') || 'medical';
    }
    return 'medical';
  });

  // 历史状态管理（撤销/重做）- 使用 ref 避免 useEffect 频繁重建
  const historyRef = useRef<MindMap[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [currentFile, setCurrentFile] = useState<MindMap>(file);

  // 应用主题到所有节点
  const applyTheme = useCallback((themeName: string) => {
    setCurrentTheme(themeName);
    localStorage.setItem('mindmap-theme', themeName);
    const theme = themeMap[themeName];
    if (!theme || themeName === 'neutral') return;

    // 获取主题的5个颜色，自动计算文字颜色
    const colors = theme.colors.map(c => ({
      bg: c.bg,
      text: getTextColor(c.bg),
    }));

    // 深拷贝
    const newFile = JSON.parse(JSON.stringify(currentFile)) as MindMap;

    // 给根节点应用根节点样式
    if (newFile.children.length > 0) {
      newFile.children.forEach((rootNode: MindMapNode) => {
        rootNode.style = {
          ...rootNode.style,
          backgroundColor: theme.rootBg,
          color: theme.rootColor,
          fontSize: theme.rootFontSize || 20,
          lineColor: theme.lineColor,
        };
        // 递归应用颜色到子树 - 超过5个时用哈希取色确保不同
        rootNode.children?.forEach((child: MindMapNode, idx: number) => {
          const colorIndex = idx < colors.length ? idx : (idx * 7 + 3) % colors.length;
          const color = colors[colorIndex];
          applyColorToSubtree(child, color);
        });
      });
    }

    setCurrentFile(newFile);
    onSave?.(newFile);
  }, [currentFile, onSave]);

  // 递归应用颜色到子树
  const applyColorToSubtree = (node: MindMapNode, color: { bg: string; text: string }) => {
    node.style = { ...node.style, backgroundColor: color.bg, color: color.text };
    node.children?.forEach(child => applyColorToSubtree(child, color));
  };

  // 初始化历史记录
  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = [structuredClone(file)];
      historyIndexRef.current = 0;
    }
  }, []);

  // 页面加载时应用保存的主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('mindmap-theme');
    if (savedTheme && savedTheme !== 'medical') {
      const theme = themeMap[savedTheme];
      if (theme) {
        const colors = theme.colors.map(c => ({
          bg: c.bg,
          text: getTextColor(c.bg),
        }));
        const newFile = JSON.parse(JSON.stringify(currentFile)) as MindMap;
        if (newFile.children.length > 0) {
          newFile.children.forEach((rootNode: MindMapNode) => {
            rootNode.style = {
              ...rootNode.style,
              backgroundColor: theme.rootBg,
              color: theme.rootColor,
              fontSize: theme.rootFontSize || 20,
              lineColor: theme.lineColor,
            };
            rootNode.children?.forEach((child: MindMapNode, idx: number) => {
              const colorIndex = idx < colors.length ? idx : (idx * 7 + 3) % colors.length;
              const color = colors[colorIndex];
              child.style = { ...child.style, backgroundColor: color.bg, color: color.text };
              child.children?.forEach((grandchild: MindMapNode) => {
                applyColorToSubtree(grandchild, color);
              });
            });
          });
        }
        setCurrentFile(newFile);
        onSave?.(newFile);
      }
    }
  }, []);

  // 同步外部 file 变化到内部状态
  useEffect(() => {
    setCurrentFile(file);
  }, [file]);

  // 保存历史记录并调用 onSave
  const saveWithHistory = useCallback((content: MindMap) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(structuredClone(content));
    historyIndexRef.current = historyRef.current.length - 1;
    setCurrentFile(content);
    onSave(content);
  }, [onSave]);

  // 使用根节点数组或整个文件作为布局根（支持多根节点）
  const rootNodes = useMemo(() => {
    return currentFile.children.length > 0 ? currentFile.children : [{
      id: currentFile.id,
      text: currentFile.text,
      children: [],
    } as MindMapNode];
  }, [currentFile]);

  const layout = useMemo(() => {
    const allPositions = new Map<string, NodePosition>();
    let maxWidth = 0;
    let maxHeight = 0;
    const horizontalGapBetweenRoots = 100;

    let accumulatedWidth = 0;
    rootNodes.forEach((rootNode, index) => {
      const rootLayout = calculateTreeLayout(rootNode, {
        nodeWidth: 120,
        nodeHeight: 36,
        horizontalGap: 80,
        verticalGap: 16,
      });

      // 水平偏移每个根节点，累加前面所有根节点的宽度
      const xOffset = accumulatedWidth;

      // 合并位置（带偏移）
      rootLayout.positions.forEach((pos, id) => {
        allPositions.set(id, {
          ...pos,
          x: pos.x + xOffset,
          y: pos.y,
        });
      });

      maxWidth = Math.max(maxWidth, xOffset + (rootLayout.width || 0));
      maxHeight = Math.max(maxHeight, rootLayout.height || 0);

      // 更新累积宽度：当前根节点宽度 + 间隔
      accumulatedWidth += (rootLayout.width || 0) + horizontalGapBetweenRoots;
    });

    return { positions: allPositions, width: maxWidth, height: maxHeight };
  }, [rootNodes]);

  // 方向键导航处理函数
  const handleArrowKey = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedNodeId || !layout.positions.size) return;

    const currentPos = layout.positions.get(selectedNodeId);
    if (!currentPos) return;

    let nearestNode: string | null = null;
    let minDistance = Infinity;

    layout.positions.forEach((pos, id) => {
      if (id === selectedNodeId) return;

      let valid = false;
      let distance: number;

      switch (direction) {
        case 'up':
          valid = pos.y < currentPos.y;
          distance = currentPos.y - pos.y;
          break;
        case 'down':
          valid = pos.y > currentPos.y;
          distance = pos.y - currentPos.y;
          break;
        case 'left':
          valid = pos.x < currentPos.x;
          distance = currentPos.x - pos.x;
          break;
        case 'right':
          valid = pos.x > currentPos.x;
          distance = pos.x - currentPos.x;
          break;
      }

      if (valid && distance < minDistance) {
        minDistance = distance;
        nearestNode = id;
      }
    });

    if (nearestNode) {
      setSelectedNodeId(nearestNode);
    }
  }, [selectedNodeId, layout.positions]);

  // 键盘事件处理（撤销/重做和方向键）- 使用 ref 避免频繁重建
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const restoredFile = structuredClone(historyRef.current[historyIndexRef.current]);
          setCurrentFile(restoredFile);
          onSave(restoredFile);
        }
      }
      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
        e.preventDefault();
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current++;
          const restoredFile = structuredClone(historyRef.current[historyIndexRef.current]);
          setCurrentFile(restoredFile);
          onSave(restoredFile);
        }
      }
      // 方向键导航
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleArrowKey('up');
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleArrowKey('down');
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleArrowKey('left');
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleArrowKey('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, handleArrowKey]);

  const handleFitToWindow = useCallback(() => {
    if (!containerRef.current || !layout.width || !layout.height) return;

    const container = containerRef.current;
    const scaleX = (container.clientWidth - 100) / layout.width;
    const scaleY = (container.clientHeight - 100) / layout.height;
    const newScale = Math.min(scaleX, scaleY, 1);

    setScale(newScale);
    setOffset({ x: 50, y: 50 });
  }, [layout.width, layout.height]);

  const handleNavigate = useCallback((x: number, y: number) => {
    setOffset({ x, y });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => Math.min(4, Math.max(0.1, s * delta)));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 使用 nodeMap 缓存所有节点的引用，避免重复查找
  const nodeMap = useMemo(() => {
    const map = new Map<string, MindMapNode>();
    map.set(currentFile.id, mindMapToNode(currentFile));
    function collect(nodes: MindMapNode[]) {
      for (const node of nodes) {
        map.set(node.id, node);
        collect(node.children);
      }
    }
    collect(currentFile.children);
    return map;
  }, [currentFile]);

  // 查找节点 - 使用 nodeMap 进行快速查找
  const findNode = useCallback((id: string): MindMapNode | null => {
    return nodeMap.get(id) || null;
  }, [nodeMap]);

  // 更新节点文本
  const handleEditNode = useCallback((id: string, text: string) => {
    const clone = structuredClone(currentFile) as MindMap;
    const rootNodes = getRootNodes(clone);
    updateNodeInTree(rootNodes, id, (node) => {
      node.text = text;
      return true;
    });
    saveWithHistory(clone);
  }, [currentFile, saveWithHistory]);

  // 切换折叠状态
  const handleToggleCollapse = useCallback((id: string) => {
    const clone = structuredClone(currentFile) as MindMap;
    const rootNodes = getRootNodes(clone);
    updateNodeInTree(rootNodes, id, (node) => {
      node.collapsed = !node.collapsed;
      return true;
    });
    saveWithHistory(clone);
  }, [currentFile, saveWithHistory]);

  // 添加子节点
  const handleAddChild = useCallback((parentId: string) => {
    const clone = structuredClone(currentFile) as MindMap;
    const rootNodes = getRootNodes(clone);

    // 找到父节点
    const findNode = (nodes: MindMapNode[], id: string): MindMapNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children, id);
        if (found) return found;
      }
      return null;
    };
    const parentNode = findNode(rootNodes, parentId);

    // 判断是否是根节点（顶层节点）
    const isRootNode = rootNodes.some(r => r.id === parentId);

    // 获取主题颜色 - 只在根节点且有有效主题时应用
    let newStyle: MindMapNode['style'] = {};
    if (isRootNode && currentTheme) {
      const theme = themeMap[currentTheme];
      if (theme) {
        // 有有效主题，使用主题颜色
        const colors = theme.colors.map(c => ({
          bg: c.bg,
          text: getTextColor(c.bg),
        }));
        const siblingCount = parentNode?.children?.length || 0;
        const colorIndex = siblingCount < colors.length ? siblingCount : (siblingCount * 7 + 3) % colors.length;
        const color = colors[colorIndex];
        newStyle = { backgroundColor: color.bg, color: color.text };
      } else {
        // 无效主题，继承父节点样式
        newStyle = parentNode?.style ? { ...parentNode.style } : {};
      }
    } else {
      // 没有主题或不是根节点，继承父节点样式
      newStyle = parentNode?.style ? { ...parentNode.style } : {};
    }

    const newNode: MindMapNode = {
      id: uuidv4(),
      text: '新节点',
      children: [],
      style: newStyle,
    };
    addChildNode(rootNodes, parentId, newNode);
    saveWithHistory(clone);
  }, [currentFile, saveWithHistory, currentTheme]);

  // 添加同级节点
  const handleAddSibling = useCallback((nodeId: string) => {
    const clone = structuredClone(currentFile) as MindMap;
    const rootNodes = getRootNodes(clone);

    // 查找被克隆节点的父节点
    const parent = findNodeParent(rootNodes, nodeId);
    if (parent) {
      const index = parent.children.findIndex(c => c.id === nodeId);
      // 继承同级节点的配色
      const siblingNode = parent.children[index];
      const newNode: MindMapNode = {
        id: uuidv4(),
        text: '新节点',
        children: [],
        style: siblingNode?.style ? { ...siblingNode.style } : {},
      };
      parent.children.splice(index + 1, 0, newNode);
    }
    saveWithHistory(clone);
  }, [currentFile, saveWithHistory]);

  // 删除节点
  const handleDeleteNode = useCallback((nodeId: string) => {
    const clone = structuredClone(currentFile) as MindMap;
    const rootNodes = getRootNodes(clone);
    removeNodeById(rootNodes, nodeId);
    saveWithHistory(clone);
  }, [currentFile, saveWithHistory]);

  // 复制节点
  const handleCopy = useCallback((nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (node) {
      setClipboard(structuredClone(node));
    }
  }, [nodeMap]);

  // 粘贴节点
  const handlePaste = useCallback((parentId: string) => {
    if (!clipboard) return;
    const clone = structuredClone(currentFile) as MindMap;
    function add(nodes: MindMapNode[]): boolean {
      for (const node of nodes) {
        if (node.id === parentId) {
          const newNode = structuredClone(clipboard) as MindMapNode;
          newNode.id = uuidv4(); // 生成新的ID
          node.children.push(newNode);
          return true;
        }
        if (add(node.children)) return true;
      }
      return false;
    }
    add(clone.children);
    saveWithHistory(clone);
  }, [currentFile, clipboard, saveWithHistory]);

  // 选择节点
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    const pos = layout.positions.get(nodeId);
    if (pos) {
      setSelectedNodePos({ x: pos.x + pos.width, y: pos.y + pos.height });
    }
    const node = nodeMap.get(nodeId) || null;
    onSelectNode?.(node);
  }, [nodeMap, onSelectNode, layout.positions]);

  // 处理节点拖拽 - 只处理位置拖拽，顺序调整在 handleDragEnd 中处理
  const handleNodeDrag = useCallback((nodeId: string, newX: number, newY: number, dragDelta?: { dx: number; dy: number }) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    // 查找当前布局位置
    const currentPos = layout.positions.get(nodeId);
    if (!currentPos) return;

    // 如果是垂直拖拽（顺序调整），不处理位置拖拽
    if (dragDelta && Math.abs(dragDelta.dy) > Math.abs(dragDelta.dx) && Math.abs(dragDelta.dy) > 20) {
      // 重置状态
      setIsReorderMode(false);
      setReorderTargetId(null);
      return;
    }

    // 位置拖拽模式
    setIsReorderMode(false);
    setReorderTargetId(null);

    // 计算位置偏移
    const offsetX = newX - currentPos.x;
    const offsetY = newY - currentPos.y;

    // 更新所有子节点的位置偏移
    const clone = structuredClone(currentFile) as MindMap;

    // 递归更新节点及其所有子节点的位置偏移
    function updateNodeOffsets(nodes: MindMapNode[], parentId: string | null): void {
      for (const n of nodes) {
        if (n.id === nodeId || (parentId === nodeId)) {
          // 设置或更新位置偏移
          n.layoutOffset = n.layoutOffset || { x: 0, y: 0 };
          n.layoutOffset.x = (n.layoutOffset.x || 0) + offsetX;
          n.layoutOffset.y = (n.layoutOffset.y || 0) + offsetY;
        }
        updateNodeOffsets(n.children, n.id);
      }
    }

    updateNodeOffsets(clone.children, null);
    saveWithHistory(clone);
  }, [currentFile, layout.positions, nodeMap, saveWithHistory]);

  // 处理拖拽结束 - 执行顺序调整
  // 注意：不依赖 isReorderMode 状态，因为拖拽结束时状态可能已被重置
  const handleDragEnd = useCallback((draggedNodeId: string, finalDragDelta?: { dx: number; dy: number }) => {
    console.log('[handleDragEnd] called with draggedNodeId:', draggedNodeId, 'delta:', finalDragDelta);

    // 重置状态
    setIsReorderMode(false);
    setReorderTargetId(null);

    if (!finalDragDelta || !draggedNodeId) return;

    // 判断是否是垂直拖拽（顺序调整模式）
    const isVerticalDrag = Math.abs(finalDragDelta.dy) > Math.abs(finalDragDelta.dx) && Math.abs(finalDragDelta.dy) > 20;
    console.log('[handleDragEnd] isVerticalDrag:', isVerticalDrag);

    if (!isVerticalDrag) return;

    // 执行顺序调整
    const rootNodes = getRootNodes(currentFile);
    const parentId = findNodeParentId(rootNodes, draggedNodeId);
    console.log('[handleDragEnd] parentId:', parentId);

    if (parentId === null) return; // 根节点不能排序

    const siblings = findSiblings(rootNodes, draggedNodeId, parentId);
    console.log('[handleDragEnd] siblings count:', siblings?.length);
    if (!siblings || siblings.length < 2) return; // 需要至少2个节点才能排序

    // 根据拖拽方向决定插入位置
    // 如果 dy < 0，向上拖，插入到上方节点之前
    // 如果 dy > 0，向下拖，插入到下方节点之后
    const currentIndex = siblings.findIndex(s => s.id === draggedNodeId);
    console.log('[handleDragEnd] currentIndex:', currentIndex);

    if (currentIndex === -1) return;

    let targetIndex: number;
    if (finalDragDelta.dy < 0) {
      // 向上拖 - 插入到上一个兄弟节点之前
      targetIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    } else {
      // 向下拖 - 插入到下一个兄弟节点之后
      targetIndex = currentIndex < siblings.length - 1 ? currentIndex + 1 : currentIndex;
    }

    console.log('[handleDragEnd] targetIndex:', targetIndex);

    if (currentIndex === targetIndex) return;

    // 执行排序
    const clone = structuredClone(currentFile) as MindMap;
    const cloneRootNodes = getRootNodes(clone);
    const cloneParentId = findNodeParentId(cloneRootNodes, draggedNodeId);
    if (cloneParentId === null) return;

    const cloneSiblings = findSiblings(cloneRootNodes, draggedNodeId, cloneParentId);
    if (!cloneSiblings) return;

    const [removed] = cloneSiblings.splice(currentIndex, 1);
    cloneSiblings.splice(targetIndex, 0, removed);
    saveWithHistory(clone);
    console.log('[handleDragEnd] reorder completed');
  }, [currentFile, saveWithHistory]);

  // 更新节点样式
  const handleStyleChange = useCallback((nodeId: string, style: MindMapNode['style']) => {
    // 直接修改 nodeMap 中的节点引用
    const node = nodeMap.get(nodeId);
    if (node) {
      node.style = style;
      // 触发保存，使用 currentFile 的引用
      saveWithHistory(structuredClone(currentFile));
    }
  }, [nodeMap, currentFile, saveWithHistory]);

  // 获取当前选中的节点
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) || null : null;

  // 导出处理函数
  const handleExportSVG = useCallback(() => {
    const svg = exportToSVG(currentFile);
    downloadFile(svg, `${currentFile.text}.svg`, 'image/svg+xml');
    setShowExportMenu(false);
  }, [currentFile]);

  const handleExportPNG = useCallback(async () => {
    const svg = exportToSVG(currentFile);
    const png = await exportToPNG(svg, 1200, 800);
    downloadFile(png, `${currentFile.text}.png`);
    setShowExportMenu(false);
  }, [currentFile]);

  const handleExportXMind = useCallback(() => {
    const xmind = exportToXMind(currentFile);
    downloadFile(xmind, `${currentFile.text}.xmind.json`);
    setShowExportMenu(false);
  }, [currentFile]);

  // 生成连接线 - 使用 useMemo 避免重复渲染
  const connections = useMemo(() => {
    const lines: React.ReactElement[] = [];
    layout.positions.forEach((pos, id) => {
      const node = nodeMap.get(id);
      if (!node || node.collapsed || node.children.length === 0) return;

      // 获取连线颜色：优先使用根节点的lineColor，否则使用父节点背景色
      const parentColor = node.style?.lineColor || node.style?.backgroundColor || '#999';

      node.children.forEach(child => {
        const childPos = layout.positions.get(child.id);
        if (!childPos) return;

        const direction = getBestConnectionDirection(
          pos.x, pos.y, pos.width, pos.height, childPos.x, childPos.y, childPos.width, childPos.height
        );
        const startPoint = getConnectionPoint(
          pos.x, pos.y, pos.width, pos.height, direction
        );
        const endDirection = direction === 'right' ? 'left' : direction === 'left' ? 'right' : direction;
        const endPoint = getConnectionPoint(
          childPos.x, childPos.y, childPos.width, childPos.height, endDirection
        );

        lines.push(
          <ConnectionLine
            key={`${id}-${child.id}`}
            startX={startPoint.x}
            startY={startPoint.y}
            endX={endPoint.x}
            endY={endPoint.y}
            color={parentColor}
            width={2}
          />
        );
      });
    });
    return lines;
  }, [layout.positions, nodeMap]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    cursor: isDragging ? 'grabbing' : 'grab',
    background: '#f5f5f5',
  };

  const transformStyle: React.CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y + 40}px) scale(${scale})`,
    transformOrigin: '0 0',
  };

  // 点击画布空白区域取消选择
  const handleCanvasClick = useCallback(() => {
    setSelectedNodeId(null);
    onSelectNode?.(null);
  }, [onSelectNode]);

  // 渲染操作面板
  const renderActionPanel = () => {
    if (!selectedNodeId || !selectedNodePos) return null;
    // 计算节点右下角在画布上的实际位置（考虑缩放和偏移，以及顶部主题栏40px）
    const x = selectedNodePos.x * scale + offset.x + 8;
    const y = selectedNodePos.y * scale + offset.y + 40 + 8;
    return (
      <div style={{
        position: 'absolute',
        left: x,
        top: y,
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 100,
      }}>
        <div onClick={() => { handleAddChild(selectedNodeId); }} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>添加子节点</div>
        <div onClick={() => { handleCopy(selectedNodeId); }} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>复制</div>
        <div onClick={() => { handlePaste(selectedNodeId); }} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>粘贴</div>
        {!((currentFile.children.length > 0 && currentFile.children[0].id === selectedNodeId) || currentFile.id === selectedNodeId) && (
          <div onClick={() => { handleDeleteNode(selectedNodeId); }} style={{ padding: '8px', cursor: 'pointer', color: '#ff4d4f' }}>删除</div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      style={containerStyle}
    >
      {/* 主题选择器 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '8px',
        zIndex: 100,
      }}>
        <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>主题:</span>
        {themeList.map(theme => (
          <button
            key={theme.key}
            onClick={() => applyTheme(theme.key)}
            style={{
              padding: '4px 12px',
              border: currentTheme === theme.key ? `2px solid ${theme.color}` : '1px solid #ddd',
              borderRadius: '4px',
              background: theme.color,
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {theme.name}
          </button>
        ))}
      </div>

      <svg
        className="connections-svg"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', ...transformStyle }}
      >
        {connections}
      </svg>
      <div style={transformStyle}>
        {Array.from(layout.positions.entries()).map(([id, position]) => {
          const node = nodeMap.get(id);
          if (!node) return null;
          // 判断是否是根节点（第一个子节点或者file本身）
          const isRootNode = id === currentFile.id || (currentFile.children.length > 0 && currentFile.children[0].id === id);
          return (
            <MindMapNodeComponent
              key={id}
              node={node}
              position={position}
              onEdit={handleEditNode}
              onToggleCollapse={handleToggleCollapse}
              onAddChild={handleAddChild}
              onAddSibling={handleAddSibling}
              onDelete={handleDeleteNode}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onDragMove={(id, x, y, delta) => handleNodeDrag(id, x, y, delta)}
              isRoot={isRootNode}
              isSelected={id === selectedNodeId}
              onSelect={handleNodeSelect}
              isReorderTarget={id === reorderTargetId}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </div>
      <MiniMap
        file={currentFile}
        layoutPositions={layout.positions}
        layoutWidth={layout.width}
        layoutHeight={layout.height}
        scale={scale}
        offset={offset}
        onNavigate={handleNavigate}
        style={{
          position: 'absolute',
          left: 16,
          bottom: 100,
        }}
      />
      <button
        onClick={handleFitToWindow}
        style={{
          position: 'absolute',
          bottom: 56,
          left: 16,
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Fit
      </button>
      <div style={{
        position: 'absolute',
        bottom: 56,
        left: 60,
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        {Math.round(scale * 100)}%
      </div>
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        style={{
          position: 'absolute',
          bottom: 56,
          left: 16,
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        导出
      </button>
      {showExportMenu && (
        <div style={{ position: 'absolute', bottom: 90, left: 16, background: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <div onClick={handleExportSVG} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>导出 SVG</div>
          <div onClick={handleExportPNG} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>导出 PNG</div>
          <div onClick={handleExportXMind} style={{ padding: '8px', cursor: 'pointer' }}>导出 XMind</div>
        </div>
      )}
      {renderActionPanel()}
    </div>
  );
}

export default Canvas;
