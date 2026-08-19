import { FileTree } from "../components/FileTree";

export function Files() {
  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <h2>文件</h2>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
        <FileTree />
      </div>
    </div>
  );
}