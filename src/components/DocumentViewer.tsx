import { ArrowLeft, Bot, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Document } from '../App';

interface DocumentViewerProps {
  document: Document;
  onCreateChatbot: (documentId: string) => void;
  onBack: () => void;
}

export function DocumentViewer({ document, onCreateChatbot, onBack }: DocumentViewerProps) {
  const handleCreateChatbot = () => {
    onCreateChatbot(document.id);
    toast.success(`Created chatbot for: ${document.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <h2 className="text-gray-900 truncate">{document.name}</h2>
              </div>
            </div>
            <button
              onClick={handleCreateChatbot}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 flex-shrink-0 ml-4"
            >
              <Bot className="w-5 h-5" />
              Create Chatbot
            </button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">{document.content}</p>
            </div>
          </div>

          {/* Info Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-gray-500">
              <span>Size: {document.size}</span>
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
        </div>

        {/* Create Chatbot Prompt */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-2">Create Chatbot for this document</h3>
              <p className="text-gray-600 mb-4">
                The chatbot will help you ask questions about the document content intelligently and quickly.
              </p>
              <button
                onClick={handleCreateChatbot}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Chatbot Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}