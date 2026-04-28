export default async function handler(req, res) {
	const { start_at, end_at } = req.query;

	if (!start_at || !end_at) {
		return res.status(400).json({ error: "Missing start_at or end_at" });
	}

	const API_KEY = process.env.RAINBET_API_KEY;

	const url = `https://services.rainbet.com/v1/external/affiliates?start_at=${start_at}&end_at=${end_at}&key=${API_KEY}`;

	try {
		const response = await fetch(url);
		const data = await response.json();

		if (!response.ok) {
			return res
				.status(response.status)
				.json({ error: data.message || "Rainbet API error" });
		}

		res.status(200).json(data);
	} catch (error) {
		console.error("API fetch error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}
