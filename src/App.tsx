import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { DocumentLibrary } from './components/DocumentLibrary';
import { DocumentViewer } from './components/DocumentViewer';
import { ChatbotInterface } from './components/ChatbotInterface';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
type AuthScreen = 'login' | 'register';

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  
  // Load from localStorage on mount
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const saved = localStorage.getItem('currentScreen');
    return (saved as Screen) || 'home';
  });
  
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('documents');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [chatbots, setChatbots] = useState<Chatbot[]>(() => {
    const saved = localStorage.getItem('chatbots');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(() => {
    return localStorage.getItem('selectedDocumentId') || null;
  });
  
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(() => {
    return localStorage.getItem('selectedChatbotId') || null;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('chatbots', JSON.stringify(chatbots));
  }, [chatbots]);

  useEffect(() => {
    localStorage.setItem('currentScreen', currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    if (selectedDocumentId) {
      localStorage.setItem('selectedDocumentId', selectedDocumentId);
    } else {
      localStorage.removeItem('selectedDocumentId');
    }
  }, [selectedDocumentId]);

  useEffect(() => {
    if (selectedChatbotId) {
      localStorage.setItem('selectedChatbotId', selectedChatbotId);
    } else {
      localStorage.removeItem('selectedChatbotId');
    }
  }, [selectedChatbotId]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="h-full max-h-full overflow-hidden bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-[#E8F0A5] text-xl">Loading...</div>
      </div>
    );
  }

  // Show login/register screens if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-full max-h-full overflow-hidden bg-[#1E1E1E]">
        {authScreen === 'login' ? (
          <LoginPage onSwitchToRegister={() => setAuthScreen('register')} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setAuthScreen('login')} />
        )}
      </div>
    );
  }

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
    <div className="h-full max-h-full overflow-hidden bg-gray-50">
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
          onCreateChatbot={createChatbot}
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
      
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}