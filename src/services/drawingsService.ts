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
		if (drawing.drawingId) {
			return drawingsApi.updateDrawing(userId, drawing, layers);
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
		return drawingsApi.deleteDrawing(drawingId, userId);
	},
};
