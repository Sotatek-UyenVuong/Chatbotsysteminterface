import { ArrowLeft, Download, Trash2, FileText, Calendar, HardDrive } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Document } from '../App';

interface DocumentLibraryProps {
  documents: Document[];
  onDeleteDocument: (id: string) => void;
  onViewDocument: (id: string) => void;
  onBack: () => void;
}

export function DocumentLibrary({ documents, onDeleteDocument, onViewDocument, onBack }: DocumentLibraryProps) {
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
    toast.success(`Downloading: ${doc.name}`);
  };

  const handleDelete = (doc: Document) => {
    if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      onDeleteDocument(doc.id);
      toast.success('Document deleted');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-gray-900">Document Library</h1>
                <p className="text-gray-500">Manage and view all uploaded documents</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-900">{documents.length}</p>
              <p className="text-gray-500">Document{documents.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {documents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6">Upload documents to start using the chatbot</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>

                  {/* Document Info */}
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onViewDocument(doc.id)}
                  >
                    <h3 className="text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-4 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(doc.uploadDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        <span>{doc.size}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}