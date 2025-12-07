import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import LayerPanel, { Layer } from "./LayerPanel";
import { Pencil, Eraser, Circle, Square, Minus, Undo, Redo, Trash2, Save, Download, Home, Crown, Lock, Layers as LayersIcon } from "lucide-react";

type Tool = "pencil" | "eraser" | "line" | "rectangle" | "circle";

interface BrushType {
	id: string;
	name: string;
	isPremium: boolean;
	softness: number;
	opacity: number;
}

interface DrawingState {
	layers: Layer[];
}

const brushes: BrushType[] = [
	{ id: "dip-pen-soft", name: "Dip Pen (Soft)", isPremium: false, softness: 0.8, opacity: 1 },
	{ id: "dip-pen-hard", name: "Dip Pen (Hard)", isPremium: false, softness: 0.3, opacity: 1 },
	{ id: "dip-pen-bleed", name: "Dip Pen (Bleed)", isPremium: true, softness: 0.9, opacity: 0.8 },
	{ id: "felt-tip-soft", name: "Felt Tip Pen (Soft)", isPremium: true, softness: 0.7, opacity: 0.95 },
	{ id: "felt-tip-hard", name: "Felt Tip Pen (Hard)", isPremium: true, softness: 0.4, opacity: 1 },
	{ id: "marker", name: "Marker", isPremium: true, softness: 0.6, opacity: 0.7 },
	{ id: "watercolor", name: "Watercolor", isPremium: true, softness: 1, opacity: 0.5 },
	{ id: "airbrush", name: "Airbrush", isPremium: true, softness: 1, opacity: 0.3 },
];

// const CANVAS_WIDTH = 1200;
// const CANVAS_HEIGHT = 800;

