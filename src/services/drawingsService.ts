import * as drawingsApi from "../api/drawings";
import { Layer } from "../components/LayerPanel";

export interface Drawing {
	drawingId: string | null;
	userId: string;
	title: string;
	width: number;
	height: number;
	thumbnail: string;
	createdAt: string;
	updatedAt: string;
}

export const drawingsService = {
	async saveDrawing(userId: string, drawing: Drawing, layers: Layer[]) {
		console.log("drawingsService.saveDrawing() drawing:", drawing);

		if (drawing.drawingId) {
			console.log("updateDrawing() drawingId:", drawing.drawingId);

			return drawingsApi.updateDrawing(userId, drawing.drawingId, drawing.title, drawing.thumbnail, layers);
		} else {
			return drawingsApi.createDrawing(userId, drawing, layers);
		}
	},

	async getDrawings(userId: string) {
		return drawingsApi.getDrawings(userId);
	},

	async getDrawing(userId: string, drawingId: string) {
		return drawingsApi.getDrawing(drawingId, userId);
	},

	async deleteDrawing(userId: string, drawingId: string) {
		console.log("drawingsService: delete Drawing:", drawingId, " userId:", userId);

		return drawingsApi.deleteDrawing(drawingId, userId);
	},
};
