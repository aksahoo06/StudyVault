import React, { useRef, useEffect, useState, useCallback } from "react";

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

const COLORS = ["#000000", "#EF4444", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];
const LINE_WIDTHS = [2, 4, 8, 12, 16];

function Whiteboard({ classroomId, socket, isTeacher, initialState = [] }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);

  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  // Helper to get normalized coordinates (0 to CANVAS_WIDTH / CANVAS_HEIGHT)
  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Helper function to draw a line segment on canvas
  const drawSegment = useCallback((stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { prevPoint, currentPoint, color: strokeColor, width, isEraser: strokeIsEraser } = stroke;

    ctx.save();
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;

    if (strokeIsEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = strokeColor;
    }

    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    ctx.restore();
  }, []);

  // Clear canvas helper
  const clearCanvasLocally = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Load initial whiteboard state strokes
  useEffect(() => {
    if (initialState && initialState.length > 0) {
      clearCanvasLocally();
      initialState.forEach((stroke) => drawSegment(stroke));
    }
  }, [initialState, clearCanvasLocally, drawSegment]);

  // Socket event listeners for real-time sync
  useEffect(() => {
    if (!socket) return;

    const handleDrawLine = (stroke) => {
      drawSegment(stroke);
    };

    const handleClearCanvas = () => {
      clearCanvasLocally();
    };

    socket.on("draw-line", handleDrawLine);
    socket.on("clear-canvas", handleClearCanvas);

    return () => {
      socket.off("draw-line", handleDrawLine);
      socket.off("clear-canvas", handleClearCanvas);
    };
  }, [socket, drawSegment, clearCanvasLocally]);

  // Mouse / Touch handlers for drawing
  const handleStartDrawing = (e) => {
    if (!isTeacher) return;
    isDrawingRef.current = true;
    const point = getCanvasPoint(e);
    lastPointRef.current = point;
  };

  const handleDraw = (e) => {
    if (!isTeacher || !isDrawingRef.current || !lastPointRef.current) return;
    const currentPoint = getCanvasPoint(e);
    if (!currentPoint) return;

    const stroke = {
      prevPoint: lastPointRef.current,
      currentPoint,
      color: isEraser ? "#FFFFFF" : color,
      width: lineWidth,
      isEraser,
    };

    // Render locally immediately
    drawSegment(stroke);

    // Emit socket event to server
    if (socket && classroomId) {
      socket.emit("draw-line", { classroomId, stroke });
    }

    lastPointRef.current = currentPoint;
  };

  const handleStopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  // Handle teacher clear canvas click
  const handleClearButtonClick = () => {
    if (!isTeacher) return;
    clearCanvasLocally();
    if (socket && classroomId) {
      socket.emit("clear-canvas", { classroomId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Whiteboard Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span className="font-semibold text-ink text-sm">Interactive Whiteboard</span>
        </div>

        {isTeacher ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* Tool Selector */}
            <div className="flex items-center bg-background rounded-lg p-1 border border-border">
              <button
                onClick={() => setIsEraser(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  !isEraser ? "bg-primary text-white shadow-xs" : "text-ink-muted hover:text-ink"
                }`}
              >
                Pen
              </button>
              <button
                onClick={() => setIsEraser(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  isEraser ? "bg-primary text-white shadow-xs" : "text-ink-muted hover:text-ink"
                }`}
              >
                Eraser
              </button>
            </div>

            {/* Color Palette (Disabled when eraser is active) */}
            {!isEraser && (
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${
                      color === c ? "border-slate-800 scale-110 shadow-sm" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Line Width Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-muted font-medium">Size:</span>
              <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border">
                {LINE_WIDTHS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setLineWidth(w)}
                    className={`px-2 py-0.5 text-xs font-semibold rounded transition ${
                      lineWidth === w ? "bg-surface text-primary shadow-xs border border-border" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClearButtonClick}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            View-Only Mode (Teacher is drawing)
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 bg-white cursor-crosshair overflow-hidden min-h-[350px]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleStartDrawing}
          onMouseMove={handleDraw}
          onMouseUp={handleStopDrawing}
          onMouseLeave={handleStopDrawing}
          onTouchStart={handleStartDrawing}
          onTouchMove={handleDraw}
          onTouchEnd={handleStopDrawing}
          className="w-full h-full object-contain block"
        />
      </div>
    </div>
  );
}

export default Whiteboard;
