import axios from "axios";
import { API_BASE_URL } from "../constants";
import { Layer } from "../components/LayerPanel";
import { Drawing } from "../services/drawingsService";
import { headers } from "../../backend/supabaseClient";

const API_URL = `${API_BASE_URL}/drawings`;

export async function getDrawings(userId?: string) {
	if (!userId) return [];
	try {
		const res = await axios.get(`${API_URL}/${userId}`);
		return res.data;
	} catch (err: any) {
		throw new Error(err.response?.data?.error || err.message);
	}
}

export async function getDrawing(drawingId: string, userId?: string) {
	if (!userId) return null;
	try {
		const res = await axios.get(`${API_URL}/${userId}/${drawingId}`);
		return res.data;
	} catch (err: any) {
		throw new Error(err.response?.data?.error || err.message);
	}
}

export async function getDrawingImgUrl(userId: string, drawingId: string) {
	try {
		const res = await axios.get(`${API_URL}/${userId}/${drawingId}/url`);
		return res.data.signedUrl;
	} catch (err: any) {
		throw new Error(err.response?.data?.error || err.message);
	}
}

export async function createDrawing(userId: string, drawing: Drawing, layers: Layer[]) {
	console.log("Create Drawing:", drawing);

	try {
		const res = await axios.post(`${API_URL}/`, {
			userId,
			title: drawing.title,
			thumbnail: drawing.thumbnail,
			width: drawing.width,
			height: drawing.height,
			createdAt: drawing.createdAt,
			layers,
		});
		console.log("Create Drawing Response:", res.data);
		return res.data;
	} catch (err: any) {
		throw new Error(err.response?.data?.error || err.message);
	}
}

export async function updateDrawing(userId: string, drawing: Drawing, layers: Layer[]) {
	console.log("Update Drawing:", drawing);

	try {
		if (!drawing.drawingId || !drawing) return;
		const res = await axios.put(`${API_URL}/${drawing.drawingId}`, {
			userId,
			drawing,
		});
		return res.data;
	} catch (err: any) {
		throw new Error(err.response?.data?.error || err.message);
	}
}

export async function deleteDrawing(drawingId: string, userId: string) {
	try {
		const res = await axios.delete(`${API_URL}/${userId}/${drawingId}`);
		return res.data;
	} catch (err: any) {
		throw new Error(err.response?.data?.error || err.message);
	}
}
