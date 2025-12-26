import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { DocumentLibrary } from './components/DocumentLibrary';
import { DocumentViewer } from './components/DocumentViewer';
import { ChatbotInterface } from './components/ChatbotInterface';
import { Toaster } from 'sonner@2.0.3';

export interface Document {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  content: string;
}

export interface Chatbot {
  id: string;
  documentId: string;
  documentName: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  relatedDocuments?: RelatedDocument[];
}

export interface RelatedDocument {
  documentId: string;
  documentName: string;
  page: number;
}

type Screen = 'home' | 'library' | 'viewer' | 'chatbot';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);

  const addDocument = (doc: Document) => {
    setDocuments(prev => [...prev, doc]);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    setChatbots(prev => prev.filter(bot => bot.documentId !== id));
  };

  const createChatbot = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    const newChatbot: Chatbot = {
      id: `chatbot-${Date.now()}`,
      documentId,
      documentName: document.name,
      messages: []
    };

    setChatbots(prev => [...prev, newChatbot]);
    setSelectedChatbotId(newChatbot.id);
    setCurrentScreen('chatbot');
  };

  const addMessageToChatbot = (chatbotId: string, message: Message) => {
    setChatbots(prev => prev.map(bot => 
      bot.id === chatbotId 
        ? { ...bot, messages: [...bot.messages, message] }
        : bot
    ));
  };

  const goToLibrary = () => {
    setCurrentScreen('library');
  };

  const goToViewer = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setCurrentScreen('viewer');
  };

  const goToHome = () => {
    setCurrentScreen('home');
  };

  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
  const selectedChatbot = chatbots.find(bot => bot.id === selectedChatbotId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {currentScreen === 'home' && (
        <HomePage 
          onDocumentUpload={addDocument}
          onGoToLibrary={goToLibrary}
          onViewDocument={goToViewer}
          onCreateChatbot={createChatbot}
          documents={documents}
          documentCount={documents.length}
        />
      )}

      {currentScreen === 'library' && (
        <DocumentLibrary
          documents={documents}
          onDeleteDocument={deleteDocument}
          onViewDocument={goToViewer}
          onBack={goToHome}
        />
      )}

      {currentScreen === 'viewer' && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onCreateChatbot={createChatbot}
          onBack={() => setCurrentScreen('library')}
        />
      )}

      {currentScreen === 'chatbot' && selectedChatbot && (
        <ChatbotInterface
          chatbot={selectedChatbot}
          documents={documents}
          onSendMessage={(message) => addMessageToChatbot(selectedChatbot.id, message)}
          onViewDocument={goToViewer}
          onBack={goToHome}
        />
      )}
    </div>
  );
}