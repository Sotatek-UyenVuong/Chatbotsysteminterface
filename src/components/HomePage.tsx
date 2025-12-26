import { useState, useRef } from 'react';
import { Upload, Search, Eye, FileText, CloudUpload, FolderOpen, Sparkles, Image as ImageIcon, BookMarked } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Document } from '../App';
import { getFileExtension, getFileTypeConfig } from '../utils/fileTypeUtils';
import { FileIcon } from './FileIcon';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newDoc: Document = {
          id: `doc-${Date.now()}-${Math.random()}`,
          name: file.name,
          uploadDate: new Date().toISOString(),
          size: `${(file.size / 1024).toFixed(2)} KB`,
          content: content.substring(0, 5000) + (content.length > 5000 ? '\n...(content truncated)' : '')
        };
        onDocumentUpload(newDoc);
        toast.success(`✅ ${file.name} uploaded successfully!`);
      };
      reader.readAsText(file);
    });
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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      toast.success(`🔍 Found ${results.length} document${results.length > 1 ? 's' : ''}`);
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
          toast.success(`📸 Found ${randomResults.length} similar document${randomResults.length > 1 ? 's' : ''}`);
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
    <div className="min-h-screen bg-gradient-to-br from-[#7A9150] via-[#72C16B] to-[#E8F0A5]">
      {/* Header */}
      <div className="bg-[#424F42] shadow-lg border-b border-[rgba(101,104,89,0.3)] sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-white">Document Chatbot System 🌿</h1>
          <button
            onClick={onGoToLibrary}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] rounded-2xl shadow-lg hover:shadow-[#72C16B]/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white"
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
          className={`bg-[#424F42] rounded-3xl shadow-xl p-12 transition-all border-2 backdrop-blur-md ${
            isDragging ? 'border-[#7FE0EE] bg-[#656859] shadow-[#7FE0EE]/30' : 'border-[rgba(101,104,89,0.4)] border-dashed'
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            <div className={`mb-6 p-6 rounded-full transition-all ${isDragging ? 'bg-[#656859] animate-pulse' : 'bg-[#656859]'}`}>
              <Upload className={`w-16 h-16 ${isDragging ? 'text-[#7FE0EE]' : 'text-[#72C16B]'}`} />
            </div>

            <h2 className="text-white mb-2">Upload Documents</h2>
            <p className="text-[#E8F0A5] mb-6">Drag and drop files here or click to select files</p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-4 bg-gradient-to-r from-[#7A9150] to-[#72C16B] text-white rounded-2xl hover:from-[#72C16B] hover:to-[#7A9150] hover:scale-105 hover:shadow-2xl hover:shadow-[#7A9150]/50 transition-all duration-300 flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Select Documents
            </button>

            <p className="text-[#99BD98] mt-4">Supported: PDF, DOC, DOCX, TXT</p>
          </div>
        </div>

        {/* Search Area */}
        <div className="bg-[#424F42] rounded-2xl shadow-xl p-6 mt-8 border border-[rgba(101,104,89,0.3)] backdrop-blur-md">
          <h3 className="text-white mb-4">Search Documents 🔍</h3>
          
          {/* Text Search */}
          <div className="flex items-center bg-[#656859] border border-[rgba(101,104,89,0.3)] rounded-2xl px-4 py-3 mb-4 focus-within:border-[#72C16B] transition-colors">
            <Search className="w-5 h-5 text-[#72C16B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by filename or content..."
              className="flex-1 ml-3 bg-transparent border-none outline-none text-white placeholder-[#99BD98]"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="text-[#E8F0A5] hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleTextSearch}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-2xl hover:from-[#7FE0EE] hover:to-[#72C16B] hover:scale-105 hover:shadow-lg hover:shadow-[#72C16B]/50 transition-all duration-300 mb-4"
          >
            Search by Text
          </button>

          {/* Image Search */}
          <div className="border-t border-[rgba(101,104,89,0.3)] pt-4">
            <p className="text-[#E8F0A5] mb-3">Or search by image:</p>
            
            <button
              onClick={() => imageInputRef.current?.click()}
              className="px-6 py-3 bg-[#656859] border border-[rgba(101,104,89,0.4)] text-[#7FE0EE] rounded-2xl hover:bg-[#424F42] hover:scale-105 hover:shadow-lg hover:shadow-[#7FE0EE]/30 transition-all duration-300 flex items-center gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              Upload Image to Search
            </button>
            
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSearch} className="hidden" />
            
            {searchImage && (
              <div className="flex items-center gap-2 bg-[#656859] border border-[rgba(101,104,89,0.3)] rounded-2xl px-3 py-2 mt-3">
                <img src={searchImage} alt="Search" className="w-8 h-8 object-cover rounded-lg" />
                <span className="text-white">Searching from image</span>
                <button
                  onClick={clearSearch}
                  className="ml-auto text-[#E8F0A5] hover:text-white"
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
              <h3 className="text-white">Search Results ({searchResults.length})</h3>
              <button
                onClick={clearSearch}
                className="text-[#E8F0A5] hover:text-white transition-colors"
              >
                Clear Results
              </button>
            </div>
            
            <div className="space-y-3">
              {searchResults.map(doc => (
                <div key={doc.id}>
                  <div
                    className="flex items-center gap-3 p-4 bg-[#424F42] rounded-2xl hover:bg-[#656859] border border-[rgba(101,104,89,0.3)] hover:border-[#72C16B] transition-all duration-300 hover:scale-[1.02]"
                  >
                    <FileIcon fileName={doc.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{doc.name}</p>
                      <p className="text-[#E8F0A5]">{doc.size}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          clearSearch();
                          onViewDocument(doc.id);
                        }}
                        className="px-4 py-2 bg-[#424F42] border border-[rgba(101,104,89,0.4)] text-[#72C16B] rounded-xl hover:bg-[#656859] hover:border-[#72C16B] hover:scale-105 transition-all duration-300 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          clearSearch();
                          onCreateChatbot(doc.id);
                        }}
                        className="px-4 py-2 bg-[#424F42] border border-[rgba(101,104,89,0.4)] text-[#72C16B] rounded-xl hover:bg-[#656859] hover:border-[#72C16B] hover:scale-105 transition-all duration-300 flex items-center gap-2"
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
            <div className="w-24 h-24 bg-[#656859] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[rgba(101,104,89,0.3)]">
              <FileText className="w-12 h-12 text-[#7A9150]" />
            </div>
            <h3 className="text-white mb-2">No documents yet</h3>
            <p className="text-[#E8F0A5]">Upload your first document to get started</p>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.txt"
      />
    </div>
  );
}