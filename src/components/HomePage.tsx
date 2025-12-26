import { useState, useRef } from 'react';
import { Upload, FileText, Library, Search, Image as ImageIcon, X, Bot, Eye } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Document } from '../App';

interface HomePageProps {
  onDocumentUpload: (doc: Document) => void;
  onGoToLibrary: () => void;
  onViewDocument: (id: string) => void;
  onCreateChatbot: (id: string) => void;
  documents: Document[];
  documentCount: number;
}

export function HomePage({ onDocumentUpload, onGoToLibrary, onViewDocument, onCreateChatbot, documents, documentCount }: HomePageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchImage, setSearchImage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const newDoc: Document = {
          id: `doc-${Date.now()}-${Math.random()}`,
          name: file.name,
          uploadDate: new Date().toISOString(),
          size: formatFileSize(file.size),
          content: e.target?.result as string || 'Sample document content'
        };

        onDocumentUpload(newDoc);
        toast.success(`Upload successful: ${file.name}`);
      };

      reader.readAsText(file);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      performSearch(e.target.value);
    } else {
      setSearchResults([]);
    }
  };

  const performSearch = (query: string) => {
    setIsSearching(true);
    
    // Simulate search with timeout
    setTimeout(() => {
      const results = documents.filter(doc => 
        doc.name.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length > 0) {
        toast.success(`Found ${results.length} document${results.length > 1 ? 's' : ''}`);
      } else {
        toast.info('No matching documents found');
      }
    }, 500);
  };

  const handleImageSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        setSearchImage(e.target?.result as string);
        setIsSearching(true);
        
        // Simulate image search with AI
        setTimeout(() => {
          // Mock search: find documents (in real app, you'd send image to AI service)
          const results = documents.slice(0, Math.min(3, documents.length));
          setSearchResults(results);
          setIsSearching(false);
          toast.success(`Found ${results.length} related document${results.length > 1 ? 's' : ''} from image`);
        }, 1000);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchImage(null);
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-gray-900 mb-2">Chatbot System</h1>
            <p className="text-gray-600">Upload documents and create chatbots for Q&A</p>
          </div>
          
          <button
            onClick={onGoToLibrary}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-gray-700"
          >
            <Library className="w-5 h-5" />
            <span>Document Library ({documentCount})</span>
          </button>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-white rounded-2xl shadow-xl p-12 transition-all ${
            isDragging ? 'border-4 border-blue-500 bg-blue-50' : 'border-2 border-dashed border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            <div className={`mb-6 p-6 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Upload className={`w-16 h-16 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>

            <h2 className="text-gray-900 mb-2">Upload Documents</h2>
            <p className="text-gray-500 mb-6">Drag and drop files here or click to select files</p>

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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Select Documents
            </button>

            <p className="text-gray-400 mt-4">Supported: PDF, DOC, DOCX, TXT</p>
          </div>
        </div>

        {/* Search Area */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-8">
          <h3 className="text-gray-900 mb-4">Search Documents</h3>
          
          {/* Text Search */}
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 mb-4">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or document content..."
              className="ml-2 flex-1 border-none outline-none focus:ring-0"
            />
            {(searchQuery || searchImage) && (
              <button
                onClick={handleClearSearch}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Image Search */}
          <div className="flex items-center gap-4">
            <input
              ref={imageInputRef}
              type="file"
              onChange={handleImageSearchChange}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              Search by image
            </button>
            
            {searchImage && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <img src={searchImage} alt="Search" className="w-8 h-8 object-cover rounded" />
                <span className="text-gray-600">Searching from image</span>
              </div>
            )}
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Searching...</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="mt-6">
              <h4 className="text-gray-900 mb-4">Search Results ({searchResults.length} document{searchResults.length > 1 ? 's' : ''})</h4>
              <div className="space-y-3">
                {searchResults.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 border border-gray-200 transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-gray-900 truncate">{doc.name}</h5>
                      <p className="text-gray-500">{doc.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDocument(doc.id);
                        }}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateChatbot(doc.id);
                          toast.success(`Created chatbot for: ${doc.name}`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Bot className="w-4 h-4" />
                        Create Chatbot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isSearching && (searchQuery || searchImage) && searchResults.length === 0 && (
            <div className="mt-6 text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No matching documents found</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Easy Upload</h3>
            <p className="text-gray-600">Drag and drop or select files to upload documents</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Library className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Manage Documents</h3>
            <p className="text-gray-600">View, download and delete documents easily</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Create Chatbot</h3>
            <p className="text-gray-600">Intelligent Q&A about document content</p>
          </div>
        </div>
      </div>
    </div>
  );
}