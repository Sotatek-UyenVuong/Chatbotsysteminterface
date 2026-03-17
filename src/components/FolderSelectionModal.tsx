import { useState } from "react";
import { X, FolderPlus, Folder, ChevronRight } from "lucide-react";

export interface FolderType {
  id: string;
  name: string;
  documentCount: number;
}

interface FolderSelectionModalProps {
  folders: FolderType[];
  onCreateFolder: (folderName: string) => string;
  onSelectFolder: (folderId: string) => void;
  onClose: () => void;
}

export function FolderSelectionModal({
  folders,
  onCreateFolder,
  onSelectFolder,
  onClose,
}: FolderSelectionModalProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const folderId = onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolder(false);
      setSelectedFolderId(folderId);
    }
  };

  const handleConfirm = () => {
    if (selectedFolderId) {
      onSelectFolder(selectedFolderId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A9150] to-[#72C16B] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-1">Chọn thư mục</h3>
              <p className="text-sm opacity-90">
                Chọn thư mục để lưu tài liệu hoặc tạo mới
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Create New Folder */}
          {isCreatingFolder ? (
            <div className="mb-4 p-4 bg-[#E8F0EE] rounded-xl">
              <label className="block text-sm font-medium text-[#424F42] mb-2">
                Tên thư mục mới
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setIsCreatingFolder(false);
                }}
                placeholder="Nhập tên thư mục..."
                autoFocus
                className="w-full px-4 py-2 border-2 border-[#72C16B] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#72C16B]/50"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tạo
                </button>
                <button
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2 bg-[#656859] text-white rounded-xl hover:bg-[#424F42] transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="w-full mb-4 p-4 border-2 border-dashed border-[#72C16B] rounded-xl text-[#7A9150] hover:bg-[#E8F0EE] transition-all flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-5 h-5" />
              <span className="font-medium">Tạo thư mục mới</span>
            </button>
          )}

          {/* Folder List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {folders.length === 0 ? (
              <div className="text-center py-8 text-[#656859]">
                <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có thư mục nào</p>
                <p className="text-xs mt-1">Tạo thư mục mới để bắt đầu</p>
              </div>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full p-4 rounded-xl transition-all text-left flex items-center justify-between ${
                    selectedFolderId === folder.id
                      ? "bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white shadow-lg"
                      : "bg-[#E8F0EE] text-[#424F42] hover:bg-[#7A9150]/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder
                      className={`w-5 h-5 ${
                        selectedFolderId === folder.id
                          ? "text-white"
                          : "text-[#7A9150]"
                      }`}
                    />
                    <div>
                      <div className="font-medium">{folder.name}</div>
                      <div
                        className={`text-xs ${
                          selectedFolderId === folder.id
                            ? "text-white/80"
                            : "text-[#656859]"
                        }`}
                      >
                        {folder.documentCount} tài liệu
                      </div>
                    </div>
                  </div>
                  {selectedFolderId === folder.id && (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E8F0EE] bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border-2 border-[#656859] text-[#424F42] rounded-xl hover:bg-gray-50 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedFolderId}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
