const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

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
		const { data, error } = await supabase.from("drawings").select("*").eq("id", drawingId).eq("user_id", userId).single();

		if (error) throw error;

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
		const { userId, title, width, height, thumbnail_path, createdAt } = req.body;
		const filePath = `${userId}/${encodeURIComponent(drawingId)}.png`;
		const buffer = dataURLToBuffer(imageData);

		// Upload image to storage
		const { data: storageData, error: storageError } = await supabase.storage
			.from("drawings")
			.upload(filePath, buffer, { contentType: "image/png" });

		if (storageError) throw storageError;

		// Insert metadata in database
		const { data, error: dbError } = await supabase.from("drawings").insert({
			id: drawingId,
			user_id: userId,
			title,
			thumbnail_path: thumbnail,
			created_at: createdAt,
			updated_at: createdAt,
		});

		if (dbError) throw dbError;

		res.status(201).json({ message: "Drawing created successfully", data });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update a drawing
router.put("/:drawingId", async (req, res) => {
	try {
		const { drawingId } = req.params;
		const { userId, title, imageData } = req.body;

		const filePath = `${userId}/${encodeURIComponent(drawingId)}.png`;
		const buffer = dataURLToBuffer(imageData);

		// Update image in storage
		const { data: storageData, error: storageError } = await supabase.storage
			.from("drawings")
			.update(filePath, buffer, { contentType: "image/png" });

		if (storageError) throw storageError;

		// Get signed URL for updated image
		const { data: signedURLData, error: signedURLError } = await supabase.storage.from("drawings").createSignedUrl(filePath, 60);

		if (signedURLError) throw signedURLError;

		// Update database metadata
		const { data, error: dbError } = await supabase
			.from("drawings")
			.update({
				image_url: signedURLData.signedUrl,
				title,
				thumbnail_url: imageData,
				updated_at: new Date().toISOString(),
			})
			.eq("id", drawingId);

		if (dbError) throw dbError;

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
		const { error: dbError } = await supabase.from("drawings").delete().eq("id", drawingId).eq("user_id", userId);

		if (dbError) throw dbError;

		// Delete from storage
		const { error: storageError } = await supabase.storage.from("drawings").remove([`${userId}/${drawingId}.png`]);

		if (storageError) throw storageError;

		res.json({ message: "Drawing deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
