const LOG_STORAGE_KEY = "app_logs";

export function log(...args) {
	const meta = getCallerInfo();
	const timestamp = new Date().toISOString();

	const message = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ");

	const finalMessage = `[${timestamp}] (${meta.file}:${meta.line}) ${meta.func} → ${message}`;

	// Log to console
	console.log(finalMessage);

	// Save to LocalStorage
	saveLog(finalMessage);
}

function saveLog(message) {
	try {
		const logs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || "[]");
		logs.push(message);
		localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
	} catch (err) {
		console.error("Failed to save log:", err);
	}
}

export function getLogs() {
	try {
		return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || "[]");
	} catch (err) {
		return [];
	}
}

export function clearLogs() {
	localStorage.removeItem(LOG_STORAGE_KEY);
}

function getCallerInfo() {
	const err = new Error();
	const stack = err.stack?.split("\n") || [];
	const callerLine = stack[3] || "";
	return parseStackLine(callerLine);
}

function parseStackLine(line) {
	const chromeRegex = /\s*at\s+(.*)\s+\((.*):(\d+):(\d+)\)/;
	const nodeRegex = /\s*at\s+(.*):(\d+):(\d+)/;
	const firefoxRegex = /(.*)@(.*):(\d+):(\d+)/;

	let match = line.match(chromeRegex) || line.match(firefoxRegex) || line.match(nodeRegex);

	if (!match) {
		return { file: "unknown", line: "?", col: "?", func: "anonymous" };
	}

	if (match.length === 5) {
		return {
			func: match[1] || "anonymous",
			file: match[2],
			line: match[3],
			col: match[4],
		};
	}

	return {
		func: "anonymous",
		file: match[1],
		line: match[2],
		col: match[3],
	};
}
