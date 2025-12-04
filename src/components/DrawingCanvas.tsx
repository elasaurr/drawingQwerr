import { useEffect, useRef, useState } from "react";
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

export default function DrawingCanvas() {
	const mainCanvasRef = useRef<HTMLCanvasElement>(null);
	const layerCanvasRef = useRef<HTMLCanvasElement>(null);
	const { user } = useAuth();
	const { id } = useParams();
	const navigate = useNavigate();

	const [tool, setTool] = useState<Tool>("pencil");
	const [selectedBrush, setSelectedBrush] = useState(brushes[0]);
	const [color, setColor] = useState("#000000");
	const [brushSize, setBrushSize] = useState(73);
	const [brushOpacity, setBrushOpacity] = useState(100);
	const [isDrawing, setIsDrawing] = useState(false);
	const [history, setHistory] = useState<DrawingState[]>([]);
	const [historyStep, setHistoryStep] = useState(-1);
	const [startPos, setStartPos] = useState({ x: 0, y: 0 });
	const [drawingTitle, setDrawingTitle] = useState("Untitled Drawing");
	const [showLayerPanel, setShowLayerPanel] = useState(true);

	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isInitialized, setIsInitialized] = useState(false);

	const [layers, setLayers] = useState<Layer[]>([
		{
			id: "1",
			name: "Layer 1",
			visible: true,
			opacity: 100,
			blendMode: "normal",
			locked: false,
			imageData: null,
		},
	]);
	const [activeLayerId, setActiveLayerId] = useState("1");

	useEffect(() => {
		const canvas = mainCanvasRef.current;
		if (!canvas) return;

		const settings = localStorage.getItem("newCanvasSettings");
		if (settings) {
			const { width, height } = JSON.parse(settings);
			canvas.width = width;
			canvas.height = height;
			localStorage.removeItem("newCanvasSettings");
		} else {
			canvas.width = 1200;
			canvas.height = 800;
		}

		// Load existing drawing if editing
		if (id) {
			const drawings = JSON.parse(localStorage.getItem("drawings") || "[]");
			const drawing = drawings.find((d: any) => d.id === id);
			if (drawing && drawing.layersData) {
				setDrawingTitle(drawing.title);
				setLayers(drawing.layersData);
				renderAllLayers(drawing.layersData);
			} else if (drawing) {
				// Legacy drawing without layers
				setDrawingTitle(drawing.title);
				const img = new Image();
				img.onload = () => {
					const newLayers = [...layers];
					const tempCanvas = document.createElement("canvas");
					tempCanvas.width = canvas.width;
					tempCanvas.height = canvas.height;
					const tempCtx = tempCanvas.getContext("2d");
					if (tempCtx) {
						tempCtx.drawImage(img, 0, 0);
						newLayers[0].imageData = tempCanvas.toDataURL();
						setLayers(newLayers);
						renderAllLayers(newLayers);
					}
				};
				img.src = drawing.thumbnail;
			}
		}

		saveToHistory();
	}, [id]);

	const renderAllLayers = (layersToRender: Layer[] = layers) => {
		const canvas = mainCanvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Render layers from bottom to top (reverse order)
		[...layersToRender].reverse().forEach((layer) => {
			if (!layer.visible || !layer.imageData) return;

			const img = new Image();
			img.onload = () => {
				ctx.save();
				ctx.globalAlpha = layer.opacity / 100;
				ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
				ctx.drawImage(img, 0, 0);
				ctx.restore();
			};
			img.src = layer.imageData;
		});
	};

	const saveLayerData = () => {
		const layerCanvas = layerCanvasRef.current;
		if (!layerCanvas) return;

		const newLayers = layers.map((l) => {
			if (l.id === activeLayerId) {
				return { ...l, imageData: layerCanvas.toDataURL() };
			}
			return l;
		});

		setLayers(newLayers);
		renderAllLayers(newLayers);
		return newLayers;
	};

	const saveToHistory = () => {
		const newHistory = history.slice(0, historyStep + 1);
		newHistory.push({ layers: JSON.parse(JSON.stringify(layers)) });
		setHistory(newHistory);
		setHistoryStep(newHistory.length - 1);
	};

	const undo = () => {
		if (historyStep > 0) {
			const newStep = historyStep - 1;
			const previousState = history[newStep];
			setLayers(previousState.layers);
			renderAllLayers(previousState.layers);
			setHistoryStep(newStep);
		}
	};

	const redo = () => {
		if (historyStep < history.length - 1) {
			const newStep = historyStep + 1;
			const nextState = history[newStep];
			setLayers(nextState.layers);
			renderAllLayers(nextState.layers);
			setHistoryStep(newStep);
		}
	};

	const clearCanvas = () => {
		if (!confirm("Are you sure you want to clear this layer?")) return;

		const layerCanvas = layerCanvasRef.current;
		const ctx = layerCanvas?.getContext("2d");
		if (!layerCanvas || !ctx) return;

		ctx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
		saveLayerData();
		saveToHistory();
	};

	useEffect(() => {
		const layerCanvas = layerCanvasRef.current;
		const mainCanvas = mainCanvasRef.current;
		if (!layerCanvas || !mainCanvas) return;

		layerCanvas.width = mainCanvas.width;
		layerCanvas.height = mainCanvas.height;

		const ctx = layerCanvas.getContext("2d");
		if (!ctx) return;

		// Load active layer data
		const activeLayer = layers.find((l) => l.id === activeLayerId);
		if (activeLayer?.imageData) {
			const img = new Image();
			img.onload = () => {
				ctx.drawImage(img, 0, 0);
			};
			img.src = activeLayer.imageData;
		}
	}, [activeLayerId]);

	const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = layerCanvasRef.current;
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
		if (activeLayer?.locked) {
			alert("This layer is locked. Unlock it to draw.");
			return;
		}

		const pos = getMousePos(e);
		setStartPos(pos);
		setIsDrawing(true);

		const canvas = layerCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		if (tool === "pencil") {
			ctx.globalAlpha = (brushOpacity / 100) * selectedBrush.opacity;
			ctx.strokeStyle = color;
			ctx.lineWidth = brushSize / 10;
			ctx.beginPath();
			ctx.moveTo(pos.x, pos.y);
		} else if (tool === "eraser") {
			ctx.globalAlpha = 1;
			ctx.globalCompositeOperation = "destination-out";
			ctx.lineWidth = brushSize / 5;
			ctx.beginPath();
			ctx.moveTo(pos.x, pos.y);
		}
	};

	const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return;

		const canvas = layerCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const pos = getMousePos(e);

		if (tool === "pencil" || tool === "eraser") {
			ctx.lineTo(pos.x, pos.y);
			ctx.stroke();
		}

		// Update preview
		renderAllLayers();
	};

	const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return;

		const canvas = layerCanvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		const pos = getMousePos(e);

		ctx.globalAlpha = brushOpacity / 100;
		ctx.globalCompositeOperation = "source-over";

		if (tool === "line") {
			ctx.strokeStyle = color;
			ctx.lineWidth = brushSize / 10;
			ctx.beginPath();
			ctx.moveTo(startPos.x, startPos.y);
			ctx.lineTo(pos.x, pos.y);
			ctx.stroke();
		} else if (tool === "rectangle") {
			ctx.strokeStyle = color;
			ctx.lineWidth = brushSize / 10;
			ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
		} else if (tool === "circle") {
			ctx.strokeStyle = color;
			ctx.lineWidth = brushSize / 10;
			const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
			ctx.beginPath();
			ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
			ctx.stroke();
		}

		ctx.globalAlpha = 1;
		setIsDrawing(false);

		const newLayers = saveLayerData();
		if (newLayers) {
			setHistory([...history.slice(0, historyStep + 1), { layers: newLayers }]);
			setHistoryStep(historyStep + 1);
		}
	};

	const saveDrawing = () => {
		const canvas = mainCanvasRef.current;
		if (!canvas || !user) return;

		const thumbnail = canvas.toDataURL();
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
		const canvas = mainCanvasRef.current;
		if (!canvas) return;

		const link = document.createElement("a");
		link.download = `${drawingTitle}.png`;
		link.href = canvas.toDataURL();
		link.click();
	};

	const handleBrushSelect = (brush: BrushType) => {
		if (brush.isPremium && !user?.isPremium) {
			if (confirm("This brush requires Premium. Would you like to upgrade?")) {
				navigate("/premium");
			}
			return;
		}
		setSelectedBrush(brush);
	};

	return (
		<div className="h-screen flex flex-col bg-gray-100">
			<nav className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4">
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
					{!user?.isPremium && (
						<Link to="/premium">
							<Button variant="outline" size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none">
								<Crown className="w-4 h-4 mr-2" />
								Upgrade
							</Button>
						</Link>
					)}
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
				<div className="bg-white border-r w-80 flex flex-col">
					<Tabs defaultValue="tools" className="flex-1 flex flex-col">
						<TabsList className="grid w-full grid-cols-2 m-2">
							<TabsTrigger value="tools">Tools</TabsTrigger>
							<TabsTrigger value="brushes">Brushes</TabsTrigger>
						</TabsList>

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
											<Minus className="w-4 h-4 mr-2" />
											Line
										</Button>
										<Button
											variant={tool === "rectangle" ? "default" : "outline"}
											size="sm"
											onClick={() => setTool("rectangle")}
											className="justify-start">
											<Square className="w-4 h-4 mr-2" />
											Rectangle
										</Button>
										<Button
											variant={tool === "circle" ? "default" : "outline"}
											size="sm"
											onClick={() => setTool("circle")}
											className="justify-start">
											<Circle className="w-4 h-4 mr-2" />
											Circle
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
										<Input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
									</div>
								</div>

								<div>
									<div className="flex justify-between mb-2">
										<Label htmlFor="brushSize">Thickness</Label>
										<span className="text-sm text-gray-600">{(brushSize / 10).toFixed(1)}px</span>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8 rounded-full"
											onClick={() => setBrushSize(Math.max(1, brushSize - 5))}>
											-
										</Button>
										<Input
											id="brushSize"
											type="range"
											min="1"
											max="500"
											value={brushSize}
											onChange={(e) => setBrushSize(Number(e.target.value))}
											className="flex-1"
										/>
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8 rounded-full"
											onClick={() => setBrushSize(Math.min(500, brushSize + 5))}>
											+
										</Button>
									</div>
								</div>

								<div>
									<div className="flex justify-between mb-2">
										<Label htmlFor="opacity">Opacity</Label>
										<span className="text-sm text-gray-600">{brushOpacity}%</span>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8 rounded-full"
											onClick={() => setBrushOpacity(Math.max(0, brushOpacity - 5))}>
											-
										</Button>
										<Input
											id="opacity"
											type="range"
											min="0"
											max="100"
											value={brushOpacity}
											onChange={(e) => setBrushOpacity(Number(e.target.value))}
											className="flex-1"
										/>
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8 rounded-full"
											onClick={() => setBrushOpacity(Math.min(100, brushOpacity + 5))}>
											+
										</Button>
									</div>
								</div>

								<div className="border-t pt-4">
									<Label className="mb-3 block">Controls</Label>
									<div className="flex flex-col gap-2">
										<Button variant="outline" size="sm" onClick={undo} disabled={historyStep <= 0} className="justify-start">
											<Undo className="w-4 h-4 mr-2" />
											Undo
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={redo}
											disabled={historyStep >= history.length - 1}
											className="justify-start">
											<Redo className="w-4 h-4 mr-2" />
											Redo
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={clearCanvas}
											className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
											<Trash2 className="w-4 h-4 mr-2" />
											Clear Layer
										</Button>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="brushes" className="p-4 space-y-4 mt-0">
								<div className="bg-gray-100 rounded-lg p-4 mb-4">
									<div className="text-sm mb-2">Current: {selectedBrush.name}</div>
									<div className="h-24 bg-white rounded-lg flex items-center justify-center">
										<div
											className="w-32 h-1 bg-gradient-to-r from-transparent via-black to-transparent rounded-full"
											style={{
												opacity: selectedBrush.opacity,
												filter: `blur(${selectedBrush.softness * 2}px)`,
											}}
										/>
									</div>
								</div>

								<div className="space-y-2">
									{brushes.map((brush) => (
										<button
											key={brush.id}
											onClick={() => handleBrushSelect(brush)}
											className={`w-full p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left ${
												selectedBrush.id === brush.id ? "border-purple-500 bg-purple-50" : ""
											}`}>
											<div className="flex items-center justify-between mb-2">
												<span className="text-sm">{brush.name}</span>
												<div className="flex items-center gap-2">
													{brush.isPremium && (
														<Badge
															variant="secondary"
															className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs">
															{user?.isPremium ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
														</Badge>
													)}
													{!brush.isPremium && <span className="text-xs text-gray-500">{(brushSize / 10).toFixed(1)}</span>}
												</div>
											</div>
											<div className="h-8 bg-white rounded flex items-center px-4">
												<div
													className="w-full h-0.5 bg-black rounded-full"
													style={{
														opacity: brush.opacity,
														filter: `blur(${brush.softness}px)`,
													}}
												/>
											</div>
										</button>
									))}
								</div>

								{!user?.isPremium && (
									<div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 mt-4">
										<div className="flex items-start gap-3">
											<Crown className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
											<div className="flex-1">
												<p className="text-sm mb-2">Unlock 50+ premium brushes with Premium</p>
												<Button
													size="sm"
													onClick={() => navigate("/premium")}
													className="bg-gradient-to-r from-purple-600 to-blue-600">
													Upgrade Now
												</Button>
											</div>
										</div>
									</div>
								)}
							</TabsContent>
						</ScrollArea>
					</Tabs>
				</div>

				<div className="flex-1 p-8 overflow-auto bg-gray-200">
					<div className="max-w-full mx-auto flex items-center justify-center min-h-full">
						<div className="relative">
							<canvas
								ref={mainCanvasRef}
								className="bg-white border-2 border-gray-300 rounded-lg shadow-lg max-w-full absolute top-0 left-0"
								style={{ maxHeight: "calc(100vh - 200px)", pointerEvents: "none" }}
							/>
							<canvas
								ref={layerCanvasRef}
								className="bg-transparent border-2 border-gray-300 rounded-lg cursor-crosshair shadow-lg max-w-full relative"
								style={{ maxHeight: "calc(100vh - 200px)" }}
								onMouseDown={startDrawing}
								onMouseMove={draw}
								onMouseUp={stopDrawing}
								onMouseLeave={stopDrawing}
							/>
						</div>
					</div>
				</div>

				{showLayerPanel && (
					<LayerPanel
						layers={layers}
						activeLayerId={activeLayerId}
						onLayersChange={(newLayers) => {
							setLayers(newLayers);
							renderAllLayers(newLayers);
						}}
						onActiveLayerChange={(layerId) => {
							saveLayerData();
							setActiveLayerId(layerId);
						}}
					/>
				)}
			</div>
		</div>
	);
}
