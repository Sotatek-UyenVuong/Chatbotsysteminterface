import { useState, useRef } from "react";
import {
  ArrowLeft,
  Send,
  Plus,
  Search,
  Image as ImageIcon,
  FileText,
  X,
  Check,
  MapPin,
  Pencil,
  Maximize2,
} from "lucide-react";
import { FileIcon } from "./FileIcon";
import { ImageAnnotationViewer } from "./ImageAnnotationViewer";
import { AreaCalculator } from "./AreaCalculator";
import type { Document, Message, BoundingBox, RelatedDocument } from "../App";

interface ChatSessionProps {
  sessionId: string;
  documents: Document[]; // Documents in this session
  allDocuments: Document[]; // All documents from library
  onSendMessage: (message: Message) => void;
  messages: Message[];
  onBack: () => void;
  onAddDocument: (documentId: string) => void;
  onRemoveDocument: (documentId: string) => void;
}

export function ChatSession({
  sessionId,
  documents,
  allDocuments,
  onSendMessage,
  messages,
  onBack,
  onAddDocument,
  onRemoveDocument,
}: ChatSessionProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    documents[0]?.id || null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"text" | "image">("text");
  const [imageAnnotationData, setImageAnnotationData] = useState<{
    imageUrl: string;
    boxes: BoundingBox[];
  } | null>(null);
  const [showAreaCalculator, setShowAreaCalculator] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageSearchInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputMessage,
    };

    onSendMessage(userMessage);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: generateMockResponse(inputMessage),
        relatedDocuments: generateMockRelatedDocs(),
      };
      onSendMessage(aiResponse);
      scrollToBottom();
    }, 1000);

    setInputMessage("");
    scrollToBottom();
  };

  const generateMockResponse = (query: string): string => {
    if (query.toLowerCase().includes("diện tích")) {
      return "Tôi có thể giúp bạn tính diện tích từ hình ảnh. Bạn có thể upload ảnh và sử dụng công cụ Area Calculator để vẽ và đo diện tích các vùng.";
    }
    if (query.toLowerCase().includes("bao nhiêu")) {
      return "Dựa trên tài liệu, tôi phát hiện có 5 đối tượng trong hình ảnh. Bạn có thể click vào ảnh bên dưới để xem chi tiết và chỉnh sửa bounding boxes.";
    }
    return `Dựa trên tài liệu "${documents[0]?.name || "document.pdf"}", tôi có thể trả lời câu hỏi của bạn. Đây là thông tin liên quan được tìm thấy trong tài liệu.`;
  };

  const generateMockRelatedDocs = (): RelatedDocument[] => {
    if (documents.length === 0) return [];
    return [
      { documentId: documents[0].id, documentName: documents[0].name, page: 3 },
      { documentId: documents[0].id, documentName: documents[0].name, page: 7 },
    ];
  };

  const handleImageSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate image search
      console.log("Searching with image:", file.name);
      setIsSearching(false);
    }
  };

  const filteredDocuments = allDocuments.filter(
    (doc) =>
      !documents.some((d) => d.id === doc.id) &&
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDocument = allDocuments.find(
    (doc) => doc.id === selectedDocumentId
  );

  return (
    <div className="h-screen flex flex-col bg-[#E8F0EE]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7A9150] to-[#72C16B] text-white p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Chat Session</h2>
            <p className="text-sm opacity-90">
              {documents.length} nguồn tài liệu
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Document Sources */}
        <div className="w-80 bg-white border-r border-[#E8F0EE] flex flex-col">
          {/* Sources Header */}
          <div className="p-4 border-b border-[#E8F0EE]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#424F42]">Nguồn</h3>
              <button
                onClick={() => setIsSearching(!isSearching)}
                className="p-2 hover:bg-[#E8F0EE] rounded-lg transition-all"
              >
                {isSearching ? (
                  <X className="w-4 h-4 text-[#424F42]" />
                ) : (
                  <Plus className="w-4 h-4 text-[#72C16B]" />
                )}
              </button>
            </div>

            {/* Add Source Section */}
            {isSearching && (
              <div className="space-y-2 mb-3 p-3 bg-[#E8F0EE] rounded-xl">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSearchType("text")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                      searchType === "text"
                        ? "bg-[#72C16B] text-white"
                        : "bg-white text-[#424F42]"
                    }`}
                  >
                    <Search className="w-4 h-4 inline mr-1" />
                    Text
                  </button>
                  <button
                    onClick={() => {
                      setSearchType("image");
                      imageSearchInputRef.current?.click();
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                      searchType === "image"
                        ? "bg-[#72C16B] text-white"
                        : "bg-white text-[#424F42]"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 inline mr-1" />
                    Image
                  </button>
                </div>

                {searchType === "text" && (
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nguồn mở trên web"
                    className="w-full px-3 py-2 border border-[#72C16B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#72C16B]/50 text-sm"
                  />
                )}
              </div>
            )}

            {/* Search Results */}
            {isSearching && searchQuery && (
              <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-4 text-sm text-[#656859]">
                    Không tìm thấy tài liệu
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        onAddDocument(doc.id);
                        setSearchQuery("");
                        setIsSearching(false);
                      }}
                      className="w-full p-2 hover:bg-[#E8F0EE] rounded-lg transition-all flex items-center gap-2 text-left"
                    >
                      <FileIcon fileName={doc.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#424F42] truncate">
                          {doc.name}
                        </div>
                        <div className="text-xs text-[#656859]">{doc.size}</div>
                      </div>
                      <Plus className="w-4 h-4 text-[#72C16B] flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-2">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-[#656859]">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có nguồn nào</p>
                <p className="text-xs mt-1">Click + để thêm</p>
              </div>
            ) : (
              <div className="space-y-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-xl transition-all cursor-pointer group ${
                      selectedDocumentId === doc.id
                        ? "bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white"
                        : "bg-[#E8F0EE] text-[#424F42] hover:bg-[#7A9150]/10"
                    }`}
                    onClick={() => setSelectedDocumentId(doc.id)}
                  >
                    <div className="flex items-start gap-2">
                      <FileIcon
                        fileName={doc.name}
                        size="sm"
                        className={
                          selectedDocumentId === doc.id
                            ? "text-white"
                            : undefined
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {doc.name}
                        </div>
                        <div
                          className={`text-xs ${
                            selectedDocumentId === doc.id
                              ? "text-white/80"
                              : "text-[#656859]"
                          }`}
                        >
                          {doc.size}
                        </div>
                      </div>
                      {documents.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveDocument(doc.id);
                            if (selectedDocumentId === doc.id) {
                              setSelectedDocumentId(
                                documents.find((d) => d.id !== doc.id)?.id ||
                                  null
                              );
                            }
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                            selectedDocumentId === doc.id
                              ? "hover:bg-white/20"
                              : "hover:bg-[#424F42]/10"
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center - Chatbot */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-[#656859]">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg mb-2">Chào mừng đến Chat Session!</p>
                  <p className="text-sm">
                    Hỏi tôi bất kỳ điều gì về tài liệu của bạn
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white"
                        : "bg-[#E8F0EE] text-[#424F42]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {/* Related Documents */}
                    {message.relatedDocuments &&
                      message.relatedDocuments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#424F42]/20">
                          <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Tài liệu liên quan:
                          </div>
                          <div className="space-y-1">
                            {message.relatedDocuments.map((doc, idx) => (
                              <div
                                key={idx}
                                className="text-xs flex items-center gap-2 p-2 bg-white/50 rounded-lg"
                              >
                                <FileText className="w-3 h-3" />
                                <span className="flex-1 truncate">
                                  {doc.documentName}
                                </span>
                                <span className="text-[#72C16B] font-medium">
                                  Trang {doc.page}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Image with Bounding Boxes */}
                    {message.imageUrl && (
                      <div className="mt-3">
                        <img
                          src={message.imageUrl}
                          alt="Detection result"
                          className="rounded-lg cursor-pointer hover:opacity-90 transition-all"
                          onClick={() => {
                            if (message.boundingBoxes) {
                              setImageAnnotationData({
                                imageUrl: message.imageUrl!,
                                boxes: message.boundingBoxes,
                              });
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (message.boundingBoxes) {
                              setImageAnnotationData({
                                imageUrl: message.imageUrl!,
                                boxes: message.boundingBoxes,
                              });
                            }
                          }}
                          className="mt-2 text-xs px-3 py-1 bg-white/50 hover:bg-white/70 rounded-lg transition-all flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Chỉnh sửa bounding boxes
                        </button>
                      </div>
                    )}

                    {/* Area Calculator Button */}
                    {message.content.toLowerCase().includes("diện tích") && (
                      <button
                        onClick={() => setShowAreaCalculator(true)}
                        className="mt-3 text-xs px-3 py-2 bg-white/50 hover:bg-white/70 rounded-lg transition-all flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3" />
                        Mở Area Calculator
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#E8F0EE] bg-[#E8F0EE]">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Đặt câu hỏi..."
                className="flex-1 px-4 py-3 rounded-xl border-2 border-[#72C16B] focus:outline-none focus:ring-2 focus:ring-[#72C16B]/50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#656859] mt-2 text-center">
              0 nguồn
            </p>
          </div>
        </div>

        {/* Right - Document Preview */}
        <div className="w-96 bg-[#63786E] border-l border-[#E8F0EE] flex flex-col">
          <div className="p-4 border-b border-[#E8F0EE]/20 bg-[#424F42]">
            <h3 className="font-semibold text-white">Preview</h3>
            {selectedDocument && (
              <p className="text-xs text-[#E8F0EE] mt-1 truncate">
                {selectedDocument.name}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedDocument ? (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <FileIcon fileName={selectedDocument.name} size="lg" />
                </div>
                <h4 className="font-semibold text-[#424F42] mb-2 text-center">
                  {selectedDocument.name}
                </h4>
                <div className="text-sm text-[#656859] space-y-1">
                  <p>Size: {selectedDocument.size}</p>
                  <p>Upload: {selectedDocument.uploadDate}</p>
                </div>
                <div className="mt-4 p-4 bg-[#E8F0EE] rounded-lg">
                  <p className="text-sm text-[#424F42]">
                    {selectedDocument.content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-white/50">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>Chọn tài liệu để xem preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {imageAnnotationData && (
        <ImageAnnotationViewer
          imageUrl={imageAnnotationData.imageUrl}
          boundingBoxes={imageAnnotationData.boxes}
          onSaveFeedback={(boxes) => {
            console.log("Updated boxes:", boxes);
            setImageAnnotationData(null);
          }}
          onClose={() => setImageAnnotationData(null)}
        />
      )}

      {showAreaCalculator && (
        <AreaCalculator
          onSaveAreas={(imageUrl, areas) => {
            console.log("Saved areas:", areas);
            setShowAreaCalculator(false);
          }}
          onClose={() => setShowAreaCalculator(false)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
      />
      <input
        ref={imageSearchInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSearch}
        className="hidden"
      />
    </div>
  );
}
