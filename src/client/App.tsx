import { useState, useEffect } from 'react';
import { MindMap, MindMapNode } from '../shared/types/mindmap';
import { getFiles, getFile, createFile, saveFile, deleteFile } from './api/client';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import StylePanel from './components/StylePanel';

function App() {
  const [files, setFiles] = useState<Array<{ id: string; name: string; updatedAt: string }>>([]);
  const [currentFile, setCurrentFile] = useState<MindMap | null>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const fileList = await getFiles();
      setFiles(fileList);
      setError(null);
    } catch (err) {
      setError('加载文件列表失败，请稍后重试');
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async (id: string) => {
    try {
      const file = await getFile(id);
      setCurrentFile(file);
      setError(null);
    } catch (err) {
      setError('加载文件失败，请稍后重试');
      console.error('Failed to load file:', err);
    }
  };

  const handleCreateFile = async (text: string) => {
    try {
      const file = await createFile(text);
      setCurrentFile(file);
      await loadFiles();
      setError(null);
    } catch (err) {
      setError('创建文件失败，请稍后重试');
      console.error('Failed to create file:', err);
    }
  };

  const handleSaveFile = async (content: MindMap) => {
    if (currentFile) {
      try {
        await saveFile(currentFile.id, content);
        setCurrentFile(content);
        setError(null);
      } catch (err) {
        setError('保存文件失败，请稍后重试');
        console.error('Failed to save file:', err);
      }
    }
  };

  const handleSelectNode = (node: MindMapNode | null) => {
    setSelectedNode(node);
  };

  const handleStyleChange = (nodeId: string, style: MindMapNode['style']) => {
    if (!currentFile) return;

    // 找到节点并更新样式
    const updateNodeStyle = (nodes: MindMapNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          node.style = style;
          return true;
        }
        if (updateNodeStyle(node.children)) return true;
      }
      return false;
    };

    const updatedFile = JSON.parse(JSON.stringify(currentFile)) as MindMap;
    updateNodeStyle(updatedFile.children);
    handleSaveFile(updatedFile);
  };

  const handleDeleteFile = async (id: string) => {
    try {
      await deleteFile(id);
      await loadFiles();
      if (currentFile?.id === id) {
        setCurrentFile(null);
      }
      setError(null);
    } catch (err) {
      setError('删除文件失败，请稍后重试');
      console.error('Failed to delete file:', err);
    }
  };

  const handleImportFile = async (mindmap: MindMap) => {
    try {
      // 调用后端 API 创建导入的文件
      const file = await createFile(mindmap.text, mindmap);
      setCurrentFile(file);
      await loadFiles();
      setError(null);
    } catch (err) {
      setError('导入文件失败，请稍后重试');
      console.error('Failed to import file:', err);
    }
  };

  return (
    <div className="app">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>关闭</button>
        </div>
      )}
      <Sidebar
        files={files}
        currentFileId={currentFile?.id}
        onSelect={handleSelectFile}
        onCreate={handleCreateFile}
        onDelete={handleDeleteFile}
        onImport={handleImportFile}
      />
      <main className="main-content">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : currentFile ? (
          <div className="canvas-wrapper">
            <Canvas file={currentFile} onSave={handleSaveFile} onSelectNode={handleSelectNode} />
            {selectedNode && (
              <StylePanel node={selectedNode} onStyleChange={handleStyleChange} />
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>选择或创建一个脑图开始</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
