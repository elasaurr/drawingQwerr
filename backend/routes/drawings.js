const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/authMiddleware");

const { validate, drawingSchema, updateDrawingSchema } = require("../middleware/validation");

function dataURLToBuffer(dataURL) {
	if (!dataURL) return Buffer.from("");
	const parts = dataURL.split(",");
	const base64 = parts.length > 1 ? parts[1] : parts[0];
	return Buffer.from(base64, "base64");
}
function isPng(buffer) {
	if (!buffer || buffer.length < 8) return false;
	return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
}

router.use(authMiddleware);

router.get("/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

		if (req.user.id !== userId) {
			return res.status(403).json({ error: "Unauthorized access to these drawings" });
		}

		const { data, error } = await req.supabase.from("drawings").select("*").eq("user_id", userId).order("updated_at", { ascending: false });

		if (error) throw error;

		res.json(data);
	} catch (err) {
		console.error("Error fetching drawings:", err.message);
		res.status(500).json({ error: err.message });
	}
});

router.get("/:userId/:drawingId", async (req, res) => {
	try {
		const { userId, drawingId } = req.params;

		if (req.user.id !== userId) return res.status(403).json({ error: "Forbidden" });

		const responseData = {};

		const { data: drawingData, error: drawingError } = await req.supabase
			.from("drawings")
			.select("*")
			.eq("id", drawingId)
			.eq("user_id", userId)
			.single();

		if (drawingError) throw drawingError;
		responseData.drawingsData = drawingData;

		const { data: layersData, error: layersError } = await req.supabase
			.from("layers")
			.select("*")
			.eq("drawing_id", drawingId)
			.order("index", { ascending: true });

		if (layersError) throw layersError;
		responseData.layers = layersData;

		res.json(responseData);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.get("/:userId/:drawingId/url", async (req, res) => {
	try {
		const { userId, drawingId } = req.params;
		if (req.user.id !== userId) return res.status(403).json({ error: "Forbidden" });

		const filePath = `${userId}/${encodeURIComponent(drawingId)}.png`;

		const { data, error } = await req.supabase.storage.from("drawings").createSignedUrl(filePath, 60);

		if (error) throw error;

		res.json({ signedUrl: data.signedUrl });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/", authMiddleware, validate(drawingSchema), async (req, res) => {
	try {
		const userId = req.user.id;
		const { title, thumbnail, width, height, createdAt, layers } = req.body;

		const drawingUUID = crypto.randomUUID();
		const filePath = `${userId}/${encodeURIComponent(drawingUUID)}.png`;

		const buffer = dataURLToBuffer(thumbnail);
		if (!isPng(buffer)) {
			return res.status(400).json({ error: "Invalid file format. Only PNG is allowed." });
		}
		const responsePayload = {};

		const { data: storageData, error: storageError } = await req.supabase.storage
			.from("drawings")
			.upload(filePath, buffer, { contentType: "image/png", upsert: true });

		if (storageError) throw storageError;
		responsePayload.storageData = storageData;

		const { data: drawingData, error: dbDrawingError } = await req.supabase
			.from("drawings")
			.insert({
				id: drawingUUID,
				user_id: userId,
				title: title || "Untitled",
				width,
				height,
				thumbnail_path: thumbnail,
				created_at: createdAt || new Date().toISOString(),
				updated_at: createdAt || new Date().toISOString(),
			})
			.select()
			.single();

		if (dbDrawingError) throw dbDrawingError;
		responsePayload.dataDrawing = drawingData;
		responsePayload.drawingId = drawingUUID;

		if (Array.isArray(layers) && layers.length > 0) {
			const layersToInsert = layers.map((layer, index) => ({
				layer_id: crypto.randomUUID(),
				drawing_id: drawingUUID,
				name: layer.name || `Layer ${index + 1}`,
				index: index,
				visible: layer.visible !== undefined ? layer.visible : true,
				opacity: layer.opacity !== undefined ? layer.opacity : 1,
				blend_mode: layer.blendMode || "normal",
				image_data: layer.imageData || "",
				locked: layer.locked || false,
			}));

			const { data: layersData, error: dbLayersError } = await req.supabase.from("layers").insert(layersToInsert).select();

			if (dbLayersError) throw dbLayersError;
			responsePayload.dataLayers = layersData;
		}

		res.status(201).json({ message: "Drawing created successfully", data: responsePayload });
	} catch (err) {
		console.error("Create error:", err);
		res.status(500).json({ error: err.message });
	}
});

router.put("/:drawingId", authMiddleware, validate(updateDrawingSchema), async (req, res) => {
	try {
		const { drawingId } = req.params;
		const userId = req.user.id;
		const { title, thumbnail, layers } = req.body;
		const responsePayload = {};

		const filePath = `${userId}/${encodeURIComponent(drawingId)}.png`;

		if (thumbnail) {
			const buffer = dataURLToBuffer(thumbnail);
			if (!isPng(buffer)) {
				return res.status(400).json({ error: "Invalid file format. Only PNG is allowed." });
			}

			const { data: storageData, error: storageError } = await req.supabase.storage
				.from("drawings")
				.update(filePath, buffer, { contentType: "image/png", upsert: true });

			if (!storageError) {
				responsePayload.storageData = storageData;
			}
		}

		const { data: drawingData, error: dbError } = await req.supabase
			.from("drawings")
			.update({
				title,
				thumbnail_path: thumbnail,
				updated_at: new Date().toISOString(),
			})
			.eq("id", drawingId)
			.eq("user_id", userId)
			.select();

		if (dbError) throw dbError;
		responsePayload.drawingData = drawingData;

		if (Array.isArray(layers) && layers.length > 0) {
			if (layers.length > 100) {
				return res.status(400).json({ error: "Max 100 layers allowed" });
			}

			const { error: deleteLayersError } = await req.supabase.from("layers").delete().eq("drawing_id", drawingId);

			if (deleteLayersError) throw deleteLayersError;

			const layersToInsert = layers.map((layer, index) => ({
				layer_id: crypto.randomUUID(),
				drawing_id: drawingId,
				name: layer.name,
				index: index,
				visible: layer.visible,
				opacity: layer.opacity,
				blend_mode: layer.blendMode || layer.blend_mode || "normal",
				image_data: layer.imageData || layer.image_data,
				locked: layer.locked,
			}));

			const { data: layersInsertData, error: insertLayersError } = await req.supabase.from("layers").insert(layersToInsert).select();

			if (insertLayersError) throw insertLayersError;
			responsePayload.layersInsertData = layersInsertData;
		}

		res.json({ message: "Drawing updated successfully", data: responsePayload });
	} catch (err) {
		console.error("Update error:", err);
		res.status(500).json({ error: err.message });
	}
});

router.delete("/:userId/:drawingId", async (req, res) => {
	try {
		const { userId, drawingId } = req.params;
		if (req.user.id !== userId) return res.status(403).json({ error: "Forbidden" });

		const { error: layersError } = await req.supabase.from("layers").delete().eq("drawing_id", drawingId);

		if (layersError) throw layersError;

		const { error: drawingError } = await req.supabase.from("drawings").delete().eq("id", drawingId).eq("user_id", userId);

		if (drawingError) throw drawingError;

		const filePath = `${userId}/${drawingId}.png`;
		const { error: storageError } = await req.supabase.storage.from("drawings").remove([filePath]);

		if (storageError) {
			console.warn("Storage delete warning:", storageError.message);
		}

		res.json({ message: "Drawing deleted successfully" });
	} catch (err) {
		console.error("Delete error:", err);
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
