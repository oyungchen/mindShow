import { useRef } from 'react';
import { importFromXMind } from '../utils/import';

interface FileInfo {
  id: string;
  name: string;
  updatedAt: string;
}

interface SidebarProps {
  files: FileInfo[];
  currentFileId?: string;
  onSelect: (id: string) => void;
  onCreate: (text: string) => void;
  onDelete: (id: string) => void;
  onImport: (content: any) => void;
}

function Sidebar({ files, currentFileId, onSelect, onCreate, onDelete, onImport }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const text = prompt('请输入脑图名称:');
    if (text && text.trim()) {
      onCreate(text.trim());
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个脑图吗？')) {
      onDelete(id);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const mindmap = await importFromXMind(file);
      onImport(mindmap);
    } catch (error) {
      alert('导入失败: ' + (error as Error).message);
    }

    // 清空 input 以便再次选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>脑图</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleImportClick}>导入</button>
          <button onClick={handleCreate}>+ 新建</button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.xmind"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <ul className="file-list">
        {files.map(file => (
          <li
            key={file.id}
            className={`file-item ${currentFileId === file.id ? 'active' : ''}`}
            onClick={() => onSelect(file.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleDelete(e, file.id);
            }}
          >
            <div className="file-name">{file.name}</div>
            <div className="file-date">{formatDate(file.updatedAt)}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
