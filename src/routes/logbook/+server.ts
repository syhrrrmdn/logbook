import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkGoogleDriveStatus, processAndSaveLogbookToDrive } from '$lib/server/google-drive';
import { checkDocxProcessingStatus } from '$lib/server/docx';
import type { ApiResponse } from '$lib/types';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();

		const tanggal = formData.get('tanggal')?.toString().trim();
		const deskripsi = formData.get('deskripsi')?.toString().trim();
		const luaran = formData.get('luaran')?.toString().trim() || '-';
		const dokumentasi = formData.get('dokumentasi') as File | null;

		// 1. Validasi Input Server-Side
		if (!tanggal) {
			return json<ApiResponse>(
				{
					success: false,
					message: 'Tanggal logbook wajib diisi.',
					driveConfigured: false,
					docxConfigured: false
				},
				{ status: 400 }
			);
		}

		if (!deskripsi) {
			return json<ApiResponse>(
				{
					success: false,
					message: 'Deskripsi kegiatan wajib diisi.',
					driveConfigured: false,
					docxConfigured: false
				},
				{ status: 400 }
			);
		}

		let imageBuffer: Buffer | null = null;
		let imageName: string | undefined = undefined;
		let imageSize: number | undefined = undefined;

		if (dokumentasi && dokumentasi.size > 0) {
			if (!ALLOWED_MIME_TYPES.includes(dokumentasi.type)) {
				return json<ApiResponse>(
					{
						success: false,
						message: 'Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.',
						driveConfigured: false,
						docxConfigured: false
					},
					{ status: 400 }
				);
			}

			if (dokumentasi.size > MAX_IMAGE_SIZE_BYTES) {
				return json<ApiResponse>(
					{
						success: false,
						message: 'Ukuran file gambar melebihi batas maksimum 5MB.',
						driveConfigured: false,
						docxConfigured: false
					},
					{ status: 400 }
				);
			}

			const arrayBuffer = await dokumentasi.arrayBuffer();
			imageBuffer = Buffer.from(arrayBuffer);
			imageName = dokumentasi.name;
			imageSize = dokumentasi.size;
		}

		// 2. Periksa Status Layanan Google Drive & Pemrosesan DOCX
		const driveStatus = checkGoogleDriveStatus();
		const docxStatus = checkDocxProcessingStatus();

		if (!driveStatus.configured || !docxStatus.configured) {
			const reasons: string[] = [];
			if (!driveStatus.configured) reasons.push(`Google Drive API: ${driveStatus.statusText} (${driveStatus.details})`);
			if (!docxStatus.configured) reasons.push(`Pemrosesan DOCX: ${docxStatus.statusText} (${docxStatus.details})`);

			return json<ApiResponse>(
				{
					success: false,
					message: 'Integrasi backend belum terhubung secara penuh.',
					details: reasons.join(' | '),
					driveConfigured: driveStatus.configured,
					docxConfigured: docxStatus.configured,
					data: {
						tanggal,
						deskripsi,
						luaran,
						deskripsiLength: deskripsi.length,
						hasImage: Boolean(imageBuffer),
						imageName,
						imageSize
					}
				},
				{ status: 503 }
			);
		}

		// 3. Eksekusi alur otomatisasi penulisan langsung ke Google Drive / Google Docs
		await processAndSaveLogbookToDrive({
			tanggal,
			deskripsi,
			luaran,
			imageBuffer,
			imageMimeType: dokumentasi?.type,
			imageFilename: dokumentasi?.name
		});

		return json<ApiResponse>({
			success: true,
			message: 'Logbook berhasil ditambahkan dan tersimpan langsung di dokumen Google Drive Anda!',
			driveConfigured: true,
			docxConfigured: true,
			data: {
				tanggal,
				deskripsi,
				luaran,
				hasImage: Boolean(imageBuffer),
				imageName
			}
		});
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		return json<ApiResponse>(
			{
				success: false,
				message: 'Terjadi kesalahan saat menyimpan logbook ke Google Drive.',
				details: errorMessage,
				driveConfigured: true,
				docxConfigured: true
			},
			{ status: 500 }
		);
	}
};
