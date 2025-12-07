import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Copy, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Layers, Lock, Unlock } from "lucide-react";

export interface Layer {
	id: string;
	name: string;
	visible: boolean;
	opacity: number;
	blendMode: GlobalCompositeOperation;
	locked: boolean;
	imageData: string | null;
}

interface LayerPanelProps {
	layers: Layer[];
	activeLayerId: string | null;
	onLayersChange: (layers: Layer[]) => void;
	onActiveLayerChange: (layerId: string) => void;
	onAddLayer: () => void;
	onDeleteLayer: (layerId: string) => void;
}

export default function LayerPanel({ layers, activeLayerId, onLayersChange, onActiveLayerChange, onAddLayer, onDeleteLayer }: LayerPanelProps) {
	const [editingLayerId, setEditingLayerId] = useState<string | null>(null);

	const activeLayer = layers.find((l) => l.id === activeLayerId);

	const duplicateLayer = (layerId: string) => {
		const layerIndex = layers.findIndex((l) => l.id === layerId);
		if (layerIndex === -1) return;

		const layer = layers[layerIndex];
		const newLayer: Layer = {
			...layer,
			id: Date.now().toString(),
			name: `${layer.name} copy`,
		};

		const newLayers = [...layers];
		newLayers.splice(layerIndex, 0, newLayer);
		onLayersChange(newLayers);
	};

	const deleteLayer = (layerId: string) => {
		if (layers.length === 1) {
			alert("Cannot delete the last layer");
			return;
		}
		// Delegate logic to parent to avoid state conflicts
		onDeleteLayer(layerId);
	};

	const toggleVisibility = (layerId: string) => {
		const newLayers = layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l));
		onLayersChange(newLayers);
	};

	const toggleLock = (layerId: string) => {
		const newLayers = layers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l));
		onLayersChange(newLayers);
	};

	const moveLayer = (layerId: string, direction: "up" | "down") => {
		const index = layers.findIndex((l) => l.id === layerId);
		if (index === -1) return;

		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= layers.length) return;

		const newLayers = [...layers];
		[newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
		onLayersChange(newLayers);
	};

	const updateLayerName = (layerId: string, name: string) => {
		const newLayers = layers.map((l) => (l.id === layerId ? { ...l, name } : l));
		onLayersChange(newLayers);
	};

	const updateLayerOpacity = (opacity: number) => {
		if (!activeLayer) return;
		const newLayers = layers.map((l) => (l.id === activeLayerId ? { ...l, opacity } : l));
		onLayersChange(newLayers);
	};

	const updateLayerBlendMode = (blendMode: string) => {
		if (!activeLayer) return;
		const newLayers = layers.map((l) => (l.id === activeLayerId ? { ...l, blendMode } : l));
		onLayersChange(newLayers);
	};

	return (
		<div className="w-80 bg-gray-900 text-white flex flex-col h-full">
			<div className="p-3 border-b border-gray-700 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Layers className="w-4 h-4" />
					<span>Layer</span>
				</div>
				<div className="flex gap-1">
					<Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-gray-700" onClick={onAddLayer} title="Add Layer">
						<Plus className="w-4 h-4" />
					</Button>
				</div>
			</div>

			<ScrollArea className="flex-1">
				<div className="p-2 space-y-2">
					{layers.map((layer, index) => (
						<div
							key={layer.id}
							className={`bg-gray-800 rounded-lg border-2 transition-all ${
								layer.id === activeLayerId ? "border-blue-500" : "border-gray-700 hover:border-gray-600"
							}`}
							onClick={() => onActiveLayerChange(layer.id)}>
							<div className="p-2 flex items-center gap-2">
								<div className="w-16 h-16 bg-gray-700 rounded border border-gray-600 shrink-0 overflow-hidden">
									{layer.imageData ? (
										<img src={layer.imageData} alt={layer.name} className="w-full h-full object-cover" />
									) : (
										<div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Empty</div>
									)}
								</div>

								<div className="flex-1 min-w-0">
									{editingLayerId === layer.id ? (
										<Input
											value={layer.name}
											onChange={(e) => updateLayerName(layer.id, e.target.value)}
											onBlur={() => setEditingLayerId(null)}
											onKeyDown={(e) => {
												if (e.key === "Enter") setEditingLayerId(null);
											}}
											className="h-6 text-sm bg-gray-700 border-gray-600 text-white"
											autoFocus
										/>
									) : (
										<div className="text-sm truncate cursor-text" onDoubleClick={() => setEditingLayerId(layer.id)}>
											{layer.name}
										</div>
									)}

									<div className="flex items-center gap-2 mt-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 text-white hover:bg-gray-700"
											onClick={(e: React.MouseEvent) => {
												e.stopPropagation();
												toggleVisibility(layer.id);
											}}>
											{layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 opacity-50" />}
										</Button>

										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 text-white hover:bg-gray-700"
											onClick={(e: React.MouseEvent) => {
												e.stopPropagation();
												toggleLock(layer.id);
											}}>
											{layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 opacity-50" />}
										</Button>

										<span className="text-xs text-gray-400 ml-auto">{layer.opacity}%</span>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 text-white hover:bg-gray-700"
										onClick={(e: React.MouseEvent) => {
											e.stopPropagation();
											moveLayer(layer.id, "up");
										}}
										disabled={index === 0}>
										<ChevronUp className="w-3 h-3" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 text-white hover:bg-gray-700"
										onClick={(e: React.MouseEvent) => {
											e.stopPropagation();
											moveLayer(layer.id, "down");
										}}
										disabled={index === layers.length - 1}>
										<ChevronDown className="w-3 h-3" />
									</Button>
								</div>
							</div>

							{layer.id === activeLayerId && (
								<div className="border-t border-gray-700 p-2 space-y-2">
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											className="flex-1 h-7 text-xs text-white hover:bg-gray-700"
											onClick={(e: React.MouseEvent) => {
												e.stopPropagation();
												duplicateLayer(layer.id);
											}}>
											<Copy className="w-3 h-3 mr-1" />
											Duplicate
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="flex-1 h-7 text-xs text-red-400 hover:bg-red-900/20"
											onClick={(e: React.MouseEvent) => {
												e.stopPropagation();
												deleteLayer(layer.id);
											}}>
											<Trash2 className="w-3 h-3 mr-1" />
											Delete
										</Button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			</ScrollArea>

			{activeLayer && (
				<div className="border-t border-gray-700 p-3 space-y-3">
					<div>
						<Label className="text-xs text-gray-400 mb-2 block">Blend Mode</Label>
						<Select value={activeLayer.blendMode} onValueChange={updateLayerBlendMode}>
							<SelectTrigger className="h-8 bg-gray-800 border-gray-700 text-white">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="bg-gray-800 border-gray-700 text-white">
								<SelectItem value="normal">Normal</SelectItem>
								<SelectItem value="multiply">Multiply</SelectItem>
								<SelectItem value="screen">Screen</SelectItem>
								<SelectItem value="overlay">Overlay</SelectItem>
								<SelectItem value="darken">Darken</SelectItem>
								<SelectItem value="lighten">Lighten</SelectItem>
								<SelectItem value="color-dodge">Color Dodge</SelectItem>
								<SelectItem value="color-burn">Color Burn</SelectItem>
								<SelectItem value="hard-light">Hard Light</SelectItem>
								<SelectItem value="soft-light">Soft Light</SelectItem>
								<SelectItem value="difference">Difference</SelectItem>
								<SelectItem value="exclusion">Exclusion</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<div className="flex justify-between mb-2">
							<Label className="text-xs text-gray-400">Opacity</Label>
							<span className="text-xs text-gray-400">{activeLayer.opacity}%</span>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 rounded-full text-white hover:bg-gray-700"
								onClick={() => updateLayerOpacity(Math.max(0, activeLayer.opacity - 5))}>
								-
							</Button>
							<Slider
								value={[activeLayer.opacity]}
								onValueChange={(values: number[]) => updateLayerOpacity(values[0])}
								min={0}
								max={100}
								step={1}
								className="flex-1"
							/>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 rounded-full text-white hover:bg-gray-700"
								onClick={() => updateLayerOpacity(Math.min(100, activeLayer.opacity + 5))}>
								+
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