export default function DrawingCanvas() {
	const tempCanvasRef = useRef<HTMLCanvasElement>(null);
	const layerCanvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

	const { user } = useAuth();
	const { id } = useParams();
	const navigate = useNavigate();

	const [canvasWidth, setCanvasWidth] = useState<number | null>(null);
	const [canvasHeight, setCanvasHeight] = useState<number | null>(null);

	const [tool, setTool] = useState<Tool>("pencil");
	const [selectedBrush, setSelectedBrush] = useState(brushes[0]);
	const [color, setColor] = useState("#000000");
	const [brushSize, setBrushSize] = useState(20);
	const [brushOpacity, setBrushOpacity] = useState(100);
	const [isDrawing, setIsDrawing] = useState(false);

	const [history, setHistory] = useState<DrawingState[]>([]);
	const [historyStep, setHistoryStep] = useState(-1);

	const [startPos, setStartPos] = useState({ x: 0, y: 0 });
	const [drawingTitle, setDrawingTitle] = useState("Untitled Drawing");
	const [showLayerPanel, setShowLayerPanel] = useState(true);

	const [layers, setLayers] = useState<Layer[]>([]);
	const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

	useEffect(() => {
		if (layers.length > 0) return;

		if (!id) {
			const initialId = crypto.randomUUID();
			const initialLayer: Layer = {
				id: initialId,
				name: "Layer 1",
				visible: true,
				opacity: 100,
				blendMode: "normal",
				locked: false,
				imageData: null,
			};
			setLayers([initialLayer]);
			setActiveLayerId(initialId);

			setHistory([{ layers: [initialLayer] }]);
			setHistoryStep(0);
		}
	}, []);

	useEffect(() => {
		if (!id) return;

		const drawings = JSON.parse(localStorage.getItem("drawings") || "[]");
		const drawing = drawings.find((d: any) => d.id === id);

		if (drawing) {
			setDrawingTitle(drawing.title);

			if (drawing.layersData) {
				setLayers(drawing.layersData);
				if (drawing.layersData.length > 0) {
					setActiveLayerId(drawing.layersData[0].id);
				}
				setHistory([{ layers: drawing.layersData }]);
				setHistoryStep(0);
			}
		}
	}, [id]);

	useEffect(() => {
		layers.forEach((layer) => {
			const canvas = layerCanvasRefs.current[layer.id];
			if (!canvas) return;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			if (layer.imageData) {
				const img = new Image();
				img.onload = () => {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(img, 0, 0);
				};
				img.src = layer.imageData;
			} else {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
		});
	}, [layers]);

	useEffect(() => {
		const size = JSON.parse(localStorage.getItem("newCanvasSettings") || "null");
		if (!size) return;

		setCanvasWidth(size.width);
		setCanvasHeight(size.height);
	});

	const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = tempCanvasRef.current;
		if (!canvas) return { x: 0, y: 0 };

		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY,
		};
	};

	const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const activeLayer = layers.find((l) => l.id === activeLayerId);
		if (!activeLayer) {
			alert("Please select a layer to draw on.");
			return;
		}
		if (activeLayer.locked || !activeLayer.visible) {
			alert("Cannot draw on a locked or hidden layer.");
			return;
		}

		const pos = getMousePos(e);
		setStartPos(pos);
		setIsDrawing(true);

		const ctx = tempCanvasRef.current?.getContext("2d");
		if (!ctx) return;

		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		if (tool === "eraser") {
			ctx.strokeStyle = "#000000";
			ctx.globalAlpha = 1;
			ctx.lineWidth = brushSize;
			ctx.globalCompositeOperation = "source-over";
		} else {
			ctx.strokeStyle = color;
			ctx.globalAlpha = (brushOpacity / 100) * selectedBrush.opacity;
			ctx.lineWidth = brushSize;
			ctx.globalCompositeOperation = "source-over";
		}

		ctx.beginPath();
		ctx.moveTo(pos.x, pos.y);
	};

	const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return;
		const ctx = tempCanvasRef.current?.getContext("2d");
		if (!ctx) return;

		const pos = getMousePos(e);

		if (tool === "pencil" || tool === "eraser") {
			ctx.lineTo(pos.x, pos.y);
			ctx.stroke();
		}
	};

	const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return;
		setIsDrawing(false);

		const tempCanvas = tempCanvasRef.current;
		const tempCtx = tempCanvas?.getContext("2d");
		if (!tempCanvas || !tempCtx) return;

		const pos = getMousePos(e);

		if (tool === "line" || tool === "rectangle" || tool === "circle") {
			tempCtx.strokeStyle = color;
			tempCtx.lineWidth = brushSize;
			tempCtx.globalAlpha = brushOpacity / 100;

			if (tool === "line") {
				tempCtx.beginPath();
				tempCtx.moveTo(startPos.x, startPos.y);
				tempCtx.lineTo(pos.x, pos.y);
				tempCtx.stroke();
			} else if (tool === "rectangle") {
				tempCtx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
			} else if (tool === "circle") {
				const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
				tempCtx.beginPath();
				tempCtx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
				tempCtx.stroke();
			}
		}

		if (activeLayerId) {
			const activeCanvas = layerCanvasRefs.current[activeLayerId];
			const activeCtx = activeCanvas?.getContext("2d");

			if (activeCanvas && activeCtx) {
				activeCtx.save();

				if (tool === "eraser") {
					activeCtx.globalCompositeOperation = "destination-out";
					activeCtx.globalAlpha = 1;
				} else {
					activeCtx.globalCompositeOperation = "source-over";
					activeCtx.globalAlpha = 1;
				}

				activeCtx.drawImage(tempCanvas, 0, 0);
				activeCtx.restore();

				const newImageData = activeCanvas.toDataURL();

				const newLayers = layers.map((l) => (l.id === activeLayerId ? { ...l, imageData: newImageData } : l));

				setLayers(newLayers);

				const newHistory = history.slice(0, historyStep + 1);
				newHistory.push({ layers: JSON.parse(JSON.stringify(newLayers)) });
				setHistory(newHistory);
				setHistoryStep(newHistory.length - 1);
			}
		}

		tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
	};

	const handleAddLayer = () => {
		const newLayerId = crypto.randomUUID();
		const newLayer: Layer = {
			id: newLayerId,
			name: `Layer ${layers.length + 1}`,
			visible: true,
			opacity: 100,
			blendMode: "normal",
			locked: false,
			imageData: null,
		};

		const newLayers = [newLayer, ...layers];
		setLayers(newLayers);
		setActiveLayerId(newLayerId);
		addToHistory(newLayers);
	};

	const handleDeleteLayer = (layerIdToDelete: string) => {
		const newLayers = layers.filter((l) => l.id !== layerIdToDelete);
		let newActiveId = activeLayerId;
		if (activeLayerId === layerIdToDelete) {
			newActiveId = newLayers.length > 0 ? newLayers[0].id : null;
		}
		setLayers(newLayers);
		setActiveLayerId(newActiveId);
		addToHistory(newLayers);
	};

	const addToHistory = (currentLayers: Layer[]) => {
		const newHistory = history.slice(0, historyStep + 1);
		newHistory.push({ layers: JSON.parse(JSON.stringify(currentLayers)) });
		setHistory(newHistory);
		setHistoryStep(newHistory.length - 1);
	};

	const undo = () => {
		if (historyStep > 0) {
			const newStep = historyStep - 1;
			const previousState = history[newStep];
			setLayers(previousState.layers);
			setHistoryStep(newStep);
		}
	};

	const redo = () => {
		if (historyStep < history.length - 1) {
			const newStep = historyStep + 1;
			const nextState = history[newStep];
			setLayers(nextState.layers);
			setHistoryStep(newStep);
		}
	};

	const clearCanvas = () => {
		if (!activeLayerId || !confirm("Are you sure you want to clear this layer?")) return;

		const activeCanvas = layerCanvasRefs.current[activeLayerId];
		const ctx = activeCanvas?.getContext("2d");
		if (activeCanvas && ctx) {
			ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);

			const newLayers = layers.map((l) => (l.id === activeLayerId ? { ...l, imageData: activeCanvas.toDataURL() } : l));
			setLayers(newLayers);
			addToHistory(newLayers);
		}
	};

	const flattenCanvas = (): string => {
		const tempC = document.createElement("canvas");
		tempC.width = canvasWidth; //CANVAS_WIDTH;
		tempC.height = canvasHeight; //CANVAS_HEIGHT;
		const ctx = tempC.getContext("2d");
		if (!ctx) return "";

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, tempC.width, tempC.height);

		[...layers].reverse().forEach((layer) => {
			if (!layer.visible) return;

			const layerCanvas = layerCanvasRefs.current[layer.id];
			if (layerCanvas) {
				ctx.save();
				ctx.globalAlpha = layer.opacity / 100;
				ctx.globalCompositeOperation = layer.blendMode;
				ctx.drawImage(layerCanvas, 0, 0);
				ctx.restore();
			}
		});

		return tempC.toDataURL();
	};

	const saveDrawing = () => {
		if (!user) return;
		const thumbnail = flattenCanvas();
		const drawings = JSON.parse(localStorage.getItem("drawings") || "[]");

		if (id) {
			const index = drawings.findIndex((d: any) => d.id === id);
			if (index !== -1) {
				drawings[index] = {
					...drawings[index],
					title: drawingTitle,
					thumbnail,
					layersData: layers,
				};
			}
		} else {
			const newDrawing = {
				id: Date.now().toString(),
				title: drawingTitle,
				thumbnail,
				createdAt: new Date().toISOString(),
				userId: user.id,
				layersData: layers,
			};
			drawings.push(newDrawing);
		}

		localStorage.setItem("drawings", JSON.stringify(drawings));
		alert("Drawing saved successfully!");
	};

	const downloadDrawing = () => {
		const dataUrl = flattenCanvas();
		const link = document.createElement("a");
		link.download = `${drawingTitle}.png`;
		link.href = dataUrl;
		link.click();
	};

	const handleBrushSelect = (brush: BrushType) => {
		if (brush.isPremium && !user?.premium_expiry) {
			if (confirm("This brush requires Premium. Would you like to upgrade?")) {
				navigate("/premium");
			}
			return;
		}
		setSelectedBrush(brush);
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
			undo();
		} else if (e.key === "y" && (e.metaKey || e.ctrlKey)) {
			redo();
		} else if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
			saveDrawing();
		}
	};

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	});

	return (
		<div className="h-screen flex flex-col bg-gray-100">
			<nav className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4 z-50 relative">
				<div className="flex items-center gap-4">
					<Link to="/dashboard">
						<Button variant="ghost" size="sm">
							<Home className="w-4 h-4 mr-2" />
							Dashboard
						</Button>
					</Link>
					<div className="w-px h-6 bg-gray-300" />
					<Input type="text" value={drawingTitle} onChange={(e) => setDrawingTitle(e.target.value)} className="max-w-xs" />
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => setShowLayerPanel(!showLayerPanel)}>
						<LayersIcon className="w-4 h-4 mr-2" />
						Layers
					</Button>
					<Button variant="outline" size="sm" onClick={saveDrawing}>
						<Save className="w-4 h-4 mr-2" />
						Save
					</Button>
					<Button variant="outline" size="sm" onClick={downloadDrawing}>
						<Download className="w-4 h-4 mr-2" />
						Download
					</Button>
				</div>
			</nav>

			<div className="flex-1 flex overflow-hidden">
				<div className="bg-white border-r w-80 flex flex-col z-40 relative overflow-y-auto">
					<Tabs defaultValue="tools" className="flex-1 flex flex-col">
						<div className="px-4 m-4">
							<TabsList className="flex w-full">
								<TabsTrigger value="tools">Tools</TabsTrigger>
								<TabsTrigger value="brushes">Brushes</TabsTrigger>
							</TabsList>
						</div>

						<ScrollArea className="flex-1">
							<TabsContent value="tools" className="p-4 space-y-6 mt-0">
								<div>
									<Label className="mb-3 block">Drawing Tools</Label>
									<div className="grid grid-cols-2 gap-2">
										<Button
											variant={tool === "pencil" ? "default" : "outline"}
											size="sm"
											onClick={() => setTool("pencil")}
											className="justify-start">
											<Pencil className="w-4 h-4 mr-2" />
											Pencil
										</Button>
										<Button
											variant={tool === "eraser" ? "default" : "outline"}
											size="sm"
											onClick={() => setTool("eraser")}
											className="justify-start">
											<Eraser className="w-4 h-4 mr-2" />
											Eraser
										</Button>
									</div>
								</div>

								<div>
									<Label className="mb-3 block">Shapes</Label>
									<div className="grid grid-cols-1 gap-2">
										<Button
											variant={tool === "line" ? "default" : "outline"}
											size="sm"
											onClick={() => setTool("line")}
											className="justify-start">
											<Minus className="w-4 h-4 mr-2" /> Line
										</Button>
										<Button
											variant={tool === "rectangle" ? "default" : "outline"}
											size="sm"
											onClick={() => setTool("rectangle")}
											className="justify-start">
											<Square className="w-4 h-4 mr-2" /> Rectangle
										</Button>
										<Button
											variant={tool === "circle" ? "default" : "outline"}
											size="sm"
											onClick={() => setTool("circle")}
											className="justify-start">
											<Circle className="w-4 h-4 mr-2" /> Circle
										</Button>
									</div>
								</div>

								<div>
									<Label htmlFor="color" className="mb-3 block">
										Color
									</Label>
									<div className="flex gap-2">
										<Input
											id="color"
											type="color"
											value={color}
											onChange={(e) => setColor(e.target.value)}
											className="h-10 cursor-pointer"
										/>
										<Input
											id="colorText"
											type="text"
											value={color}
											onChange={(e) => setColor(e.target.value)}
											className="h-10 cursor-pointer"
										/>
									</div>
								</div>

								<div>
									<div className="flex justify-between mb-2">
										<Label>Thickness: {brushSize.toFixed(1)}px</Label>
									</div>
									<Input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
								</div>

								<div>
									<div className="flex justify-between mb-2">
										<Label>Opacity: {brushOpacity}%</Label>
									</div>
									<Input
										type="range"
										min="1"
										max="100"
										value={brushOpacity}
										onChange={(e) => setBrushOpacity(Number(e.target.value))}
									/>
								</div>

								<div className="border-t pt-4">
									<Label className="mb-3 block">Controls</Label>
									<div className="flex flex-col gap-2">
										<Button variant="outline" size="sm" onClick={undo} disabled={historyStep <= 0} className="justify-start">
											<Undo className="w-4 h-4 mr-2" /> Undo
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={redo}
											disabled={historyStep >= history.length - 1}
											className="justify-start">
											<Redo className="w-4 h-4 mr-2" /> Redo
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={clearCanvas}
											className="justify-start text-red-600 hover:bg-red-50">
											<Trash2 className="w-4 h-4 mr-2" /> Clear Layer
										</Button>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="brushes" className="p-4 space-y-4 mt-0">
								<div className="space-y-2">
									{brushes.map((brush) => (
										<button
											key={brush.id}
											onClick={() => handleBrushSelect(brush)}
											className={`w-full p-3 border rounded-lg hover:bg-gray-50 text-left ${
												selectedBrush.id === brush.id ? "border-purple-500 bg-purple-50" : ""
											}`}>
											<div className="flex items-center justify-between">
												<span className="text-sm">{brush.name}</span>
												{brush.isPremium && (
													<Badge variant="secondary">
														<Lock className="w-3 h-3" />
													</Badge>
												)}
											</div>
										</button>
									))}
								</div>
							</TabsContent>
						</ScrollArea>
					</Tabs>
				</div>

				<div className="flex-1 p-4 md:p-8 overflow-auto bg-gray-200 flex items-center justify-center">
					<div
						className="relative bg-white shadow-2xl max-w-full"
						style={{
							// 1. Allow the container to be responsive (100% width)
							width: "100%",
							// 2. Cap the size at the actual canvas resolution so it doesn't get pixelated
							// maxWidth: `${CANVAS_WIDTH}px`,
							maxWidth: `${canvasWidth}px`,
							// 3. Force the aspect ratio so the height calculates automatically based on width
							// aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
							aspectRatio: `${canvasWidth}/${canvasHeight}`,
						}}>
						<div className="absolute inset-0 bg-white pointer-events-none" />

						{layers.map((layer, index) => {
							const zIndex = layers.length - index;

							return (
								<canvas
									key={layer.id}
									ref={(el) => (layerCanvasRefs.current[layer.id] = el)}
									// Internal Resolution (High Quality)
									width={canvasWidth}
									height={canvasHeight}
									// width={CANVAS_WIDTH}
									// height={CANVAS_HEIGHT}
									// CSS Size (Responsive): w-full h-full fills the parent div
									className="absolute top-0 left-0 pointer-events-none w-full h-full"
									style={{
										zIndex: zIndex,
										opacity: layer.opacity / 100,
										display: layer.visible ? "block" : "none",
										mixBlendMode: layer.blendMode,
									}}
								/>
							);
						})}

						<canvas
							ref={tempCanvasRef}
							width={canvasWidth}
							height={canvasHeight}
							// width={CANVAS_WIDTH}
							// height={CANVAS_HEIGHT}
							// CSS Size (Responsive) + touch-none to prevent scrolling on mobile while drawing
							className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
							style={{ zIndex: 9999 }}
							onMouseDown={startDrawing}
							onMouseMove={draw}
							onMouseUp={stopDrawing}
							onMouseLeave={stopDrawing}
							// Add touch events for mobile support
							onTouchStart={startDrawing}
							onTouchMove={draw}
							onTouchEnd={stopDrawing}
						/>
					</div>
				</div>

				{showLayerPanel && (
					<LayerPanel
						layers={layers}
						activeLayerId={activeLayerId}
						onLayersChange={(newLayers) => {
							setLayers(newLayers);

							addToHistory(newLayers);
						}}
						onActiveLayerChange={(layerId) => {
							setActiveLayerId(layerId);
						}}
						onAddLayer={handleAddLayer}
						onDeleteLayer={handleDeleteLayer}
					/>
				)}
			</div>
		</div>
	);
}
