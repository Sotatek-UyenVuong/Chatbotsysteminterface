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
} from "lucide-react";

interface Point {
  x: number; // percentage
  y: number; // percentage
}

interface Area {
  id: string;
  type: "rectangle" | "circle" | "polygon";
  points: Point[];
  area: number; // in pixels or units
  label?: string;
  color: string;
}

interface AreaCalculatorProps {
  initialImageUrl?: string;
  onSaveAreas?: (imageUrl: string, areas: Area[]) => void;
  onClose?: () => void;
}

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colors = [
    "#72C16B",
    "#7FE0EE",
    "#E8F0A5",
    "#7A9150",
    "#FF6B6B",
    "#4ECDC4",
  ];

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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingTool || !imageRef.current || isPanning) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const point: Point = { x, y };

    if (drawingTool === "rectangle") {
      if (currentPoints.length === 0) {
        setCurrentPoints([point]);
        setIsDrawing(true);
      } else {
        const area = calculateRectangleArea(currentPoints[0], point);
        addArea("rectangle", [currentPoints[0], point], area);
        setCurrentPoints([]);
        setIsDrawing(false);
      }
    } else if (drawingTool === "circle") {
      if (currentPoints.length === 0) {
        setCurrentPoints([point]);
        setIsDrawing(true);
      } else {
        const area = calculateCircleArea(currentPoints[0], point);
        addArea("circle", [currentPoints[0], point], area);
        setCurrentPoints([]);
        setIsDrawing(false);
      }
    } else if (drawingTool === "polygon") {
      setCurrentPoints((prev) => [...prev, point]);
      setIsDrawing(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isDrawing && currentPoints.length > 0 && canvasRef.current) {
      // Draw preview
      drawPreview({ x, y });
    }
  };

  const finishPolygon = () => {
    if (currentPoints.length >= 3) {
      const area = calculatePolygonArea(currentPoints);
      addArea("polygon", currentPoints, area);
    }
    setCurrentPoints([]);
    setIsDrawing(false);
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
      color: colors[areas.length % colors.length],
    };
    setAreas((prev) => [...prev, newArea]);
  };

  const deleteArea = (areaId: string) => {
    setAreas((prev) => prev.filter((a) => a.id !== areaId));
    if (selectedAreaId === areaId) {
      setSelectedAreaId(null);
    }
  };

  const calculateRectangleArea = (p1: Point, p2: Point): number => {
    if (!imageRef.current) return 0;
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);
    const imgWidth = imageRef.current.naturalWidth;
    const imgHeight = imageRef.current.naturalHeight;
    return ((width / 100) * imgWidth * (height / 100) * imgHeight);
  };

  const calculateCircleArea = (center: Point, edge: Point): number => {
    if (!imageRef.current) return 0;
    const dx = edge.x - center.x;
    const dy = edge.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const imgWidth = imageRef.current.naturalWidth;
    const avgDimension = (imgWidth + imageRef.current.naturalHeight) / 2;
    const radiusPixels = (radius / 100) * avgDimension;
    return Math.PI * radiusPixels * radiusPixels;
  };

  const calculatePolygonArea = (points: Point[]): number => {
    if (!imageRef.current || points.length < 3) return 0;
    const imgWidth = imageRef.current.naturalWidth;
    const imgHeight = imageRef.current.naturalHeight;

    // Convert to pixel coordinates
    const pixelPoints = points.map((p) => ({
      x: (p.x / 100) * imgWidth,
      y: (p.y / 100) * imgHeight,
    }));

    // Shoelace formula
    let area = 0;
    for (let i = 0; i < pixelPoints.length; i++) {
      const j = (i + 1) % pixelPoints.length;
      area += pixelPoints[i].x * pixelPoints[j].y;
      area -= pixelPoints[j].x * pixelPoints[i].y;
    }
    return Math.abs(area / 2);
  };

  const drawPreview = (currentMouse: Point) => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Convert percentage to canvas pixels
    const toCanvasCoords = (p: Point) => ({
      x: (p.x / 100) * canvas.width,
      y: (p.y / 100) * canvas.height,
    });

    ctx.strokeStyle = "#7FE0EE";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(127, 224, 238, 0.2)";

    if (drawingTool === "rectangle" && currentPoints.length === 1) {
      const start = toCanvasCoords(currentPoints[0]);
      const end = toCanvasCoords(currentMouse);
      ctx.fillRect(
        start.x,
        start.y,
        end.x - start.x,
        end.y - start.y
      );
      ctx.strokeRect(
        start.x,
        start.y,
        end.x - start.x,
        end.y - start.y
      );
    } else if (drawingTool === "circle" && currentPoints.length === 1) {
      const center = toCanvasCoords(currentPoints[0]);
      const edge = toCanvasCoords(currentMouse);
      const radius = Math.sqrt(
        Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
      );
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (drawingTool === "polygon" && currentPoints.length > 0) {
      ctx.beginPath();
      const first = toCanvasCoords(currentPoints[0]);
      ctx.moveTo(first.x, first.y);
      currentPoints.slice(1).forEach((p) => {
        const coords = toCanvasCoords(p);
        ctx.lineTo(coords.x, coords.y);
      });
      const current = toCanvasCoords(currentMouse);
      ctx.lineTo(current.x, current.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw points
      currentPoints.forEach((p) => {
        const coords = toCanvasCoords(p);
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "#7FE0EE";
        ctx.fill();
      });
    }
  };

  const drawAreas = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const toCanvasCoords = (p: Point) => ({
      x: (p.x / 100) * canvas.width,
      y: (p.y / 100) * canvas.height,
    });

    areas.forEach((area) => {
      ctx.strokeStyle = area.color;
      ctx.lineWidth = selectedAreaId === area.id ? 3 : 2;
      ctx.fillStyle = `${area.color}40`;

      if (area.type === "rectangle" && area.points.length === 2) {
        const start = toCanvasCoords(area.points[0]);
        const end = toCanvasCoords(area.points[1]);
        ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (area.type === "circle" && area.points.length === 2) {
        const center = toCanvasCoords(area.points[0]);
        const edge = toCanvasCoords(area.points[1]);
        const radius = Math.sqrt(
          Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
        );
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (area.type === "polygon" && area.points.length >= 3) {
        ctx.beginPath();
        const first = toCanvasCoords(area.points[0]);
        ctx.moveTo(first.x, first.y);
        area.points.slice(1).forEach((p) => {
          const coords = toCanvasCoords(p);
          ctx.lineTo(coords.x, coords.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    if (imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      canvas.width = img.offsetWidth;
      canvas.height = img.offsetHeight;
      drawAreas();
    }
  }, [areas, selectedAreaId, zoom]);

  const handleSave = () => {
    if (onSaveAreas && imageUrl) {
      onSaveAreas(imageUrl, areas);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full h-full max-w-7xl max-h-screen p-4 flex flex-col">
        {/* Header */}
        <div className="bg-[#424F42] rounded-t-2xl p-4 flex items-center justify-between border border-[rgba(101,104,89,0.3)]">
          <div className="flex items-center gap-4">
            <h3 className="text-white text-lg">Area Calculator</h3>
            {areas.length > 0 && (
              <span className="text-[#E8F0A5] text-sm">
                {areas.length} area{areas.length > 1 ? "s" : ""} measured
              </span>
            )}
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
            {!imageUrl && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gradient-to-r from-[#72C16B] to-[#7FE0EE] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>
            )}

            {imageUrl && (
              <>
                <button
                  onClick={() => setDrawingTool(drawingTool === "rectangle" ? null : "rectangle")}
                  className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    drawingTool === "rectangle"
                      ? "bg-[#72C16B] text-white"
                      : "bg-[#656859] text-[#E8F0A5] hover:bg-[#72C16B]"
                  }`}
                  title="Rectangle"
                >
                  <Square className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDrawingTool(drawingTool === "circle" ? null : "circle")}
                  className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    drawingTool === "circle"
                      ? "bg-[#72C16B] text-white"
                      : "bg-[#656859] text-[#E8F0A5] hover:bg-[#72C16B]"
                  }`}
                  title="Circle"
                >
                  <Circle className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDrawingTool(drawingTool === "polygon" ? null : "polygon")}
                  className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    drawingTool === "polygon"
                      ? "bg-[#72C16B] text-white"
                      : "bg-[#656859] text-[#E8F0A5] hover:bg-[#72C16B]"
                  }`}
                  title="Polygon"
                >
                  <Pen className="w-4 h-4" />
                </button>

                {drawingTool === "polygon" && currentPoints.length >= 3 && (
                  <button
                    onClick={finishPolygon}
                    className="px-3 py-2 bg-[#72C16B] text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm"
                  >
                    Finish Polygon
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
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="p-2 hover:bg-[#656859] rounded-xl transition-all duration-300"
                  title="Reset view"
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
            >
              <Save className="w-4 h-4" />
              Save Areas
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-3 overflow-hidden">
          {/* Image Viewer */}
          <div className="flex-1 bg-[#63786E] rounded-bl-2xl overflow-hidden relative border border-t-0 border-[rgba(101,104,89,0.3)]">
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
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                  cursor: drawingTool
                    ? "crosshair"
                    : isPanning
                      ? "grabbing"
                      : "grab",
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div className="relative inline-block">
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Measurement"
                    className="max-w-none"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "center",
                    }}
                    draggable={false}
                    onLoad={drawAreas}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                    }}
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMouseMove}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Areas List */}
          {imageUrl && areas.length > 0 && (
            <div className="w-80 bg-[#424F42] rounded-br-2xl border border-t-0 border-l-0 border-[rgba(101,104,89,0.3)] overflow-y-auto p-4">
              <h4 className="text-white mb-3">Measured Areas</h4>
              <div className="space-y-2">
                {areas.map((area, index) => (
                  <div
                    key={area.id}
                    className={`bg-[#656859] rounded-xl p-3 cursor-pointer transition-all ${
                      selectedAreaId === area.id
                        ? "ring-2 ring-[#72C16B]"
                        : ""
                    }`}
                    onClick={() => setSelectedAreaId(area.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: area.color }}
                          />
                          <span className="text-white text-sm">
                            Area {index + 1} ({area.type})
                          </span>
                        </div>
                        <p className="text-[#E8F0A5] text-sm">
                          {Math.round(area.area).toLocaleString()} px²
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteArea(area.id);
                        }}
                        className="p-1 hover:bg-red-500 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[rgba(101,104,89,0.3)]">
                <div className="text-[#E8F0A5] text-sm">
                  <p className="mb-1">
                    <strong className="text-white">Total Area:</strong>{" "}
                    {Math.round(
                      areas.reduce((sum, a) => sum + a.area, 0)
                    ).toLocaleString()}{" "}
                    px²
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {imageUrl && (
          <div className="mt-2 bg-[#424F42] rounded-lg p-3 border border-[rgba(101,104,89,0.3)]">
            <div className="text-[#E8F0A5] text-sm flex gap-6">
              <span>🖱️ Scroll to zoom</span>
              <span>⌨️ Shift + Drag to pan</span>
              {drawingTool === "polygon" && (
                <span>👆 Click to add points, then "Finish Polygon"</span>
              )}
              {(drawingTool === "rectangle" || drawingTool === "circle") && (
                <span>👆 Click start point, then click end point</span>
              )}
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
