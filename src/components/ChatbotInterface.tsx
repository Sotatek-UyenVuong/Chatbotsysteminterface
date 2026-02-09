import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, User, FileText, Maximize2, Minimize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Chatbot, Message, Document, RelatedDocument } from '../App';
import { getFileTypeConfig } from '../utils/fileTypeUtils';
import { FileIcon } from './FileIcon';
import * as api from '../api';

interface ChatbotInterfaceProps {
  chatbot: Chatbot;
  documents: Document[];
  onSendMessage: (message: Message) => void;
  onViewDocument: (documentId: string) => void;
  onBack: () => void;
}

export function ChatbotInterface({ chatbot, documents, onSendMessage, onViewDocument, onBack }: ChatbotInterfaceProps) {
  const [input, setInput] = useState('');
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentDocument = documents.find(doc => doc.id === chatbot.documentId);
  const fileConfig = currentDocument ? getFileTypeConfig(currentDocument.name) : null;
  
  // Load document info
  useEffect(() => {
    const loadDocInfo = async () => {
      if (!currentDocument) return;
      
      try {
        setIsLoading(true);
        const info = await api.getDocumentInfo(currentDocument.id);
        if (info.success) {
          setTotalPages(info.total_pages || 1);
        }
      } catch (error) {
        console.error('Failed to load document info:', error);
        const match = currentDocument.content.match(/(\d+)\s+pages?/i);
        if (match) {
          setTotalPages(parseInt(match[1], 10));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocInfo();
  }, [currentDocument]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatbot.messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userInput = input;
    setInput(''); // Clear input immediately
    setIsSending(true); // Show loading state

    // User message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userInput
    };

    onSendMessage(userMessage);

    try {
      // Call real backend API with session_id (document id)
      const response = await api.sendChatMessage(currentDocument?.id || chatbot.documentId, userInput);
      
      if (response.success && (response.answer || response.response)) {
        // Add real Gemini response (backend returns "answer")
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: response.answer || response.response || 'No response'
        };
        onSendMessage(assistantMessage);
      } else {
        // Show error message
        const errorMessage: Message = {
          id: `msg-error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${response.error || 'Failed to get response'}`
        };
        onSendMessage(errorMessage);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`
      };
      onSendMessage(errorMessage);
    } finally {
      setIsSending(false); // Hide loading state
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  // Handle page citation clicks
  const handlePageClick = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      // Optionally expand document if minimized
      if (!isDocumentExpanded && window.innerWidth < 1024) {
        setIsDocumentExpanded(true);
      }
    }
  };

  return (
    <div className="h-full max-h-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 flex-shrink-0 backdrop-blur-sm bg-opacity-95">
        <div className="w-full px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-500 to-indigo-600"
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-gray-900 font-semibold">AI Chatbot 🤖</h2>
                  <p className="text-gray-600 text-sm">{chatbot.documentName}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDocumentExpanded(!isDocumentExpanded)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
              title={isDocumentExpanded ? "Minimize document" : "Expand document"}
            >
              {isDocumentExpanded ? (
                <Minimize2 className="w-5 h-5 text-gray-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Split View: Chat + Document */}
      <div className="flex-1 flex overflow-hidden min-h-0 max-h-full">
        {/* Chat Section - Left Side */}
        <div className={`flex flex-col transition-all ${isDocumentExpanded ? 'w-0 hidden' : 'w-full lg:w-1/2'} border-r border-gray-200 flex-shrink-0 h-full max-h-full overflow-hidden`}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 min-h-0 max-h-full">
            <div className="px-6 py-8">
              {chatbot.messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 shadow-sm">
                    <Sparkles className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-gray-900 font-semibold mb-2">Start conversation 💬</h3>
                  <p className="text-gray-600">Ask me anything about your document</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {chatbot.messages.map(message => (
                    <div key={message.id}>
                      <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-500 to-indigo-600">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                        )}
                        
                        <div className={`max-w-4xl ${message.role === 'user' ? 'order-first' : ''} break-words overflow-wrap-anywhere`}>
                          <div className={`rounded-2xl px-4 py-3 shadow-sm break-words ${ 
                            message.role === 'user' 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            {message.role === 'user' ? (
                              <p className="text-white whitespace-pre-wrap">{message.content}</p>
                            ) : (
                              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-li:text-gray-800 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    // Custom renderer for text to detect [page X] patterns
                                    p: ({children, ...props}) => {
                                      const content = String(children);
                                      
                                      // Split and check if contains [page X] patterns
                                      const parts = content.split(/(\[page \d+\])/gi);
                                      
                                      // If split creates multiple parts, we have page citations
                                      if (parts.length > 1) {
                                        return (
                                          <p {...props}>
                                            {parts.map((part, i) => {
                                              const match = part.match(/\[page (\d+)\]/i);
                                              if (match) {
                                                const pageNum = parseInt(match[1], 10);
                                                return (
                                                  <button
                                                    key={i}
                                                    onClick={() => handlePageClick(pageNum)}
                                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900 transition-colors cursor-pointer font-medium text-sm mx-0.5"
                                                    title={`Jump to page ${pageNum}`}
                                                  >
                                                    📄 page {pageNum}
                                                  </button>
                                                );
                                              }
                                              return <span key={i}>{part}</span>;
                                            })}
                                          </p>
                                        );
                                      }
                                      
                                      return <p {...props}>{children}</p>;
                                    }
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {/* Related Documents */}
                          {message.relatedDocuments && message.relatedDocuments.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-gray-600 mb-2 text-sm">Related documents:</p>
                              {message.relatedDocuments.map((relDoc, index) => {
                                const relatedDocument = documents.find(d => d.id === relDoc.documentId);
                                
                                return (
                                <div
                                  key={index}
                                  onClick={() => onViewDocument(relDoc.documentId)}
                                  className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer flex items-center gap-3 hover:scale-[1.02]"
                                >
                                  {relatedDocument && <FileIcon fileName={relatedDocument.name} size="sm" />}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 font-medium truncate">{relDoc.documentName}</p>
                                    <p className="text-gray-500 text-sm">Page {relDoc.page}</p>
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200 shadow-sm">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator when sending */}
                  {isSending && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-500 to-indigo-600">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="max-w-4xl">
                        <div className="rounded-2xl px-4 py-3 shadow-sm bg-white border border-gray-200">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 flex-shrink-0 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your question..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Viewer Section - Right Side */}
        <div className={`flex flex-col transition-all ${isDocumentExpanded ? 'w-full' : 'w-full lg:w-1/2'} h-full max-h-full overflow-hidden`}>
          {/* Document Header with Toolbar */}
          <div className="border-b border-gray-200 bg-white backdrop-blur-sm bg-opacity-95 flex-shrink-0">
            {/* Document Title */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {currentDocument && <FileIcon fileName={currentDocument.name} size="sm" />}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-semibold truncate">{currentDocument?.name || 'Document'}</h3>
                  <p className="text-gray-500 text-sm">{currentDocument?.size || ''}</p>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3">
              <div className="flex items-center justify-between">
                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-900 min-w-[100px] text-center">
                    <span className="text-sm font-medium">Page {currentPage} / {totalPages}</span>
                  </div>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-900 min-w-[60px] text-center">
                    <span className="text-sm font-medium">{zoom}%</span>
                  </div>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 150}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gray-50 min-h-0 max-h-full">
            {currentDocument ? (
              <div className="max-w-4xl mx-auto">
                {/* PDF Page as Image */}
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-sm shadow-lg">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-600">Loading document...</p>
                  </div>
                ) : (
                  <div 
                    className="bg-white rounded-sm shadow-lg mx-auto transition-all duration-300 border border-gray-200 relative overflow-hidden"
                    style={{ marginBottom: '2rem' }}
                  >
                    {imageError ? (
                      <div className="flex flex-col items-center justify-center py-20 px-6">
                        <FileText className="w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">Failed to load page image</p>
                        <p className="text-gray-400 text-sm text-center">{currentDocument.content}</p>
                      </div>
                    ) : (
                      <img
                        key={`${currentDocument.id}-page-${currentPage}`}
                        src={api.getPageImageUrl(currentDocument.id, currentPage)}
                        alt={`Page ${currentPage} of ${currentDocument.name}`}
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
                      <div className="absolute bottom-4 right-4 bg-gray-900/70 px-3 py-1 rounded text-white text-sm font-medium">
                        {currentPage}
                      </div>
                    )}
                  </div>
                )}

                {/* Document Info */}
                <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between text-gray-600 text-sm">
                    <span className="font-medium">Total Pages: <span className="text-gray-900">{totalPages}</span></span>
                    <span>
                      Uploaded: {new Date(currentDocument.uploadDate).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Document not found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
