import { ArrowLeft, Sparkles, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Document } from '../App';
import { getFileTypeConfig } from '../utils/fileTypeUtils';
import { FileIcon } from './FileIcon';
import { useState, useMemo } from 'react';

interface DocumentViewerProps {
  document: Document;
  onCreateChatbot: (documentId: string) => void;
  onBack: () => void;
}

// Split content into pages (simulate pagination)
const splitIntoPages = (content: string, linesPerPage: number = 30): string[] => {
  const lines = content.split('\n');
  const pages: string[] = [];
  
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage).join('\n'));
  }
  
  return pages.length > 0 ? pages : [''];
};

export function DocumentViewer({ document, onCreateChatbot, onBack }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  
  const pages = useMemo(() => splitIntoPages(document.content), [document.content]);
  const totalPages = pages.length;
  
  const handleCreateChatbot = () => {
    onCreateChatbot(document.id);
    toast.success(`Created chatbot for: ${document.name}`);
  };

  const fileConfig = getFileTypeConfig(document.name);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleZoomIn = () => {
    if (zoom < 150) setZoom(zoom + 10);
  };

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7A9150] via-[#72C16B] to-[#E8F0A5]">
      {/* Header */}
      <div className="bg-[#424F42] shadow-lg border-b border-[rgba(101,104,89,0.3)] sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 flex-shrink-0 hover:scale-110"
              >
                <ArrowLeft className="w-5 h-5 text-[#72C16B]" />
              </button>
              <div className="flex items-center gap-3">
                <FileIcon fileName={document.name} size="md" />
                <div className="min-w-0">
                  <h2 className="text-white truncate">{document.name}</h2>
                  <p className="text-[#E8F0A5]">{document.size}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleCreateChatbot}
              className="px-6 py-2.5 bg-gradient-to-r from-[#7FE0EE] to-[#E8F0A5] text-[#424F42] rounded-xl hover:from-[#E8F0A5] hover:to-[#7FE0EE] hover:scale-105 hover:shadow-lg hover:shadow-[#7FE0EE]/50 transition-all duration-300 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Create Chatbot
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#424F42] border-b border-[rgba(101,104,89,0.3)] sticky top-16 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
              >
                <ChevronLeft className="w-5 h-5 text-[#72C16B]" />
              </button>
              <div className="px-4 py-2 bg-[#656859] rounded-xl text-white min-w-[120px] text-center">
                Page {currentPage} / {totalPages}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
              >
                <ChevronRight className="w-5 h-5 text-[#72C16B]" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
              >
                <ZoomOut className="w-5 h-5 text-[#72C16B]" />
              </button>
              <div className="px-4 py-2 bg-[#656859] rounded-xl text-white min-w-[80px] text-center">
                {zoom}%
              </div>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 150}
                className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
              >
                <ZoomIn className="w-5 h-5 text-[#72C16B]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* A4 Page */}
          <div 
            className="bg-white rounded-sm shadow-2xl mx-auto transition-all duration-300 border border-[rgba(101,104,89,0.3)] relative"
            style={{ 
              width: `${(21 * zoom) / 100 * 37.7952755906}px`,
              minHeight: `${(29.7 * zoom) / 100 * 37.7952755906}px`,
              padding: `${(2 * zoom) / 100}cm`,
              marginBottom: '2rem'
            }}
          >
            <div className="prose max-w-none">
              <pre className="text-gray-900 whitespace-pre-wrap font-sans text-[14px] leading-relaxed">
                {pages[currentPage - 1]}
              </pre>
            </div>

            {/* Page Number Footer */}
            <div className="absolute bottom-4 right-4 text-gray-600 text-sm">
              {currentPage}
            </div>
          </div>

          {/* Document Info */}
          <div className="mt-8 bg-[#424F42] rounded-2xl shadow-lg p-6 border border-[rgba(101,104,89,0.3)] backdrop-blur-md">
            <div className="flex items-center justify-between text-[#E8F0A5]">
              <span>Total Pages: {totalPages}</span>
              <span>
                Uploaded: {new Date(document.uploadDate).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Create Chatbot Prompt */}
          <div className="mt-6 bg-[#656859] rounded-2xl p-6 border border-[rgba(101,104,89,0.3)] hover:border-[#7FE0EE] transition-all duration-300 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <FileIcon fileName={document.name} size="md" />
              <div className="flex-1">
                <h3 className="text-white mb-2">Want to ask questions about this document? 💬</h3>
                <p className="text-[#E8F0A5] mb-4">
                  Create an AI chatbot that can answer questions and help you understand the content of this document.
                </p>
                <button
                  onClick={handleCreateChatbot}
                  className="px-6 py-3 bg-gradient-to-r from-[#7FE0EE] to-[#E8F0A5] text-[#424F42] rounded-xl hover:from-[#E8F0A5] hover:to-[#7FE0EE] hover:scale-105 hover:shadow-lg hover:shadow-[#7FE0EE]/50 transition-all duration-300 flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Chatbot Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
