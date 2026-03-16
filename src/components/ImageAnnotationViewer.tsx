import { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  X,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

export interface BoundingBox {
  id: string;
  x: number; // pixels
  y: number; // pixels
  width: number; // pixels
  height: number; // pixels
  label?: string;
  confidence?: number;
  isCorrect?: boolean; // user feedback
  visible?: boolean;
}

type ResizeHandle =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | null;

interface ImageAnnotationViewerProps {
  imageUrl: string;
  boundingBoxes: BoundingBox[];
  onSaveFeedback?: (boxes: BoundingBox[]) => void;
  onClose?: () => void;
}

const BOX_COLORS = [
  "#72C16B",
  "#7FE0EE",
  "#E8F0A5",
  "#FF6B6B",
  "#4ECDC4",
  "#95E1D3",
  "#F38181",
  "#AA96DA",
];

export function ImageAnnotationViewer({
  imageUrl,
  boundingBoxes: initialBoxes,
  onSaveFeedback,
  onClose,
}: ImageAnnotationViewerProps) {
  const [boxes, setBoxes] = useState<BoundingBox[]>(
    initialBoxes.map((box) => ({ ...box, visible: box.visible !== false }))
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [hasChanges, setHasChanges] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingBox, setDrawingBox] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawingBox, setCurrentDrawingBox] = useState<BoundingBox | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 5);
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || (e.shiftKey && !isDrawingMode)) {
      // Pan mode
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    } else if (isDrawingMode && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setDrawingBox({ x, y });
        setSelectedBoxId(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update mouse position for status bar
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / zoom);
      const y = Math.round((e.clientY - rect.top) / zoom);
      setMousePos({ x, y });
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isDragging && selectedBoxId && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setBoxes((prev) =>
        prev.map((box) => {
          if (box.id === selectedBoxId) {
            return {
              ...box,
              x: Math.max(0, Math.min(rect.width - box.width, x - dragStart.x)),
              y: Math.max(0, Math.min(rect.height - box.height, y - dragStart.y)),
            };
          }
          return box;
        })
      );
      setHasChanges(true);
    } else if (resizeHandle && selectedBoxId && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setBoxes((prev) =>
        prev.map((box) => {
          if (box.id === selectedBoxId) {
            const newBox = { ...box };
            
            switch (resizeHandle) {
              case "top-left":
                const deltaX1 = x - resizeStart.x;
                const deltaY1 = y - resizeStart.y;
                newBox.x = Math.max(0, Math.min(box.x + box.width - 1, box.x + deltaX1));
                newBox.y = Math.max(0, Math.min(box.y + box.height - 1, box.y + deltaY1));
                newBox.width = Math.max(1, resizeStart.width - deltaX1);
                newBox.height = Math.max(1, resizeStart.height - deltaY1);
                break;
              case "top-right":
                const deltaY2 = y - resizeStart.y;
                newBox.y = Math.max(0, Math.min(box.y + box.height - 1, box.y + deltaY2));
                newBox.width = Math.max(1, Math.min(rect.width - box.x, x - box.x));
                newBox.height = Math.max(1, resizeStart.height - deltaY2);
                break;
              case "bottom-left":
                const deltaX3 = x - resizeStart.x;
                newBox.x = Math.max(0, Math.min(box.x + box.width - 1, box.x + deltaX3));
                newBox.width = Math.max(1, resizeStart.width - deltaX3);
                newBox.height = Math.max(1, Math.min(rect.height - box.y, y - box.y));
                break;
              case "bottom-right":
                newBox.width = Math.max(1, Math.min(rect.width - box.x, x - box.x));
                newBox.height = Math.max(1, Math.min(rect.height - box.y, y - box.y));
                break;
            }
            
            return newBox;
          }
          return box;
        })
      );
      setHasChanges(true);
    } else if (isDrawingMode && drawingBox && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const width = Math.abs(x - drawingBox.x);
      const height = Math.abs(y - drawingBox.y);
      const startX = Math.min(drawingBox.x, x);
      const startY = Math.min(drawingBox.y, y);

      setCurrentDrawingBox({
        id: "drawing",
        x: startX,
        y: startY,
        width,
        height,
        label: "Object",
        visible: true,
      });
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
      setIsDrawingMode(false);
    } else if (isDrawingMode) {
      setDrawingBox(null);
      setCurrentDrawingBox(null);
    }
  };

  const handleBoxMouseDown = (e: React.MouseEvent, boxId: string) => {
    e.stopPropagation();
    if (!imageRef.current || isDrawingMode) return;

    const rect = imageRef.current.getBoundingClientRect();
    const box = boxes.find((b) => b.id === boxId);
    if (!box) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectedBoxId(boxId);
    setResizeHandle(handle);
    setResizeStart({ x, y, width: box.width, height: box.height });
  };

  const deleteBox = (boxId: string) => {
    setBoxes((prev) => prev.filter((box) => box.id !== boxId));
    setHasChanges(true);
    if (selectedBoxId === boxId) {
      setSelectedBoxId(null);
    }
  };

  const toggleBoxVisibility = (boxId: string) => {
    setBoxes((prev) =>
      prev.map((box) =>
        box.id === boxId ? { ...box, visible: !box.visible } : box
      )
    );
  };

  const updateBoxLabel = (boxId: string, label: string) => {
    setBoxes((prev) =>
      prev.map((box) => (box.id === boxId ? { ...box, label } : box))
    );
    setHasChanges(true);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when editing label
      if (editingLabelId) return;

      // W - Create RectBox
      if (e.key === 'w' || e.key === 'W') {
        setIsDrawingMode((prev) => !prev);
        setDrawingBox(null);
        setCurrentDrawingBox(null);
        e.preventDefault();
      }
      // Delete - Delete selected box
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBoxId) {
        deleteBox(selectedBoxId);
        e.preventDefault();
      }
      // Ctrl+S - Save
      else if (e.ctrlKey && e.key === 's') {
        handleSave();
        e.preventDefault();
      }
      // Escape - Cancel drawing or deselect
      else if (e.key === 'Escape') {
        setIsDrawingMode(false);
        setDrawingBox(null);
        setCurrentDrawingBox(null);
        setSelectedBoxId(null);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoxId, editingLabelId]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const getBoxColor = (index: number) => BOX_COLORS[index % BOX_COLORS.length];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full h-full max-w-7xl max-h-screen p-4 flex flex-col">
        {/* Header */}
        <div className="bg-[#424F42] rounded-t-2xl p-4 flex items-center justify-between border border-[rgba(101,104,89,0.3)]">
          <div className="flex items-center gap-4">
            <h3 className="text-white text-lg">Image Annotation - LabelImg Style</h3>
            <span className="text-[#E8F0A5] text-sm">
              {boxes.length} box{boxes.length !== 1 ? "es" : ""}
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
              title="Create RectBox (W)"
            >
              <span className="text-sm font-semibold">W</span>
              <span className="text-sm">Create RectBox</span>
            </button>

            <div className="h-6 w-px bg-[rgba(101,104,89,0.3)] mx-2" />

            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-[#72C16B]" />
            </button>
            <div className="px-3 py-1.5 bg-[#656859] rounded-xl text-white min-w-[80px] text-center">
              <span className="text-sm">{Math.round(zoom * 100)}%</span>
            </div>
            <button
              onClick={() => setZoom(Math.min(5, zoom + 0.2))}
              className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-[#72C16B]" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4 text-[#72C16B]" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[#E8F0A5] text-sm">
              {isDrawingMode ? "🖱️ Click & drag to draw" : "📦 Click box to select · Shift+Drag to pan"}
            </div>

            {hasChanges && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                title="Save (Ctrl+S)"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-3 overflow-hidden">
          {/* Image Viewer */}
          <div
            ref={containerRef}
            className={`flex-1 bg-[#63786E] overflow-hidden relative border border-t-0 border-[rgba(101,104,89,0.3)] ${
              isDrawingMode ? "cursor-crosshair" : "cursor-move"
            }`}
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
                  className="max-w-none select-none"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center",
                  }}
                  draggable={false}
                />

                {/* Bounding Boxes */}
                {boxes.filter(box => box.visible !== false).map((box, index) => (
                  <div
                    key={box.id}
                    className={`absolute border-2 transition-all ${
                      selectedBoxId === box.id
                        ? "border-[#7FE0EE] shadow-lg shadow-[#7FE0EE]/50"
                        : ""
                    }`}
                    style={{
                      left: `${box.x}px`,
                      top: `${box.y}px`,
                      width: `${box.width}px`,
                      height: `${box.height}px`,
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                      borderColor: selectedBoxId === box.id ? "#7FE0EE" : getBoxColor(index),
                      cursor: isDrawingMode ? "crosshair" : "move",
                    }}
                    onMouseDown={(e) => handleBoxMouseDown(e, box.id)}
                  >
                    {/* Label inside box */}
                    <div
                      className="absolute top-1 left-1 px-2 py-1 text-xs text-white rounded shadow-lg pointer-events-none"
                      style={{
                        backgroundColor: getBoxColor(index),
                        transform: `scale(${1 / zoom})`,
                        transformOrigin: "top left",
                      }}
                    >
                      {box.label || "Object"}
                    </div>

                    {/* Resize Handles - Only show for selected box */}
                    {selectedBoxId === box.id && !isDrawingMode && (
                      <>
                        <div
                          className="absolute w-3 h-3 bg-[#7FE0EE] border border-white cursor-nwse-resize"
                          style={{
                            left: "-6px",
                            top: "-6px",
                            transform: `scale(${1 / zoom})`,
                            transformOrigin: "center",
                          }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "top-left", box.id)}
                        />
                        <div
                          className="absolute w-3 h-3 bg-[#7FE0EE] border border-white cursor-nesw-resize"
                          style={{
                            right: "-6px",
                            top: "-6px",
                            transform: `scale(${1 / zoom})`,
                            transformOrigin: "center",
                          }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "top-right", box.id)}
                        />
                        <div
                          className="absolute w-3 h-3 bg-[#7FE0EE] border border-white cursor-nesw-resize"
                          style={{
                            left: "-6px",
                            bottom: "-6px",
                            transform: `scale(${1 / zoom})`,
                            transformOrigin: "center",
                          }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "bottom-left", box.id)}
                        />
                        <div
                          className="absolute w-3 h-3 bg-[#7FE0EE] border border-white cursor-nwse-resize"
                          style={{
                            right: "-6px",
                            bottom: "-6px",
                            transform: `scale(${1 / zoom})`,
                            transformOrigin: "center",
                          }}
                          onMouseDown={(e) => handleResizeHandleMouseDown(e, "bottom-right", box.id)}
                        />
                      </>
                    )}
                  </div>
                ))}

                {/* Drawing Box Preview */}
                {isDrawingMode && currentDrawingBox && (
                  <div
                    className="absolute border-2 border-dashed border-[#7FE0EE]"
                    style={{
                      left: `${currentDrawingBox.x}px`,
                      top: `${currentDrawingBox.y}px`,
                      width: `${currentDrawingBox.width}px`,
                      height: `${currentDrawingBox.height}px`,
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      className="absolute top-1 left-1 px-2 py-1 text-xs text-white bg-[#7FE0EE] rounded shadow-lg"
                      style={{
                        transform: `scale(${1 / zoom})`,
                        transformOrigin: "top left",
                      }}
                    >
                      New Box
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Box List */}
          <div className="w-80 bg-[#424F42] overflow-y-auto border border-t-0 border-l-0 border-[rgba(101,104,89,0.3)] flex flex-col">
            <div className="p-4 border-b border-[rgba(101,104,89,0.3)]">
              <h4 className="text-white font-semibold mb-2">Box Labels</h4>
              <p className="text-[#E8F0A5] text-xs">Click to select · Del to delete</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {boxes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#E8F0A5] text-sm">No boxes yet</p>
                  <p className="text-[#E8F0A5] text-xs mt-2">Press W to start drawing</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {boxes.map((box, index) => (
                    <div
                      key={box.id}
                      className={`rounded-xl p-3 transition-all cursor-pointer ${
                        selectedBoxId === box.id
                          ? "bg-[#656859] ring-2 ring-[#72C16B]"
                          : "bg-[#63786E] hover:bg-[#656859]"
                      }`}
                      onClick={() => setSelectedBoxId(box.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBoxVisibility(box.id);
                          }}
                          className="p-1 hover:bg-[#424F42] rounded transition-all"
                        >
                          {box.visible !== false ? (
                            <Eye className="w-4 h-4 text-[#72C16B]" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        
                        <div
                          className="w-4 h-4 rounded border border-white"
                          style={{ backgroundColor: getBoxColor(index) }}
                        />
                        
                        {editingLabelId === box.id ? (
                          <input
                            type="text"
                            value={box.label || ""}
                            onChange={(e) => updateBoxLabel(box.id, e.target.value)}
                            onBlur={() => setEditingLabelId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingLabelId(null);
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 bg-[#424F42] text-white text-sm rounded border border-[#72C16B] focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className="flex-1 text-white text-sm truncate"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingLabelId(box.id);
                            }}
                          >
                            {box.label || "Object"}
                          </span>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBox(box.id);
                          }}
                          className="p-1 hover:bg-red-500 rounded transition-all"
                          title="Delete (Del)"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      
                      <div className="text-[#E8F0A5] text-xs space-y-1 ml-7">
                        <div>x: {box.x.toFixed(1)}px, y: {box.y.toFixed(1)}px</div>
                        <div>w: {box.width.toFixed(1)}px, h: {box.height.toFixed(1)}px</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="p-3 border-t border-[rgba(101,104,89,0.3)] bg-[#63786E]">
              <h5 className="text-white text-xs font-semibold mb-2">Shortcuts</h5>
              <div className="text-[#E8F0A5] text-xs space-y-1">
                <div><kbd className="bg-[#424F42] px-1 rounded">W</kbd> Create Box</div>
                <div><kbd className="bg-[#424F42] px-1 rounded">Del</kbd> Delete</div>
                <div><kbd className="bg-[#424F42] px-1 rounded">Ctrl+S</kbd> Save</div>
                <div><kbd className="bg-[#424F42] px-1 rounded">Esc</kbd> Cancel</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-[#424F42] rounded-b-2xl p-2 border border-t-0 border-[rgba(101,104,89,0.3)] flex items-center justify-between text-[#E8F0A5] text-xs">
          <div className="flex gap-6">
            <span>X: {mousePos.x}, Y: {mousePos.y}</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            <span>Boxes: {boxes.length}</span>
          </div>
          <div>
            {isDrawingMode && "Drawing mode active"}
            {selectedBoxId && !isDrawingMode && `Selected: ${boxes.find(b => b.id === selectedBoxId)?.label || "Box"}`}
          </div>
        </div>
      </div>
    </div>
  );
}