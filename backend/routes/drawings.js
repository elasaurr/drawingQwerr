const express = require("express");
const router = express.Router();
// 1. Remove the global supabase client import
// const supabase = require("../supabaseClient");
const crypto = require("crypto");
// 2. Import your existing middleware
const { authMiddleware } = require("../middleware/authMiddleware");

// Utility to convert base64 dataURL to Buffer
function dataURLToBuffer(dataURL) {
	if (!dataURL) return Buffer.from("");
	const parts = dataURL.split(",");
	const base64 = parts.length > 1 ? parts[1] : parts[0];
	return Buffer.from(base64, "base64");
}

// ------------------------------------------------------------------
// APPLY MIDDLEWARE GLOBALLY TO ALL DRAWING ROUTES
// ------------------------------------------------------------------
// This ensures every request has req.supabase (authenticated) and req.user
router.use(authMiddleware);

// ------------------------------------------------------------------
// 1. GET ALL DRAWINGS FOR USER
// ------------------------------------------------------------------
router.get("/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

		// Security Check: Ensure logged-in user matches requested userId
		if (req.user.id !== userId) {
			return res.status(403).json({ error: "Unauthorized access to these drawings" });
		}

		// 3. Use req.supabase instead of global supabase
		const { data, error } = await req.supabase.from("drawings").select("*").eq("user_id", userId).order("updated_at", { ascending: false });

		if (error) throw error;

		res.json(data);
	} catch (err) {
		console.error("Error fetching drawings:", err.message);
		res.status(500).json({ error: err.message });
	}
});

// ------------------------------------------------------------------
// 2. GET SINGLE DRAWING + LAYERS
// ------------------------------------------------------------------
router.get("/:userId/:drawingId", async (req, res) => {
	try {
		const { userId, drawingId } = req.params;

		if (req.user.id !== userId) return res.status(403).json({ error: "Forbidden" });

		const responseData = {};

		// Use req.supabase
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

// ------------------------------------------------------------------
// 3. GET SIGNED URL
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// 4. CREATE DRAWING
// ------------------------------------------------------------------
router.post("/", async (req, res) => {
	try {
		// We can rely on req.user.id instead of trusting the body's userId for security
		const userId = req.user.id;
		const { title, thumbnail, width, height, createdAt, layers } = req.body;

		const drawingUUID = crypto.randomUUID();
		const filePath = `${userId}/${encodeURIComponent(drawingUUID)}.png`;

		console.log("------------------------------------------------");
		console.log("DEBUG UPLOAD:");
		console.log("Logged in User ID:", userId);
		console.log("Target File Path:", filePath);
		console.log("------------------------------------------------");

		const buffer = dataURLToBuffer(thumbnail);
		const responsePayload = {};

		// Use req.supabase
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

// ------------------------------------------------------------------
// 5. UPDATE DRAWING
// ------------------------------------------------------------------
router.put("/:drawingId", async (req, res) => {
	try {
		const { drawingId } = req.params;
		const userId = req.user.id; // Get from token
		const { title, thumbnail, layers } = req.body;
		const responsePayload = {};

		const filePath = `${userId}/${encodeURIComponent(drawingId)}.png`;

		if (thumbnail) {
			const buffer = dataURLToBuffer(thumbnail);
			// Use req.supabase
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
			.select();

		if (dbError) throw dbError;
		responsePayload.drawingData = drawingData;

		if (Array.isArray(layers) && layers.length > 0) {
			// req.supabase checks RLS automatically (must own the drawing to delete layers)
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

// ------------------------------------------------------------------
// 6. DELETE DRAWING
// ------------------------------------------------------------------
router.delete("/:userId/:drawingId", async (req, res) => {
	try {
		const { userId, drawingId } = req.params;
		if (req.user.id !== userId) return res.status(403).json({ error: "Forbidden" });

		// Use req.supabase
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
