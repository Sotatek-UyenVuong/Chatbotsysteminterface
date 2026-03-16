import { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  Square,
  Circle,
  Pen,
  Trash2,
  Save,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";

interface Point {
  x: number; // pixels
  y: number; // pixels
}

interface Area {
  id: string;
  type: "rectangle" | "circle" | "polygon";
  points: Point[];
  area: number; // in pixels
  label?: string;
  color: string;
  visible?: boolean;
}

interface AreaCalculatorProps {
  initialImageUrl?: string;
  onSaveAreas?: (imageUrl: string, areas: Area[]) => void;
  onClose?: () => void;
}

const AREA_COLORS = [
  "#72C16B",
  "#7FE0EE",
  "#E8F0A5",
  "#FF6B6B",
  "#4ECDC4",
  "#95E1D3",
  "#F38181",
  "#AA96DA",
];

export function AreaCalculator({
  initialImageUrl,
  onSaveAreas,
  onClose,
}: AreaCalculatorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialImageUrl || null
  );
  const [areas, setAreas] = useState<Area[]>([]);
  const [drawingTool, setDrawingTool] = useState<
    "rectangle" | "circle" | "polygon" | null
  >(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
        setAreas([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey || e.button === 1 || e.button === 2) {
      // Pan mode
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    } else if (drawingTool && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        const point: Point = { x, y };

        if (drawingTool === "rectangle") {
          if (!isDrawing) {
            setCurrentPoints([point]);
            setIsDrawing(true);
          }
        } else if (drawingTool === "circle") {
          if (!isDrawing) {
            setCurrentPoints([point]);
            setIsDrawing(true);
          }
        } else if (drawingTool === "polygon") {
          setCurrentPoints((prev) => [...prev, point]);
          setIsDrawing(true);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update mouse position
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
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);

    if (isDrawing && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (drawingTool === "rectangle" && currentPoints.length === 1) {
        const point: Point = { x, y };
        const area = calculateRectangleArea(currentPoints[0], point);
        if (area > 10) {
          // Minimum area threshold
          addArea("rectangle", [currentPoints[0], point], area);
        }
        setCurrentPoints([]);
        setIsDrawing(false);
        setDrawingTool(null);
      } else if (drawingTool === "circle" && currentPoints.length === 1) {
        const point: Point = { x, y };
        const area = calculateCircleArea(currentPoints[0], point);
        if (area > 10) {
          addArea("circle", [currentPoints[0], point], area);
        }
        setCurrentPoints([]);
        setIsDrawing(false);
        setDrawingTool(null);
      }
    }
  };

  const finishPolygon = () => {
    if (currentPoints.length >= 3) {
      const area = calculatePolygonArea(currentPoints);
      addArea("polygon", currentPoints, area);
    }
    setCurrentPoints([]);
    setIsDrawing(false);
    setDrawingTool(null);
  };

  const addArea = (
    type: "rectangle" | "circle" | "polygon",
    points: Point[],
    area: number
  ) => {
    const newArea: Area = {
      id: `area-${Date.now()}`,
      type,
      points,
      area,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${areas.length + 1}`,
      color: AREA_COLORS[areas.length % AREA_COLORS.length],
      visible: true,
    };
    setAreas((prev) => [...prev, newArea]);
  };

  const deleteArea = (areaId: string) => {
    setAreas((prev) => prev.filter((a) => a.id !== areaId));
    if (selectedAreaId === areaId) {
      setSelectedAreaId(null);
    }
  };

  const toggleAreaVisibility = (areaId: string) => {
    setAreas((prev) =>
      prev.map((area) =>
        area.id === areaId ? { ...area, visible: !area.visible } : area
      )
    );
  };

  const updateAreaLabel = (areaId: string, label: string) => {
    setAreas((prev) =>
      prev.map((area) => (area.id === areaId ? { ...area, label } : area))
    );
  };

  const calculateRectangleArea = (p1: Point, p2: Point): number => {
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);
    return width * height;
  };

  const calculateCircleArea = (center: Point, edge: Point): number => {
    const dx = edge.x - center.x;
    const dy = edge.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    return Math.PI * radius * radius;
  };

  const calculatePolygonArea = (points: Point[]): number => {
    if (points.length < 3) return 0;

    // Shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  };

  const handleSave = () => {
    if (onSaveAreas && imageUrl) {
      onSaveAreas(imageUrl, areas);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 5);
    setZoom(newZoom);
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

      if (e.key === "r" || e.key === "R") {
        setDrawingTool(drawingTool === "rectangle" ? null : "rectangle");
        e.preventDefault();
      } else if (e.key === "c" || e.key === "C") {
        setDrawingTool(drawingTool === "circle" ? null : "circle");
        e.preventDefault();
      } else if (e.key === "p" || e.key === "P") {
        setDrawingTool(drawingTool === "polygon" ? null : "polygon");
        e.preventDefault();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedAreaId) {
        deleteArea(selectedAreaId);
        e.preventDefault();
      } else if (e.ctrlKey && e.key === "s") {
        handleSave();
        e.preventDefault();
      } else if (e.key === "Escape") {
        setDrawingTool(null);
        setCurrentPoints([]);
        setIsDrawing(false);
        setSelectedAreaId(null);
        e.preventDefault();
      } else if (e.key === "Enter" && drawingTool === "polygon" && currentPoints.length >= 3) {
        finishPolygon();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawingTool, selectedAreaId, currentPoints, editingLabelId]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const getAreaColor = (index: number) => AREA_COLORS[index % AREA_COLORS.length];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full h-full max-w-7xl max-h-screen p-4 flex flex-col">
        {/* Header */}
        <div className="bg-[#424F42] rounded-t-2xl p-4 flex items-center justify-between border border-[rgba(101,104,89,0.3)]">
          <div className="flex items-center gap-4">
            <h3 className="text-white text-lg">Area Calculator - LabelImg Style</h3>
            <span className="text-[#E8F0A5] text-sm">
              {areas.length} area{areas.length !== 1 ? "s" : ""}
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
            {!imageUrl ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setDrawingTool(drawingTool === "rectangle" ? null : "rectangle");
                    setCurrentPoints([]);
                    setIsDrawing(false);
                  }}
                  className={`px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    drawingTool === "rectangle"
                      ? "bg-[#72C16B] text-white"
                      : "bg-[#656859] text-[#E8F0A5] hover:bg-[#72C16B]"
                  }`}
                  title="Rectangle (R)"
                >
                  <span className="text-sm font-semibold">R</span>
                  <Square className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setDrawingTool(drawingTool === "circle" ? null : "circle");
                    setCurrentPoints([]);
                    setIsDrawing(false);
                  }}
                  className={`px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    drawingTool === "circle"
                      ? "bg-[#72C16B] text-white"
                      : "bg-[#656859] text-[#E8F0A5] hover:bg-[#72C16B]"
                  }`}
                  title="Circle (C)"
                >
                  <span className="text-sm font-semibold">C</span>
                  <Circle className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setDrawingTool(drawingTool === "polygon" ? null : "polygon");
                    setCurrentPoints([]);
                    setIsDrawing(false);
                  }}
                  className={`px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    drawingTool === "polygon"
                      ? "bg-[#72C16B] text-white"
                      : "bg-[#656859] text-[#E8F0A5] hover:bg-[#72C16B]"
                  }`}
                  title="Polygon (P)"
                >
                  <span className="text-sm font-semibold">P</span>
                  <Pen className="w-4 h-4" />
                </button>

                {drawingTool === "polygon" && currentPoints.length >= 3 && (
                  <button
                    onClick={finishPolygon}
                    className="px-3 py-2 bg-[#72C16B] text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm"
                  >
                    Finish (Enter)
                  </button>
                )}

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

                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4 text-[#72C16B]" />
                </button>
              </>
            )}
          </div>

          {imageUrl && areas.length > 0 && (
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

        {/* Main Content */}
        <div className="flex-1 flex gap-3 overflow-hidden">
          {/* Image Viewer */}
          <div
            ref={containerRef}
            className={`flex-1 bg-[#63786E] overflow-hidden relative border border-t-0 border-[rgba(101,104,89,0.3)] ${
              drawingTool ? "cursor-crosshair" : "cursor-move"
            }`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsPanning(false)}
          >
            {!imageUrl ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-[#7A9150] mx-auto mb-4" />
                  <p className="text-[#E8F0A5] mb-4">
                    Upload an image to start measuring areas
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    Choose Image
                  </button>
                </div>
              </div>
            ) : (
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
                    alt="Measurement"
                    className="max-w-none select-none"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "center",
                    }}
                    draggable={false}
                  />

                  {/* Render Areas */}
                  {areas.filter(area => area.visible !== false).map((area, index) => {
                    if (area.type === "rectangle" && area.points.length === 2) {
                      const p1 = area.points[0];
                      const p2 = area.points[1];
                      const x = Math.min(p1.x, p2.x);
                      const y = Math.min(p1.y, p2.y);
                      const width = Math.abs(p2.x - p1.x);
                      const height = Math.abs(p2.y - p1.y);

                      return (
                        <div
                          key={area.id}
                          className={`absolute border-2 transition-all cursor-pointer ${
                            selectedAreaId === area.id ? "shadow-lg" : ""
                          }`}
                          style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            borderColor: area.color,
                            backgroundColor: `${area.color}20`,
                            transform: `scale(${zoom})`,
                            transformOrigin: "top left",
                          }}
                          onClick={() => setSelectedAreaId(area.id)}
                        >
                          <div
                            className="absolute top-1 left-1 px-2 py-1 text-xs text-white rounded shadow-lg pointer-events-none"
                            style={{
                              backgroundColor: area.color,
                              transform: `scale(${1 / zoom})`,
                              transformOrigin: "top left",
                            }}
                          >
                            {area.label}
                          </div>
                        </div>
                      );
                    } else if (area.type === "circle" && area.points.length === 2) {
                      const center = area.points[0];
                      const edge = area.points[1];
                      const radius = Math.sqrt(
                        Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
                      );

                      return (
                        <div
                          key={area.id}
                          className="absolute rounded-full border-2 transition-all cursor-pointer"
                          style={{
                            left: `${center.x - radius}px`,
                            top: `${center.y - radius}px`,
                            width: `${radius * 2}px`,
                            height: `${radius * 2}px`,
                            borderColor: area.color,
                            backgroundColor: `${area.color}20`,
                            transform: `scale(${zoom})`,
                            transformOrigin: "top left",
                          }}
                          onClick={() => setSelectedAreaId(area.id)}
                        >
                          <div
                            className="absolute top-1 left-1 px-2 py-1 text-xs text-white rounded shadow-lg pointer-events-none"
                            style={{
                              backgroundColor: area.color,
                              transform: `scale(${1 / zoom})`,
                              transformOrigin: "top left",
                            }}
                          >
                            {area.label}
                          </div>
                        </div>
                      );
                    } else if (area.type === "polygon" && area.points.length >= 3) {
                      const points = area.points.map((p) => `${p.x},${p.y}`).join(" ");
                      
                      return (
                        <svg
                          key={area.id}
                          className="absolute top-0 left-0 pointer-events-none"
                          style={{
                            width: "100%",
                            height: "100%",
                            transform: `scale(${zoom})`,
                            transformOrigin: "top left",
                          }}
                        >
                          <polygon
                            points={points}
                            fill={`${area.color}20`}
                            stroke={area.color}
                            strokeWidth="2"
                            className="pointer-events-auto cursor-pointer"
                            onClick={() => setSelectedAreaId(area.id)}
                          />
                          <text
                            x={area.points[0].x}
                            y={area.points[0].y - 5}
                            fill="white"
                            fontSize="12"
                            style={{
                              transform: `scale(${1 / zoom})`,
                              transformOrigin: `${area.points[0].x}px ${area.points[0].y}px`,
                            }}
                          >
                            <tspan
                              x={area.points[0].x}
                              dy="0"
                              style={{
                                fill: area.color,
                                fontWeight: "bold",
                              }}
                            >
                              {area.label}
                            </tspan>
                          </text>
                        </svg>
                      );
                    }
                    return null;
                  })}

                  {/* Drawing Preview */}
                  {isDrawing && currentPoints.length > 0 && (
                    <>
                      {drawingTool === "rectangle" && currentPoints.length === 1 && (
                        <div className="absolute border-2 border-dashed border-[#7FE0EE] pointer-events-none" />
                      )}
                      {drawingTool === "circle" && currentPoints.length === 1 && (
                        <div className="absolute rounded-full border-2 border-dashed border-[#7FE0EE] pointer-events-none" />
                      )}
                      {drawingTool === "polygon" && (
                        <>
                          {currentPoints.map((point, idx) => (
                            <div
                              key={idx}
                              className="absolute w-2 h-2 bg-[#7FE0EE] rounded-full"
                              style={{
                                left: `${point.x - 4}px`,
                                top: `${point.y - 4}px`,
                                transform: `scale(${zoom})`,
                                transformOrigin: "center",
                              }}
                            />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Area List */}
          {imageUrl && (
            <div className="w-80 bg-[#424F42] overflow-y-auto border border-t-0 border-l-0 border-[rgba(101,104,89,0.3)] flex flex-col">
              <div className="p-4 border-b border-[rgba(101,104,89,0.3)]">
                <h4 className="text-white font-semibold mb-2">Measured Areas</h4>
                <p className="text-[#E8F0A5] text-xs">Click to select · Del to delete</p>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {areas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#E8F0A5] text-sm">No areas yet</p>
                    <p className="text-[#E8F0A5] text-xs mt-2">Press R, C, or P to start</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {areas.map((area, index) => (
                      <div
                        key={area.id}
                        className={`rounded-xl p-3 transition-all cursor-pointer ${
                          selectedAreaId === area.id
                            ? "bg-[#656859] ring-2 ring-[#72C16B]"
                            : "bg-[#63786E] hover:bg-[#656859]"
                        }`}
                        onClick={() => setSelectedAreaId(area.id)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAreaVisibility(area.id);
                            }}
                            className="p-1 hover:bg-[#424F42] rounded transition-all"
                          >
                            {area.visible !== false ? (
                              <Eye className="w-4 h-4 text-[#72C16B]" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            )}
                          </button>

                          <div
                            className="w-4 h-4 rounded border border-white"
                            style={{ backgroundColor: area.color }}
                          />

                          {editingLabelId === area.id ? (
                            <input
                              type="text"
                              value={area.label || ""}
                              onChange={(e) => updateAreaLabel(area.id, e.target.value)}
                              onBlur={() => setEditingLabelId(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") setEditingLabelId(null);
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
                                setEditingLabelId(area.id);
                              }}
                            >
                              {area.label}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteArea(area.id);
                            }}
                            className="p-1 hover:bg-red-500 rounded transition-all"
                            title="Delete (Del)"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>

                        <div className="text-[#E8F0A5] text-xs space-y-1 ml-7">
                          <div>Type: {area.type}</div>
                          <div>Area: {Math.round(area.area).toLocaleString()} px²</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {areas.length > 0 && (
                <div className="p-3 border-t border-[rgba(101,104,89,0.3)] bg-[#63786E]">
                  <div className="text-white text-sm font-semibold">
                    Total: {Math.round(areas.reduce((sum, a) => sum + a.area, 0)).toLocaleString()} px²
                  </div>
                </div>
              )}

              {/* Keyboard Shortcuts Help */}
              <div className="p-3 border-t border-[rgba(101,104,89,0.3)] bg-[#63786E]">
                <h5 className="text-white text-xs font-semibold mb-2">Shortcuts</h5>
                <div className="text-[#E8F0A5] text-xs space-y-1">
                  <div><kbd className="bg-[#424F42] px-1 rounded">R</kbd> Rectangle</div>
                  <div><kbd className="bg-[#424F42] px-1 rounded">C</kbd> Circle</div>
                  <div><kbd className="bg-[#424F42] px-1 rounded">P</kbd> Polygon</div>
                  <div><kbd className="bg-[#424F42] px-1 rounded">Enter</kbd> Finish Polygon</div>
                  <div><kbd className="bg-[#424F42] px-1 rounded">Del</kbd> Delete</div>
                  <div><kbd className="bg-[#424F42] px-1 rounded">Esc</kbd> Cancel</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        {imageUrl && (
          <div className="bg-[#424F42] rounded-b-2xl p-2 border border-t-0 border-[rgba(101,104,89,0.3)] flex items-center justify-between text-[#E8F0A5] text-xs">
            <div className="flex gap-6">
              <span>X: {mousePos.x}, Y: {mousePos.y}</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <span>Areas: {areas.length}</span>
            </div>
            <div>
              {drawingTool && `Drawing ${drawingTool}...`}
              {selectedAreaId && !drawingTool && `Selected: ${areas.find(a => a.id === selectedAreaId)?.label || "Area"}`}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}