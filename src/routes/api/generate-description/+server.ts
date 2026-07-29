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

async function generateWithFallback(apiKey: string, prompt: string): Promise<{ success: boolean; text?: string; error?: string }> {
	let lastErrorMsg = '';
	for (const model of MODELS) {
		try {
			const response = await callGemini(apiKey, model, prompt);

			// Jika server sibuk (503) atau model tidak ditemukan (404), coba model berikutnya
			if (response.status === 503 || response.status === 404) {
				const errorData = await response.json().catch(() => ({}));
				lastErrorMsg = errorData?.error?.message || `Model ${model} tidak tersedia (${response.status}).`;
				continue;
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

			return { success: true, text: generatedText };
		} catch {
			lastErrorMsg = `Gagal menghubungi model ${model}.`;
			continue;
		}
	}

	return { success: false, error: lastErrorMsg };
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { description, luaran } = await request.json();

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

		// Prompt untuk merapikan Deskripsi Kegiatan
		const promptDeskripsi = `Ubah poin kegiatan magang pendek berikut menjadi kalimat deskripsi kegiatan logbook yang profesional, formal, detail, dan menggunakan bahasa Indonesia yang baik dan benar (PUEBI/EJD). Jangan bertele-tele, cukup 1 sampai 2 kalimat padat yang menjelaskan proses kerja secara formal. Gunakan kata kerja aktif di awal kalimat (seperti: Melakukan, Merancang, Menguji, Memperbaiki, Menganalisis, Menyusun, Mengembangkan, Mengimplementasikan). Jawab HANYA dengan kalimat hasilnya saja tanpa penjelasan tambahan.

Input Kegiatan Pendek: "${description.trim()}"
Output AI:`;

		// Generate deskripsi
		const deskripsiResult = await generateWithFallback(apiKey, promptDeskripsi);
		if (!deskripsiResult.success) {
			return json(
				{ success: false, message: `Semua model AI sedang tidak tersedia. Error: ${deskripsiResult.error}` },
				{ status: 503 }
			);
		}

		// Generate luaran (jika ada input luaran dari user)
		let luaranResult: { success: boolean; text?: string; error?: string } | null = null;
		if (luaran && luaran.trim()) {
			const promptLuaran = `Ubah poin luaran/output kegiatan magang pendek berikut menjadi frasa luaran kegiatan logbook yang profesional, formal, dan menggunakan bahasa Indonesia yang baik dan benar (PUEBI/EJD). Cukup sebutkan hasil/output kerjanya saja dalam bentuk frasa singkat (bukan kalimat panjang), contoh format: "Modul autentikasi pengguna yang terintegrasi dengan sistem", "Dokumen laporan mingguan kegiatan magang", "Halaman antarmuka dashboard admin". Jawab HANYA dengan frasa hasilnya saja tanpa penjelasan tambahan.

Input Luaran Pendek: "${luaran.trim()}"
Output AI:`;

			luaranResult = await generateWithFallback(apiKey, promptLuaran);
		}

		return json({
			success: true,
			text: deskripsiResult.text,
			luaran: luaranResult?.success ? luaranResult.text : null
		});
	} catch (err: unknown) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		return json({ success: false, message: `Terjadi kesalahan: ${errorMsg}` }, { status: 500 });
	}
};
