import { ArrowLeft, Download, Trash2, FileText, Calendar, HardDrive, Sparkles, Eye } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Document } from '../App';
import { getFileTypeConfig } from '../utils/fileTypeUtils';
import { FileIcon } from './FileIcon';

interface DocumentLibraryProps {
  documents: Document[];
  onBack: () => void;
  onViewDocument: (id: string) => void;
  onCreateChatbot: (id: string) => void;
  onDeleteDocument: (id: string) => void;
}

export function DocumentLibrary({ documents, onBack, onViewDocument, onCreateChatbot, onDeleteDocument }: DocumentLibraryProps) {
  const handleDownload = (doc: Document) => {
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded: ${doc.name}`);
  };

  const handleDelete = (doc: Document) => {
    if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      onDeleteDocument(doc.id);
      toast.success(`Deleted: ${doc.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7A9150] via-[#72C16B] to-[#E8F0A5]">
      {/* Header */}
      <div className="bg-[#424F42] shadow-lg border-b border-[rgba(101,104,89,0.3)] sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 hover:scale-110"
            >
              <ArrowLeft className="w-5 h-5 text-[#72C16B]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#72C16B] to-[#7FE0EE] rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-white">Document Library 📚</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {documents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#656859] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[rgba(101,104,89,0.3)]">
              <FileText className="w-12 h-12 text-[#7A9150]" />
            </div>
            <h2 className="text-white mb-2">No documents yet 🌱</h2>
            <p className="text-[#E8F0A5] mb-6">Upload documents to get started</p>
            <button
              onClick={onBack}
              className="px-8 py-3 bg-gradient-to-r from-[#7A9150] to-[#72C16B] text-white rounded-2xl hover:from-[#72C16B] hover:to-[#7A9150] hover:scale-105 hover:shadow-2xl hover:shadow-[#7A9150]/50 transition-all duration-300"
            >
              Go to Upload Page
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <p className="text-[#E8F0A5]">{documents.length} document{documents.length !== 1 ? 's' : ''} in library</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map(doc => (
              <div
                key={doc.id}
                className="bg-[#424F42] rounded-2xl shadow-lg border border-[rgba(101,104,89,0.3)] hover:border-[#7A9150] hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105 backdrop-blur-md"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-[rgba(101,104,89,0.2)]">
                  <div className="flex items-start gap-3">
                    <FileIcon fileName={doc.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white truncate mb-2">{doc.name}</h3>
                      <div className="flex items-center gap-4 text-[#E8F0A5]">
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="w-4 h-4" />
                          <span>{doc.size}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-6 space-y-3">
                  {/* View Button */}
                  <button
                    onClick={() => onViewDocument(doc.id)}
                    className="w-full px-4 py-2.5 bg-[#424F42] border border-[rgba(101,104,89,0.4)] text-[#72C16B] rounded-xl hover:bg-[#656859] hover:border-[#72C16B] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>

                  {/* Create Chatbot */}
                  <button
                    onClick={() => onCreateChatbot(doc.id)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-[#7FE0EE] to-[#E8F0A5] text-[#424F42] rounded-xl hover:from-[#E8F0A5] hover:to-[#7FE0EE] hover:scale-105 hover:shadow-lg hover:shadow-[#7FE0EE]/50 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Create Chatbot
                  </button>

                  {/* Download & Delete */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 px-4 py-2.5 bg-[#656859] text-white rounded-xl hover:bg-[#424F42] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="flex-1 px-4 py-2.5 bg-[#656859] text-[#7FE0EE] rounded-xl hover:bg-[#7FE0EE] hover:text-[#424F42] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
