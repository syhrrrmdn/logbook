import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

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

		// Panggil Gemini API v1beta via fetch
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: prompt
								}
							]
						}
					]
				})
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMsg = errorData?.error?.message || 'Gagal menghubungi API Gemini.';
			return json({ success: false, message: `Error Gemini API: ${errorMsg}` }, { status: response.status });
		}

		const data = await response.json();
		const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

		if (!generatedText) {
			return json({ success: false, message: 'AI tidak menghasilkan teks.' }, { status: 500 });
		}

		return json({ success: true, text: generatedText });
	} catch (err: unknown) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		return json({ success: false, message: `Terjadi kesalahan: ${errorMsg}` }, { status: 500 });
	}
};
