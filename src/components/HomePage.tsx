import React, { useState, useRef } from 'react';
import { Upload, Search, Eye, FileText, CloudUpload, FolderOpen, Sparkles, Image as ImageIcon, BookMarked, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Document } from '../App';
import { getFileExtension, getFileTypeConfig } from '../utils/fileTypeUtils';
import { FileIcon } from './FileIcon';
import * as api from '../api';

interface HomePageProps {
  onDocumentUpload: (doc: Document) => void;
  onGoToLibrary: () => void;
  onViewDocument: (id: string) => void;
  onCreateChatbot: (id: string) => void;
  documentCount: number;
  documents: Document[];
}

export function HomePage({ onDocumentUpload, onGoToLibrary, onViewDocument, onCreateChatbot, documentCount, documents }: HomePageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchImage, setSearchImage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    const file = files[0]; // Upload one file at a time
    
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported');
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading(`Uploading ${file.name}...`);

    try {
      // Call backend API to upload and process PDF
      const result = await api.uploadDocument(file);

      if (result.success) {
        toast.success(
          `${file.name} uploaded successfully!\n` +
          `${result.total_pages} pages processed\n` +
          `${result.images_processed || 0} pages indexed`,
          { id: uploadToast, duration: 5000 }
        );

        // Create document object with backend data
        const newDoc: Document = {
          id: result.session_id, // Use session_id from backend
          name: result.file_name,
          uploadDate: new Date().toISOString(),
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          content: `PDF Document - ${result.total_pages} pages`
        };
        
        onDocumentUpload(newDoc);
      } else {
        toast.error(`Upload failed: ${result.error}`, { id: uploadToast });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { id: uploadToast }
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isUploading) {
      toast.warning('Please wait for current upload to finish');
      return;
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) {
      toast.warning('Please wait for current upload to finish');
      return;
    }
    
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleTextSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = documents.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(results);
    
    if (results.length > 0) {
      toast.success(`Found ${results.length} document${results.length > 1 ? 's' : ''}`);
    } else {
      toast.error('No documents found');
    }
  };

  const handleImageSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSearchImage(e.target?.result as string);
        
        // Simulate image search - return random documents
        const randomResults = documents
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(3, documents.length));
        
        setSearchResults(randomResults);
        
        if (randomResults.length > 0) {
          toast.success(`Found ${randomResults.length} similar document${randomResults.length > 1 ? 's' : ''}`);
        } else {
          toast.info('No similar documents found');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchImage(null);
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-gray-900 font-semibold">Document Chatbot System 📚</h1>
          <button
            onClick={onGoToLibrary}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg hover:shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 text-white"
          >
            <BookMarked className="w-5 h-5" />
            <span>Document Library ({documentCount})</span>
          </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-white rounded-2xl shadow-xl p-12 transition-all border-2 ${
            isDragging ? 'border-blue-500 bg-blue-50 shadow-blue-500/20' : 'border-gray-300 border-dashed'
          } ${isUploading ? 'opacity-60 cursor-wait' : ''}`}
        >
          <div className="flex flex-col items-center justify-center">
            <div className={`mb-6 p-6 rounded-full transition-all ${isDragging ? 'bg-blue-100 animate-pulse' : 'bg-gray-100'} ${isUploading ? 'animate-pulse' : ''}`}>
              {isUploading ? (
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              ) : (
                <Upload className={`w-16 h-16 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
              )}
            </div>

            <h2 className="text-gray-900 text-xl font-semibold mb-2">
              {isUploading ? 'Processing Document...' : 'Upload PDF Documents'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isUploading 
                ? 'Please wait while we analyze your PDF with AI...' 
                : 'Drag and drop PDF files here or click to select'}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf"
              disabled={isUploading}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Select PDF Document
                </>
              )}
            </button>

            <p className="text-gray-500 mt-4 text-sm">
              {isUploading 
                ? '⏳ Extracting pages, analyzing content, generating embeddings...' 
                : '📄 Only PDF files supported • AI-powered analysis'}
            </p>
          </div>
        </div>

        {/* Search Area */}
        <div className="bg-white rounded-xl shadow-xl p-6 mt-8 border border-gray-200">
          <h3 className="text-gray-900 font-semibold mb-4 text-lg">Search Documents 🔍</h3>
          
          {/* Text Search */}
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 mb-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by filename or content..."
              className="flex-1 ml-3 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleTextSearch}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 mb-4"
          >
            Search by Text
          </button>

          {/* Image Search */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-600 mb-3 text-sm">Or search by image:</p>
            
            <button
              onClick={() => imageInputRef.current?.click()}
              className="px-6 py-3 bg-gray-50 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:scale-[1.02] hover:shadow-md transition-all duration-300 flex items-center gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              Upload Image to Search
            </button>
            
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSearch} className="hidden" />
            
            {searchImage && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mt-3">
                <img src={searchImage} alt="Search" className="w-8 h-8 object-cover rounded-lg border border-gray-200" />
                <span className="text-gray-700 text-sm">Searching from image</span>
                <button
                  onClick={clearSearch}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-semibold">Search Results ({searchResults.length})</h3>
              <button
                onClick={clearSearch}
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Clear Results
              </button>
            </div>
            
            <div className="space-y-3">
              {searchResults.map(doc => (
                <div key={doc.id}>
                  <div
                    className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                  >
                    <FileIcon fileName={doc.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">{doc.name}</p>
                      <p className="text-gray-500 text-sm">{doc.size}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          clearSearch();
                          onViewDocument(doc.id);
                        }}
                        className="px-4 py-2 bg-gray-50 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          clearSearch();
                          onCreateChatbot(doc.id);
                        }}
                        className="px-4 py-2 bg-blue-500 border border-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Create Chatbot
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="mt-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-2">No documents yet</h3>
            <p className="text-gray-500">Upload your first document to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}