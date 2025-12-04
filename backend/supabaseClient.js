require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
	db: {
		schema: "public",
	},
	auth: {
		persistSession: true,
		autoRefreshToken: true,
	},
	global: {
		headers: {
			Accept: "application/json",
		},
	},
});

module.exports = supabase;
