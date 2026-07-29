import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// Daftar model yang akan dicoba secara berurutan (dari terbaru ke cadangan)
const MODELS = [
	'gemini-3.6-flash',
	'gemini-3.5-flash-lite',
	'gemini-3.5-flash',
	'gemini-2.0-flash-lite'
];

async function callGemini(apiKey: string, model: string, prompt: string): Promise<Response> {
	return fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }]
			})
		}
	);
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { description } = await request.json();

		if (!description || !description.trim()) {
			return json({ success: false, message: 'Deskripsi tidak boleh kosong.' }, { status: 400 });
		}

		const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
		if (!apiKey) {
			return json(
				{
					success: false,
					message: 'Gemini API Key tidak ditemukan. Silakan tambahkan GEMINI_API_KEY="..." di file .env Anda.'
				},
				{ status: 500 }
			);
		}

		// Prompt untuk merapikan kalimat logbook magang secara formal
		const prompt = `Ubah poin kegiatan magang pendek berikut menjadi kalimat deskripsi kegiatan logbook yang profesional, formal, detail, dan menggunakan bahasa Indonesia yang baik dan benar (PUEBI/EJD). Jangan bertele-tele, cukup 1 sampai 2 kalimat padat yang menjelaskan proses kerja secara formal. Gunakan kata kerja aktif di awal kalimat (seperti: Melakukan, Merancang, Menguji, Memperbaiki, Menganalisis, Menyusun, Mengembangkan, Mengimplementasikan).

Input Kegiatan Pendek: "${description.trim()}"
Output AI:`;

		// Coba setiap model secara berurutan hingga ada yang berhasil
		let lastErrorMsg = '';
		for (const model of MODELS) {
			try {
				const response = await callGemini(apiKey, model, prompt);

				// Jika server sibuk (503) atau model tidak ditemukan (404), coba model berikutnya
				if (response.status === 503 || response.status === 404) {
					const errorData = await response.json().catch(() => ({}));
					lastErrorMsg = errorData?.error?.message || `Model ${model} tidak tersedia (${response.status}).`;
					continue; // Lanjut ke model berikutnya
				}

				// Jika error lain (misalnya 429 quota), tetap coba model berikutnya
				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					lastErrorMsg = errorData?.error?.message || `Gagal memanggil model ${model}.`;
					continue;
				}

				// Berhasil! Parse respons
				const data = await response.json();
				const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

				if (!generatedText) {
					lastErrorMsg = `Model ${model} tidak menghasilkan teks.`;
					continue;
				}

				return json({ success: true, text: generatedText });
			} catch {
				lastErrorMsg = `Gagal menghubungi model ${model}.`;
				continue;
			}
		}

		// Semua model gagal
		return json(
			{
				success: false,
				message: `Semua model AI sedang tidak tersedia. Error terakhir: ${lastErrorMsg}`
			},
			{ status: 503 }
		);
	} catch (err: unknown) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		return json({ success: false, message: `Terjadi kesalahan: ${errorMsg}` }, { status: 500 });
	}
};
