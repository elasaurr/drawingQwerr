import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Crown, Lock } from "lucide-react";
import { Slider } from "./ui/slider";

interface CanvasPreset {
	name: string;
	width: number;
	height: number;
	isPremium?: boolean;
}

interface NewCanvasDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function NewCanvasDialog({ open, onOpenChange }: NewCanvasDialogProps) {
	const { user } = useAuth();
	const navigate = useNavigate();

	const presets: CanvasPreset[] = [
		{ name: "HD (Quality)", width: 1440, height: 3224, isPremium: false },
		{ name: "1:1 (2K)", width: 2048, height: 2048, isPremium: true },
		{ name: "3:4 (2K)", width: 1536, height: 2048, isPremium: true },
		{ name: "9:16 (2K)", width: 1080, height: 1920, isPremium: true },
		{ name: "X Header", width: 1500, height: 500, isPremium: false },
		{ name: "Chat Stamp", width: 370, height: 320, isPremium: false },
		{ name: "Vertical", width: 690, height: 4096, isPremium: true },
	];

	const [customWidth, setCustomWidth] = useState(1000);
	const [customHeight, setCustomHeight] = useState(1000);
	const [quality, setQuality] = useState(75);

	const handlePresetSelect = (preset: CanvasPreset) => {
		if (preset.isPremium && !user?.premium_expiry) {
			if (confirm("This canvas size requires Premium. Would you like to upgrade?")) {
				navigate("/premium");
			}
			return;
		}

		localStorage.setItem("newCanvasSettings", JSON.stringify({ width: preset.width, height: preset.height }));
		onOpenChange(false);
		navigate("/draw");
	};

	const handleCustomCanvas = () => {
		const maxFreeSize = 1500;
		if ((customWidth > maxFreeSize || customHeight > maxFreeSize) && !user?.premium_expiry) {
			if (confirm("Canvas sizes above 1500px require Premium. Would you like to upgrade?")) {
				navigate("/premium");
			}
			return;
		}

		localStorage.setItem("newCanvasSettings", JSON.stringify({ width: customWidth, height: customHeight }));
		onOpenChange(false);
		navigate("/draw");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">New Canvas</DialogTitle>
					<DialogDescription>Choose a canvas size to start creating</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div>
						<h3 className="mb-4">Custom Size</h3>
						<div className="grid grid-cols-2 gap-4 mb-4">
							<div className="space-y-2">
								<Label htmlFor="width">Width</Label>
								<div className="flex items-center gap-2">
									<Button variant="outline" size="sm" onClick={() => setCustomWidth(Math.max(100, customWidth - 100))}>
										-
									</Button>
									<Input
										id="width"
										type="number"
										value={customWidth}
										onChange={(e) => setCustomWidth(Number(e.target.value))}
										min="100"
										max="5000"
									/>
									<Button variant="outline" size="sm" onClick={() => setCustomWidth(Math.min(5000, customWidth + 100))}>
										+
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="height">Height</Label>
								<div className="flex items-center gap-2">
									<Button variant="outline" size="sm" onClick={() => setCustomHeight(Math.max(100, customHeight - 100))}>
										-
									</Button>
									<Input
										id="height"
										type="number"
										value={customHeight}
										onChange={(e) => setCustomHeight(Number(e.target.value))}
										min="100"
										max="5000"
									/>
									<Button variant="outline" size="sm" onClick={() => setCustomHeight(Math.min(5000, customHeight + 100))}>
										+
									</Button>
								</div>
							</div>
						</div>

						<div className="mb-4">
							<div className="flex justify-between mb-2">
								<Label>Quality</Label>
								<span className="text-sm text-gray-600">{quality}%</span>
							</div>
							<Slider value={[quality]} onValueChange={(values) => setQuality(values[0])} min={10} max={100} step={5} />
							<div className="flex justify-between text-xs text-gray-500 mt-1">
								<span>Speed</span>
								<span>Quality</span>
							</div>
						</div>

						<Button onClick={handleCustomCanvas} className="w-full">
							Create Custom Canvas
						</Button>
					</div>

					<div className="border-t pt-6">
						<h3 className="mb-4">Presets</h3>
						<div className="grid gap-3">
							{presets.map((preset) => (
								<button
									key={preset.name}
									onClick={() => handlePresetSelect(preset)}
									className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
											{preset.width > preset.height ? "─" : "│"}
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span>{preset.name}</span>
												{preset.isPremium && (
													<Badge
														variant="secondary"
														className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs">
														{user?.premium_expiry ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
													</Badge>
												)}
											</div>
											<p className="text-sm text-gray-500">
												{preset.width} x {preset.height}
											</p>
										</div>
									</div>
									{preset.isPremium && !user?.premium_expiry && <Lock className="w-5 h-5 text-gray-400" />}
								</button>
							))}
						</div>
					</div>

					{!user?.premium_expiry && (
						<div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
							<div className="flex items-start gap-3">
								<Crown className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
								<div className="flex-1">
									<p className="mb-2">Unlock all canvas sizes and premium features with Premium</p>
									<Button
										size="sm"
										onClick={() => {
											onOpenChange(false);
											navigate("/premium");
										}}
										className="bg-gradient-to-r from-purple-600 to-blue-600">
										Upgrade to Premium
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
