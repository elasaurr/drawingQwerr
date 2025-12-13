const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const crypto = require("crypto");

// const LAYER = {
// 	layer_id: uuid,
// 	drawing_id: uuid,
// 	name: String,
// 	visible: Boolean,
// 	locked: Boolean,
// 	opacity: Number,
// 	blend_mode: String,
// 	image_data: String,
// };

// Utility to convert base64 dataURL to Buffer
function dataURLToBuffer(dataURL) {
	const [header, base64] = dataURL.split(",");
	return Buffer.from(base64, "base64");
}

// Get all drawings for a user
router.get("/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const { data, error } = await supabase.from("drawings").select("*").eq("user_id", userId).order("updated_at", { ascending: false });

		if (error) throw error;

		res.json(data);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get single drawing by id
router.get("/:userId/:drawingId", async (req, res) => {
	try {
		const { userId, drawingId } = req.params;
		const data = {};

		const { data: drawingsData, error: drawingsError } = await supabase
			.from("drawings")
			.select("*")
			.eq("id", drawingId)
			.eq("user_id", userId)
			.single();
		if (drawingsError) throw drawingsError;

		const { data: layersData, error: layerError } = await supabase.from("layers").select("*").eq("drawing_id", drawingId);
		if (layerError) throw layerError;

		data.drawingsData = drawingsData;
		data.layers = layersData;

		res.json(data);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get signed URL for image
router.get("/:userId/:drawingId/url", async (req, res) => {
	try {
		const { userId, drawingId } = req.params;

		const { data: signedURLData, error } = await supabase.storage
			.from("drawings")
			.createSignedUrl(`${userId}/${encodeURIComponent(drawingId)}.png`, 60);

		if (error) throw error;

		res.json({ signedUrl: signedURLData.signedUrl });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Create a new drawing
router.post("/", async (req, res) => {
	try {
		const { userId, title, thumbnail, width, height, createdAt, layers } = req.body;

		const drawingUUID = crypto.randomUUID();

		const filePath = `${userId}/${encodeURIComponent(drawingUUID)}.png`;
		const buffer = dataURLToBuffer(thumbnail);
		let data = {};

		// Upload image to storage
		const { data: storageData, error: storageError } = await supabase.storage
			.from("drawings")
			.upload(filePath, buffer, { contentType: "image/png" });
		if (storageError) throw storageError;
		data.storageData = storageData;

		// Insert metadata in database
		const { data: dataDrawing, error: dbDrawingError } = await supabase.from("drawings").insert({
			id: drawingUUID,
			user_id: userId,
			title,
			width,
			height,
			thumbnail_path: thumbnail,
			created_at: createdAt,
			updated_at: createdAt,
		});

		if (dbDrawingError) throw dbDrawingError;
		data.dataDrawing = dataDrawing;
		data.drawingId = drawingUUID;

		if (!Array.isArray(layers) || layers.length === 0) {
			throw new Error("layers must be a non-empty array");
		}

		layers.forEach((layer) => {
			layer.layer_id = crypto.randomUUID();
			layer.drawing_id = drawingUUID;
			layer.blend_mode = layer.blendMode;
			layer.image_data = layer.imageData;
			delete layer.imageData;
			delete layer.id;
			delete layer.blendMode;
		});

		const { data: dataLayers, error: dbLayersError } = await supabase.from("layers").insert(layers);
		if (dbLayersError) throw dbLayersError;
		data.dataLayers = dataLayers;

		res.status(201).json({ message: "Drawing created successfully", data: data });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// TODO: update and Delete
// Update a drawing
router.put("/:drawingId", async (req, res) => {
	try {
		const { drawingId } = req.params;
		const { userId, title, thumbnail, layers } = req.body;
		const data = {};

		const filePath = `${userId}/${encodeURIComponent(drawingId)}.png`;
		const buffer = dataURLToBuffer(thumbnail);
		console.log("\nUpdate drawing: ", drawingId, "\n");

		// Update image in storage
		console.log("\nUpdate drawing: filePath: ", filePath, "| buffer: ", buffer, "\n");

		const { data: storageData, error: storageError } = await supabase.storage
			.from("drawings")
			.update(filePath, buffer, { contentType: "image/png" });
		if (storageError) {
			console.log("\nUpdate drawing: storageError: ", storageError, "\n");

			throw storageError;
		}

		console.log("\nUpdate drawing: storageData: ", storageData, "| Done\n");
		// Get signed URL for updated image
		// const { data: signedURLData, error: signedURLError } = await supabase.storage.from("drawings").createSignedUrl(filePath, 60);

		if (signedURLError) throw signedURLError;

		// Update database metadata
		const { data: drawingData, error: dbError } = await supabase
			.from("drawings")
			.update({
				title,
				thumbnail_path: thumbnail,
				updated_at: new Date().toISOString(),
			})
			.eq("id", drawingId);
		if (dbError) throw dbError;

		// Update layers
		if (!Array.isArray(layers) || layers.length === 0) {
			throw new Error("layers must be a non-empty array");
		}

		const { data: layersDeleteData, error: dbLayersDeleteError } = await supabase.from("layers").delete().eq("drawing_id", drawingId);
		if (dbLayersDeleteError) throw dbLayersDeleteError;

		layers.forEach((layer) => {
			layer.layer_id = crypto.randomUUID();
			layer.drawing_id = drawingId;
			layer.blend_mode = layer.blendMode;
			layer.image_data = layer.imageData;
			delete layer.imageData;
			delete layer.id;
			delete layer.blendMode;
		});

		const { data: layersInsertData, error: dbLayersInsertError } = await supabase.from("layers").insert(layers);
		if (dbLayersInsertError) throw dbLayersInsertError;

		data.layersInsertData = layersInsertData;
		data.storageData = storageData;
		data.drawingData = drawingData;
		res.json({ message: "Drawing updated successfully", data });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Delete a drawing
router.delete("/:userId/:drawingId", async (req, res) => {
	try {
		const { userId, drawingId } = req.params;

		// Delete from database
		const { error: dbDrawingsError } = await supabase.from("drawings").delete().eq("id", drawingId).eq("user_id", userId);
		if (dbDrawingsError) {
			console.log("\nDelete drawing: dbDrawingsError: ", dbDrawingsError, "\n");
			throw dbDrawingsError;
		}

		// Delete layers
		const { error: dbLayersError } = await supabase.from("layers").delete().eq("drawing_id", drawingId);
		if (dbLayersError) {
			console.log("\nDelete drawing: dbLayersError: ", dbLayersError, "\n");

			throw dbLayersError;
		}

		// Delete from storage
		const { error: storageError } = await supabase.storage.from("drawings").remove([`${userId}/${drawingId}.png`]);
		if (storageError) {
			console.log("\nDelete drawing: storageError: ", storageError, "\n");
			throw storageError;
		}

		res.json({ message: "Drawing deleted successfully" });
	} catch (err) {
		console.log("\nDelete drawing: err: ", err, "\n");

		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
