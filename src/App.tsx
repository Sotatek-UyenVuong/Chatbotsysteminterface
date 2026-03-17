import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { DocumentLibrary } from './components/DocumentLibrary';
import { DocumentViewer } from './components/DocumentViewer';
import { ChatbotInterface } from './components/ChatbotInterface';
import { ChatSession } from './components/ChatSession';
import { FolderSelectionModal, FolderType } from './components/FolderSelectionModal';
import { LoginPage } from './components/LoginPage';
import { Toaster } from 'sonner@2.0.3';

export interface Document {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  content: string;
  folderId?: string;
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
  imageUrl?: string;
  boundingBoxes?: BoundingBox[];
}

export interface BoundingBox {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  label?: string;
  confidence?: number;
  isCorrect?: boolean; // user feedback
}

export interface RelatedDocument {
  documentId: string;
  documentName: string;
  page: number;
}

export interface ChatSessionData {
  id: string;
  folderId: string;
  folderName: string;
  documentIds: string[];
  messages: Message[];
}

type Screen = 'login' | 'home' | 'library' | 'viewer' | 'chatbot' | 'session';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSessionData[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<Document | null>(null);

  const handleLogin = (email: string, password: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setCurrentScreen('home');
  };

  const handleDocumentUploadRequest = (doc: Document) => {
    setPendingDocument(doc);
    setShowFolderModal(true);
  };

  const handleCreateFolder = (folderName: string): string => {
    const newFolder: FolderType = {
      id: `folder-${Date.now()}`,
      name: folderName,
      documentCount: 0,
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder.id;
  };

  const handleSelectFolder = (folderId: string) => {
    if (!pendingDocument) return;

    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Add document with folderId
    const docWithFolder = { ...pendingDocument, folderId };
    setDocuments(prev => [...prev, docWithFolder]);

    // Update folder document count
    setFolders(prev =>
      prev.map(f =>
        f.id === folderId
          ? { ...f, documentCount: f.documentCount + 1 }
          : f
      )
    );

    // Create chat session
    const newSession: ChatSessionData = {
      id: `session-${Date.now()}`,
      folderId,
      folderName: folder.name,
      documentIds: [docWithFolder.id],
      messages: [],
    };
    setChatSessions(prev => [...prev, newSession]);
    setSelectedSessionId(newSession.id);

    // Clean up and navigate
    setPendingDocument(null);
    setShowFolderModal(false);
    setCurrentScreen('session');
  };

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
  const selectedSession = chatSessions.find(s => s.id === selectedSessionId);

  const handleAddDocumentToSession = (documentId: string) => {
    if (!selectedSessionId) return;
    setChatSessions(prev =>
      prev.map(session =>
        session.id === selectedSessionId
          ? { ...session, documentIds: [...session.documentIds, documentId] }
          : session
      )
    );
  };

  const handleRemoveDocumentFromSession = (documentId: string) => {
    if (!selectedSessionId) return;
    setChatSessions(prev =>
      prev.map(session =>
        session.id === selectedSessionId
          ? { ...session, documentIds: session.documentIds.filter(id => id !== documentId) }
          : session
      )
    );
  };

  const handleSendMessageToSession = (message: Message) => {
    if (!selectedSessionId) return;
    setChatSessions(prev =>
      prev.map(session =>
        session.id === selectedSessionId
          ? { ...session, messages: [...session.messages, message] }
          : session
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {!isAuthenticated && currentScreen === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {isAuthenticated && (
        <>
          {currentScreen === 'home' && (
            <HomePage 
              onDocumentUpload={handleDocumentUploadRequest}
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

          {currentScreen === 'session' && selectedSession && (
            <ChatSession
              sessionId={selectedSession.id}
              documents={documents.filter(doc => 
                selectedSession.documentIds.includes(doc.id)
              )}
              allDocuments={documents}
              messages={selectedSession.messages}
              onSendMessage={handleSendMessageToSession}
              onAddDocument={handleAddDocumentToSession}
              onRemoveDocument={handleRemoveDocumentFromSession}
              onBack={goToHome}
            />
          )}

          {showFolderModal && (
            <FolderSelectionModal
              folders={folders}
              onCreateFolder={handleCreateFolder}
              onSelectFolder={handleSelectFolder}
              onClose={() => {
                setShowFolderModal(false);
                setPendingDocument(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}