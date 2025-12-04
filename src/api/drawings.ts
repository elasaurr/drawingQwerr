import axios from "axios";
import { API_BASE_URL } from "../constants";

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

export async function createDrawing(userId: string, imageData: string, drawingId: string, title: string, thumbnail: string, createdAt: string) {
	try {
		const res = await axios.post(`${API_URL}`, {
			userId,
			imageData,
			drawingId,
			title,
			thumbnail,
			createdAt,
		});
		return res.data;
	} catch (err: any) {
		throw new Error(err.response?.data?.error || err.message);
	}
}

export async function updateDrawing(drawingId: string, userId: string, title: string, imageData: string) {
	try {
		const res = await axios.put(`${API_URL}/${drawingId}`, {
			userId,
			title,
			imageData,
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
