import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User, FileText, Maximize2, Minimize2 } from 'lucide-react';
import type { Chatbot, Message, Document, RelatedDocument } from '../App';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentDocument = documents.find(doc => doc.id === chatbot.documentId);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="w-full px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-gray-900">Chatbot</h2>
                  <p className="text-gray-500">{chatbot.documentName}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDocumentExpanded(!isDocumentExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section - Left Side */}
        <div className={`flex flex-col bg-gray-50 transition-all ${isDocumentExpanded ? 'w-0 hidden' : 'w-full lg:w-1/2'} border-r border-gray-200`}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-8">
              {chatbot.messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-gray-900 mb-2">Start conversation</h3>
                  <p className="text-gray-500">Ask me anything about your document</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {chatbot.messages.map(message => (
                    <div key={message.id}>
                      <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        )}
                        
                        <div className={`max-w-lg ${message.role === 'user' ? 'order-first' : ''}`}>
                          <div className={`rounded-2xl px-4 py-3 ${
                            message.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            <p className={message.role === 'user' ? 'text-white' : 'text-gray-700'}>
                              {message.content}
                            </p>
                          </div>

                          {/* Related Documents */}
                          {message.relatedDocuments && message.relatedDocuments.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-gray-600 mb-2">Related documents:</p>
                              {message.relatedDocuments.map((relDoc, index) => (
                                <div
                                  key={index}
                                  onClick={() => onViewDocument(relDoc.documentId)}
                                  className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-3"
                                >
                                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 truncate">{relDoc.documentName}</p>
                                    <p className="text-gray-500">Page {relDoc.page}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-600" />
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
          <div className="bg-white border-t flex-shrink-0 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your question..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Viewer Section - Right Side */}
        <div className={`flex flex-col bg-white transition-all ${isDocumentExpanded ? 'w-full' : 'w-full lg:w-1/2'}`}>
          {/* Document Header */}
          <div className="border-b px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 truncate">{currentDocument?.name || 'Document'}</h3>
                <p className="text-gray-500">{currentDocument?.size || ''}</p>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentDocument ? (
              <div className="prose max-w-none">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{currentDocument.content}</p>
                </div>

                {/* Document Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Size: {currentDocument.size}</span>
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
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Document not found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
