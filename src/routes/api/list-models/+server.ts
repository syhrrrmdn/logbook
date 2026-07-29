import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	try {
		const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
		if (!apiKey) {
			return json({ success: false, message: 'API Key tidak ditemukan di Vercel.' });
		}

		// Keamanan: Cukup tampilkan 6 karakter pertama untuk verifikasi format (AIzaSy vs AQ.)
		const maskedKey = apiKey.length > 6 ? `${apiKey.substring(0, 6)}...` : 'Terlalu pendek';

		// Hubungi ListModels
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
		);

		const data = await response.json();

		return json({
			success: response.ok,
			statusCode: response.status,
			keyUsedPrefix: maskedKey,
			data: data
		});
	} catch (err: unknown) {
		return json({
			success: false,
			message: err instanceof Error ? err.message : String(err)
		});
	}
};
