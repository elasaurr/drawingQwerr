const { createClient } = require("@supabase/supabase-js");

const createAuthenticatedClient = (accessToken) => {
	return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
		global: {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	});
};

const authMiddleware = async (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Missing or invalid authorization header" });
	}

	const token = authHeader.split(" ")[1];

	try {
		// Create authenticated client for this request
		const authenticatedSupabase = createAuthenticatedClient(token);

		// Verify the token and get user
		const {
			data: { user },
			error,
		} = await authenticatedSupabase.auth.getUser();

		if (error || !user) {
			return res.status(401).json({ error: "Invalid or expired token" });
		}

		// Attach to request
		req.user = user;
		req.supabase = authenticatedSupabase;
		next();
	} catch (err) {
		return res.status(401).json({ error: "Authentication failed" });
	}
};

module.exports = { authMiddleware, createAuthenticatedClient };
