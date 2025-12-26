import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Send, Sparkles, User, FileText, Maximize2, Minimize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import type { Chatbot, Message, Document, RelatedDocument } from '../App';
import { getFileTypeConfig } from '../utils/fileTypeUtils';
import { FileIcon } from './FileIcon';

interface ChatbotInterfaceProps {
  chatbot: Chatbot;
  documents: Document[];
  onSendMessage: (message: Message) => void;
  onViewDocument: (documentId: string) => void;
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

export function ChatbotInterface({ chatbot, documents, onSendMessage, onViewDocument, onBack }: ChatbotInterfaceProps) {
  const [input, setInput] = useState('');
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentDocument = documents.find(doc => doc.id === chatbot.documentId);
  const fileConfig = currentDocument ? getFileTypeConfig(currentDocument.name) : null;
  
  const pages = useMemo(() => 
    currentDocument ? splitIntoPages(currentDocument.content) : [''], 
    [currentDocument]
  );
  const totalPages = pages.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatbot.messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // User message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input
    };

    onSendMessage(userMessage);

    // Simulate AI response with related documents
    setTimeout(() => {
      const relatedDocs: RelatedDocument[] = documents
        .filter(doc => doc.id !== chatbot.documentId)
        .slice(0, 2)
        .map((doc, index) => ({
          documentId: doc.id,
          documentName: doc.name,
          page: Math.floor(Math.random() * 10) + 1
        }));

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `Based on the document "${chatbot.documentName}", I can answer your question. ${input.toLowerCase().includes('search') || input.toLowerCase().includes('find') 
          ? 'I found some related documents that you might be interested in.' 
          : 'This content is mentioned in your document.'}`,
        relatedDocuments: (input.toLowerCase().includes('search') || input.toLowerCase().includes('find')) ? relatedDocs : []
      };

      onSendMessage(assistantMessage);
    }, 1000);

    setInput('');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7A9150] via-[#72C16B] to-[#E8F0A5] flex flex-col">
      {/* Header */}
      <div className="bg-[#424F42] shadow-lg border-b border-[rgba(101,104,89,0.3)] flex-shrink-0 backdrop-blur-sm bg-opacity-95">
        <div className="w-full px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft className="w-5 h-5 text-[#72C16B]" />
              </button>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300"
                  style={{
                    background: fileConfig 
                      ? `linear-gradient(to bottom right, ${fileConfig.gradientColors.from}, ${fileConfig.gradientColors.to})` 
                      : 'linear-gradient(to bottom right, #7FE0EE, #E8F0A5)'
                  }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white">AI Chatbot 🤖</h2>
                  <p className="text-[#E8F0A5]">{chatbot.documentName}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDocumentExpanded(!isDocumentExpanded)}
              className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 hover:scale-110"
              title={isDocumentExpanded ? "Minimize document" : "Expand document"}
            >
              {isDocumentExpanded ? (
                <Minimize2 className="w-5 h-5 text-[#72C16B]" />
              ) : (
                <Maximize2 className="w-5 h-5 text-[#72C16B]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Split View: Chat + Document */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section - Left Side */}
        <div className={`flex flex-col transition-all ${isDocumentExpanded ? 'w-0 hidden' : 'w-full lg:w-1/2'} border-r border-[rgba(101,104,89,0.3)]`}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-[#63786E]">
            <div className="px-6 py-8">
              {chatbot.messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#656859] rounded-full flex items-center justify-center mx-auto mb-4 border border-[rgba(101,104,89,0.3)]">
                    <Sparkles className="w-8 h-8 text-[#7FE0EE]" />
                  </div>
                  <h3 className="text-white mb-2">Start conversation 💬</h3>
                  <p className="text-[#E8F0A5]">Ask me anything about your document</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {chatbot.messages.map(message => (
                    <div key={message.id}>
                      <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300"
                            style={{
                              background: fileConfig 
                                ? `linear-gradient(to bottom right, ${fileConfig.gradientColors.from}, ${fileConfig.gradientColors.to})` 
                                : 'linear-gradient(to bottom right, #7FE0EE, #E8F0A5)'
                            }}
                          >
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                        )}
                        
                        <div className={`max-w-lg ${message.role === 'user' ? 'order-first' : ''}`}>
                          <div className={`rounded-2xl px-4 py-3 shadow-lg ${ 
                            message.role === 'user' 
                              ? 'bg-gradient-to-r from-[#7A9150] to-[#72C16B] text-white' 
                              : 'bg-[#656859] border border-[rgba(101,104,89,0.3)]'
                          }`}>
                            <p className={message.role === 'user' ? 'text-white' : 'text-[#E8F0A5]'}>
                              {message.content}
                            </p>
                          </div>

                          {/* Related Documents */}
                          {message.relatedDocuments && message.relatedDocuments.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-[#E8F0A5] mb-2">Related documents:</p>
                              {message.relatedDocuments.map((relDoc, index) => {
                                const relatedDocument = documents.find(d => d.id === relDoc.documentId);
                                
                                return (
                                <div
                                  key={index}
                                  onClick={() => onViewDocument(relDoc.documentId)}
                                  className="bg-[#424F42] border border-[rgba(101,104,89,0.3)] rounded-2xl p-3 hover:shadow-lg hover:border-[#72C16B] transition-all duration-300 cursor-pointer flex items-center gap-3 hover:scale-[1.02]"
                                >
                                  {relatedDocument && <FileIcon fileName={relatedDocument.name} size="sm" />}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white truncate">{relDoc.documentName}</p>
                                    <p className="text-[#E8F0A5]">Page {relDoc.page}</p>
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-[#656859] rounded-full flex items-center justify-center flex-shrink-0 border border-[rgba(101,104,89,0.3)]">
                            <User className="w-5 h-5 text-[#72C16B]" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-[#424F42] border-t border-[rgba(101,104,89,0.3)] flex-shrink-0 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your question..."
                className="flex-1 px-4 py-3 bg-[#656859] border border-[rgba(101,104,89,0.3)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#72C16B] focus:border-transparent text-white placeholder-[#99BD98]"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-2xl hover:from-[#7FE0EE] hover:to-[#72C16B] hover:scale-105 hover:shadow-2xl hover:shadow-[#72C16B]/50 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Viewer Section - Right Side */}
        <div className={`flex flex-col transition-all ${isDocumentExpanded ? 'w-full' : 'w-full lg:w-1/2'}`}>
          {/* Document Header with Toolbar */}
          <div className="border-b border-[rgba(101,104,89,0.3)] bg-[#424F42] backdrop-blur-sm bg-opacity-95">
            {/* Document Title */}
            <div className="px-6 py-4 border-b border-[rgba(101,104,89,0.2)]">
              <div className="flex items-center gap-3">
                {currentDocument && <FileIcon fileName={currentDocument.name} size="sm" />}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white truncate">{currentDocument?.name || 'Document'}</h3>
                  <p className="text-[#E8F0A5]">{currentDocument?.size || ''}</p>
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
                    className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#72C16B]" />
                  </button>
                  <div className="px-3 py-1.5 bg-[#656859] rounded-xl text-white min-w-[100px] text-center">
                    <span className="text-sm">Page {currentPage} / {totalPages}</span>
                  </div>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                  >
                    <ChevronRight className="w-4 h-4 text-[#72C16B]" />
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                  >
                    <ZoomOut className="w-4 h-4 text-[#72C16B]" />
                  </button>
                  <div className="px-3 py-1.5 bg-[#656859] rounded-xl text-white min-w-[60px] text-center">
                    <span className="text-sm">{zoom}%</span>
                  </div>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 150}
                    className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                  >
                    <ZoomIn className="w-4 h-4 text-[#72C16B]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#63786E]">
            {currentDocument ? (
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
                <div className="bg-[#424F42] rounded-2xl shadow-lg p-4 border border-[rgba(101,104,89,0.3)] backdrop-blur-md">
                  <div className="flex items-center justify-between text-[#E8F0A5] text-sm">
                    <span>Total Pages: {totalPages}</span>
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
                  <FileText className="w-16 h-16 text-[#7A9150] mx-auto mb-4" />
                  <p className="text-[#E8F0A5]">Document not found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
