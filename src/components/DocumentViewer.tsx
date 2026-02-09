import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Document } from '../App';
import { getFileTypeConfig } from '../utils/fileTypeUtils';
import { FileIcon } from './FileIcon';
import * as api from '../api';

interface DocumentViewerProps {
  document: Document;
  onCreateChatbot: (documentId: string) => void;
  onBack: () => void;
}

export function DocumentViewer({ document, onCreateChatbot, onBack }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Load document info (total pages)
  useEffect(() => {
    const loadDocInfo = async () => {
      try {
        setIsLoading(true);
        const info = await api.getDocumentInfo(document.id);
        if (info.success) {
          setTotalPages(info.total_pages || 1);
        }
      } catch (error) {
        console.error('Failed to load document info:', error);
        // Extract pages from content if available
        const match = document.content.match(/(\d+)\s+pages?/i);
        if (match) {
          setTotalPages(parseInt(match[1], 10));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocInfo();
  }, [document.id, document.content]);
  
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <FileIcon fileName={document.name} size="md" />
                <div className="min-w-0">
                  <h2 className="text-gray-900 font-semibold truncate">{document.name}</h2>
                  <p className="text-gray-500 text-sm">{document.size}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleCreateChatbot}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Create Chatbot
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 min-w-[120px] text-center text-sm font-medium">
                Page {currentPage} / {totalPages}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-5 h-5 text-gray-600" />
              </button>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 min-w-[80px] text-center text-sm font-medium">
                {zoom}%
              </div>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 150}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* PDF Page as Image */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-sm shadow-2xl">
              <Loader2 className="w-12 h-12 text-[#72C16B] animate-spin mb-4" />
              <p className="text-gray-600">Loading document...</p>
            </div>
          ) : (
            <div 
              className="bg-white rounded-sm shadow-2xl mx-auto transition-all duration-300 border border-[rgba(101,104,89,0.3)] relative overflow-hidden"
              style={{ 
                marginBottom: '2rem'
              }}
            >
              {imageError ? (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Failed to load page image</p>
                  <p className="text-gray-400 text-sm text-center">{document.content}</p>
                </div>
              ) : (
                <img
                  key={`${document.id}-page-${currentPage}`}
                  src={api.getPageImageUrl(document.id, currentPage)}
                  alt={`Page ${currentPage} of ${document.name}`}
                  className="w-full h-auto transition-all duration-300"
                  style={{ 
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center'
                  }}
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              )}

              {/* Page Number Footer */}
              {!imageError && (
                <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
                  {currentPage}
                </div>
              )}
            </div>
          )}

          {/* Document Info */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between text-gray-600 text-sm">
              <span className="font-medium">Total Pages: <span className="text-gray-900">{totalPages}</span></span>
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
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
              <FileIcon fileName={document.name} size="md" />
              <div className="flex-1">
                <h3 className="text-gray-900 font-semibold mb-2">Want to ask questions about this document? 💬</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Create an AI chatbot that can answer questions and help you understand the content of this document.
                </p>
                <button
                  onClick={handleCreateChatbot}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-2"
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
