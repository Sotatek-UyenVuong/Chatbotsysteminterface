import { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  Move,
  X,
  Check,
  RotateCcw,
  Save,
  Square,
} from "lucide-react";

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

type ResizeHandle =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "right"
  | "bottom"
  | "left"
  | null;

interface ImageAnnotationViewerProps {
  imageUrl: string;
  boundingBoxes: BoundingBox[];
  onSaveFeedback?: (boxes: BoundingBox[]) => void;
  onClose?: () => void;
}

export function ImageAnnotationViewer({
  imageUrl,
  boundingBoxes: initialBoxes,
  onSaveFeedback,
  onClose,
}: ImageAnnotationViewerProps) {
  const [boxes, setBoxes] = useState<BoundingBox[]>(initialBoxes);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [hasChanges, setHasChanges] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingBox, setDrawingBox] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentDrawingBox, setCurrentDrawingBox] = useState<BoundingBox | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 5);
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      // Middle mouse or right click or shift+left = pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    } else if (isDrawingMode && imageRef.current && e.target === imageRef.current) {
      // Start drawing new box
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDrawingBox({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isDragging && selectedBoxId && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setBoxes((prev) =>
        prev.map((box) => {
          if (box.id === selectedBoxId) {
            return {
              ...box,
              x: Math.max(0, Math.min(100 - box.width, x - dragStart.x)),
              y: Math.max(0, Math.min(100 - box.height, y - dragStart.y)),
            };
          }
          return box;
        })
      );
    } else if (resizeHandle && selectedBoxId && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setBoxes((prev) =>
        prev.map((box) => {
          if (box.id === selectedBoxId) {
            switch (resizeHandle) {
              case "top-left":
                return {
                  ...box,
                  x: Math.max(0, Math.min(100 - box.width, x - resizeStart.x)),
                  y: Math.max(0, Math.min(100 - box.height, y - resizeStart.y)),
                  width: Math.max(
                    0,
                    Math.min(100, box.width + resizeStart.x - x)
                  ),
                  height: Math.max(
                    0,
                    Math.min(100, box.height + resizeStart.y - y)
                  ),
                };
              case "top-right":
                return {
                  ...box,
                  y: Math.max(0, Math.min(100 - box.height, y - resizeStart.y)),
                  width: Math.max(
                    0,
                    Math.min(100, x - resizeStart.x + box.width)
                  ),
                  height: Math.max(
                    0,
                    Math.min(100, box.height + resizeStart.y - y)
                  ),
                };
              case "bottom-left":
                return {
                  ...box,
                  x: Math.max(0, Math.min(100 - box.width, x - resizeStart.x)),
                  width: Math.max(
                    0,
                    Math.min(100, box.width + resizeStart.x - x)
                  ),
                  height: Math.max(
                    0,
                    Math.min(100, y - resizeStart.y + box.height)
                  ),
                };
              case "bottom-right":
                return {
                  ...box,
                  width: Math.max(
                    0,
                    Math.min(100, x - resizeStart.x + box.width)
                  ),
                  height: Math.max(
                    0,
                    Math.min(100, y - resizeStart.y + box.height)
                  ),
                };
              case "top":
                return {
                  ...box,
                  y: Math.max(0, Math.min(100 - box.height, y - resizeStart.y)),
                  height: Math.max(
                    0,
                    Math.min(100, box.height + resizeStart.y - y)
                  ),
                };
              case "right":
                return {
                  ...box,
                  width: Math.max(
                    0,
                    Math.min(100, x - resizeStart.x + box.width)
                  ),
                };
              case "bottom":
                return {
                  ...box,
                  height: Math.max(
                    0,
                    Math.min(100, y - resizeStart.y + box.height)
                  ),
                };
              case "left":
                return {
                  ...box,
                  x: Math.max(0, Math.min(100 - box.width, x - resizeStart.x)),
                  width: Math.max(
                    0,
                    Math.min(100, box.width + resizeStart.x - x)
                  ),
                };
              default:
                return box;
            }
          }
          return box;
        })
      );
    } else if (isDrawingMode && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (drawingBox) {
        const width = Math.abs(x - drawingBox.x);
        const height = Math.abs(y - drawingBox.y);
        const startX = Math.min(drawingBox.x, x);
        const startY = Math.min(drawingBox.y, y);

        setCurrentDrawingBox({
          id: "new",
          x: startX,
          y: startY,
          width,
          height,
          label: "Object",
          confidence: 0.9,
          isCorrect: undefined,
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
    setResizeHandle(null);
    if (isDrawingMode && currentDrawingBox && currentDrawingBox.width > 1 && currentDrawingBox.height > 1) {
      const newBox: BoundingBox = {
        ...currentDrawingBox,
        id: `box-${Date.now()}`,
      };
      setBoxes((prev) => [...prev, newBox]);
      setDrawingBox(null);
      setCurrentDrawingBox(null);
      setHasChanges(true);
    } else if (isDrawingMode) {
      setDrawingBox(null);
      setCurrentDrawingBox(null);
    }
  };

  const handleBoxMouseDown = (e: React.MouseEvent, boxId: string) => {
    e.stopPropagation();
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const box = boxes.find((b) => b.id === boxId);
    if (!box) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setSelectedBoxId(boxId);
    setIsDragging(true);
    setDragStart({ x: x - box.x, y: y - box.y });
  };

  const handleResizeHandleMouseDown = (
    e: React.MouseEvent,
    handle: ResizeHandle,
    boxId: string
  ) => {
    e.stopPropagation();
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const box = boxes.find((b) => b.id === boxId);
    if (!box) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setSelectedBoxId(boxId);
    setResizeHandle(handle);
    setResizeStart({ x: x - box.x, y: y - box.y });
  };

  const markBoxAsCorrect = (boxId: string, isCorrect: boolean) => {
    setBoxes((prev) =>
      prev.map((box) =>
        box.id === boxId ? { ...box, isCorrect } : box
      )
    );
    setHasChanges(true);
  };

  const deleteBox = (boxId: string) => {
    setBoxes((prev) => prev.filter((box) => box.id !== boxId));
    setHasChanges(true);
    if (selectedBoxId === boxId) {
      setSelectedBoxId(null);
    }
  };

  const handleSave = () => {
    if (onSaveFeedback) {
      onSaveFeedback(boxes);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full h-full max-w-7xl max-h-screen p-4 flex flex-col">
        {/* Header */}
        <div className="bg-[#424F42] rounded-t-2xl p-4 flex items-center justify-between border border-[rgba(101,104,89,0.3)]">
          <div className="flex items-center gap-4">
            <h3 className="text-white text-lg">Image Annotation Editor</h3>
            <span className="text-[#E8F0A5] text-sm">
              {boxes.filter((b) => b.isCorrect === true).length} correct ·{" "}
              {boxes.filter((b) => b.isCorrect === false).length} incorrect ·{" "}
              {boxes.filter((b) => b.isCorrect === undefined).length} pending
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300"
          >
            <X className="w-5 h-5 text-[#72C16B]" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-[#424F42] p-3 flex items-center justify-between border-x border-[rgba(101,104,89,0.3)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsDrawingMode(!isDrawingMode);
                setDrawingBox(null);
                setCurrentDrawingBox(null);
                setSelectedBoxId(null);
              }}
              className={`px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                isDrawingMode
                  ? "bg-[#72C16B] text-white"
                  : "bg-[#656859] text-[#E8F0A5] hover:bg-[#72C16B]"
              }`}
              title="Draw new box"
            >
              <Square className="w-4 h-4" />
              <span className="text-sm">Draw Box</span>
            </button>

            <div className="h-6 w-px bg-[rgba(101,104,89,0.3)] mx-2" />

            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300"
            >
              <ZoomOut className="w-4 h-4 text-[#72C16B]" />
            </button>
            <div className="px-3 py-1.5 bg-[#656859] rounded-xl text-white min-w-[80px] text-center">
              <span className="text-sm">{Math.round(zoom * 100)}%</span>
            </div>
            <button
              onClick={() => setZoom(Math.min(5, zoom + 0.2))}
              className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300"
            >
              <ZoomIn className="w-4 h-4 text-[#72C16B]" />
            </button>

            <div className="h-6 w-px bg-[rgba(101,104,89,0.3)] mx-2" />

            <button
              onClick={handleReset}
              className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300 flex items-center gap-2"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4 text-[#72C16B]" />
              <span className="text-[#E8F0A5] text-sm">Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[#E8F0A5] text-sm flex items-center gap-2">
              <Move className="w-4 h-4" />
              <span>
                {isDrawingMode
                  ? "Click & drag to draw box"
                  : "Shift+Drag to pan · Click box to select"}
              </span>
            </div>

            {hasChanges && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Feedback
              </button>
            )}
          </div>
        </div>

        {/* Image Viewer */}
        <div
          ref={containerRef}
          className="flex-1 bg-[#63786E] rounded-b-2xl overflow-hidden relative border border-t-0 border-[rgba(101,104,89,0.3)] cursor-move"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          >
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Annotated"
                className="max-w-none"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center",
                }}
                draggable={false}
              />

              {/* Bounding Boxes */}
              {boxes.map((box) => (
                <div
                  key={box.id}
                  className={`absolute border-2 cursor-move transition-all ${
                    selectedBoxId === box.id
                      ? "border-[#7FE0EE] shadow-lg shadow-[#7FE0EE]/50"
                      : box.isCorrect === true
                        ? "border-green-500"
                        : box.isCorrect === false
                          ? "border-red-500"
                          : "border-yellow-500"
                  }`}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                  onMouseDown={(e) => handleBoxMouseDown(e, box.id)}
                >
                  {/* Label */}
                  <div
                    className={`absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap ${
                      box.isCorrect === true
                        ? "bg-green-500"
                        : box.isCorrect === false
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  >
                    {box.label || "Object"}{" "}
                    {box.confidence && `(${Math.round(box.confidence * 100)}%)`}
                  </div>

                  {/* Action Buttons */}
                  {selectedBoxId === box.id && (
                    <div className="absolute -bottom-10 left-0 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markBoxAsCorrect(box.id, true);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          box.isCorrect === true
                            ? "bg-green-500"
                            : "bg-[#424F42] hover:bg-green-500"
                        }`}
                        title="Mark as correct"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markBoxAsCorrect(box.id, false);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          box.isCorrect === false
                            ? "bg-red-500"
                            : "bg-[#424F42] hover:bg-red-500"
                        }`}
                        title="Mark as incorrect"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBox(box.id);
                        }}
                        className="p-1.5 bg-[#424F42] hover:bg-red-600 rounded-lg transition-all"
                        title="Delete box"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}

                  {/* Resize Handles */}
                  <div
                    className="absolute top-0 left-0 cursor-nwse-resize"
                    style={{ transform: "translate(-50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "top-left", box.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute top-0 right-0 cursor-nesw-resize"
                    style={{ transform: "translate(50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "top-right", box.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute bottom-0 left-0 cursor-nesw-resize"
                    style={{ transform: "translate(-50%, 50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "bottom-left", box.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute bottom-0 right-0 cursor-nwse-resize"
                    style={{ transform: "translate(50%, 50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "bottom-right", box.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute top-0 left-1/2 cursor-n-resize"
                    style={{ transform: "translate(-50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "top", box.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute right-0 top-1/2 cursor-e-resize"
                    style={{ transform: "translate(50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "right", box.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute bottom-0 left-1/2 cursor-s-resize"
                    style={{ transform: "translate(-50%, 50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "bottom", box.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute left-0 top-1/2 cursor-w-resize"
                    style={{ transform: "translate(-50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "left", box.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                </div>
              ))}

              {/* Drawing Box */}
              {isDrawingMode && currentDrawingBox && (
                <div
                  className="absolute border-2 cursor-move transition-all border-[#7FE0EE] shadow-lg shadow-[#7FE0EE]/50"
                  style={{
                    left: `${currentDrawingBox.x}%`,
                    top: `${currentDrawingBox.y}%`,
                    width: `${currentDrawingBox.width}%`,
                    height: `${currentDrawingBox.height}%`,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                >
                  {/* Label */}
                  <div
                    className={`absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap bg-yellow-500`}
                  >
                    {currentDrawingBox.label || "Object"}{" "}
                    {currentDrawingBox.confidence &&
                      `(${Math.round(currentDrawingBox.confidence * 100)}%)`}
                  </div>

                  {/* Action Buttons */}
                  {selectedBoxId === currentDrawingBox.id && (
                    <div className="absolute -bottom-10 left-0 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markBoxAsCorrect(currentDrawingBox.id, true);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          currentDrawingBox.isCorrect === true
                            ? "bg-green-500"
                            : "bg-[#424F42] hover:bg-green-500"
                        }`}
                        title="Mark as correct"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markBoxAsCorrect(currentDrawingBox.id, false);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          currentDrawingBox.isCorrect === false
                            ? "bg-red-500"
                            : "bg-[#424F42] hover:bg-red-500"
                        }`}
                        title="Mark as incorrect"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBox(currentDrawingBox.id);
                        }}
                        className="p-1.5 bg-[#424F42] hover:bg-red-600 rounded-lg transition-all"
                        title="Delete box"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}

                  {/* Resize Handles */}
                  <div
                    className="absolute top-0 left-0 cursor-nwse-resize"
                    style={{ transform: "translate(-50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "top-left", currentDrawingBox.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute top-0 right-0 cursor-nesw-resize"
                    style={{ transform: "translate(50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "top-right", currentDrawingBox.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute bottom-0 left-0 cursor-nesw-resize"
                    style={{ transform: "translate(-50%, 50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "bottom-left", currentDrawingBox.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute bottom-0 right-0 cursor-nwse-resize"
                    style={{ transform: "translate(50%, 50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "bottom-right", currentDrawingBox.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute top-0 left-1/2 cursor-n-resize"
                    style={{ transform: "translate(-50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "top", currentDrawingBox.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute right-0 top-1/2 cursor-e-resize"
                    style={{ transform: "translate(50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "right", currentDrawingBox.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute bottom-0 left-1/2 cursor-s-resize"
                    style={{ transform: "translate(-50%, 50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "bottom", currentDrawingBox.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                  <div
                    className="absolute left-0 top-1/2 cursor-w-resize"
                    style={{ transform: "translate(-50%, -50%)" }}
                    onMouseDown={(e) =>
                      handleResizeHandleMouseDown(e, "left", currentDrawingBox.id)
                    }
                  >
                    <Square className="w-4 h-4 text-[#7FE0EE]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-2 bg-[#424F42] rounded-lg p-3 border border-[rgba(101,104,89,0.3)]">
          <div className="flex items-center justify-between text-[#E8F0A5] text-sm">
            <div className="flex gap-6">
              <span>🖱️ Scroll to zoom</span>
              <span>⌨️ Shift + Drag to pan</span>
              <span>👆 Click box to select</span>
              <span>✋ Drag box to move</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-yellow-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-green-500" />
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-500" />
                <span>Incorrect</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}