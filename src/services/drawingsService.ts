import * as drawingsApi from "../api/drawings";

export const drawingsService = {
	async saveDrawing(
		userId: string,
		drawing: {
			id?: string;
			title: string;
			imageData: string;
			thumbnail: string;
			createdAt: string;
		}
	) {
		if (drawing.id) {
			// Update existing
			return drawingsApi.updateDrawing(drawing.id, userId, drawing.title, drawing.imageData);
		} else {
			// Create new
			const newId = drawing.id || Date.now().toString();
			return drawingsApi.createDrawing(userId, drawing.imageData, newId, drawing.title, drawing.thumbnail, drawing.createdAt);
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
