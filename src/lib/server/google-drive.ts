import { env } from '$env/dynamic/private';
import type { DriveStatusResult } from '$lib/types';
import { appendLogbookToDocx, type LogbookEntryPayload } from '$lib/server/docx';

/**
 * Memeriksa status konfigurasi Google Drive API berdasarkan Environment Variables.
 */
export function checkGoogleDriveStatus(): DriveStatusResult {
	const fileId = env.GOOGLE_DRIVE_FILE_ID || process.env.GOOGLE_DRIVE_FILE_ID || '';
	const clientEmail = env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || '';
	const privateKey = env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '';

	const clientEmailConfigured = Boolean(clientEmail && clientEmail.trim().length > 0);
	const privateKeyConfigured = Boolean(privateKey && privateKey.trim().length > 0);
	const fileIdConfigured = Boolean(fileId && fileId.trim().length > 0);

	const configured = clientEmailConfigured && privateKeyConfigured && fileIdConfigured;

	let maskedFileId: string | null = null;
	if (fileIdConfigured) {
		maskedFileId = fileId.length > 8 
			? `${fileId.slice(0, 4)}...${fileId.slice(-4)}` 
			: fileId;
	}

	if (!configured) {
		const missing: string[] = [];
		if (!fileIdConfigured) missing.push('GOOGLE_DRIVE_FILE_ID');
		if (!clientEmailConfigured) missing.push('GOOGLE_CLIENT_EMAIL');
		if (!privateKeyConfigured) missing.push('GOOGLE_PRIVATE_KEY');

		return {
			configured: false,
			fileId: maskedFileId,
			clientEmailConfigured,
			privateKeyConfigured,
			statusText: 'Belum terhubung',
			details: `Variable belum dikonfigurasi: ${missing.join(', ')}.`
		};
	}

	return {
		configured: true,
		fileId: maskedFileId,
		clientEmailConfigured: true,
		privateKeyConfigured: true,
		statusText: 'Terdefinisi (Siap dihubungkan)',
		details: 'Environment Variables untuk Google Drive API telah diisi.'
	};
}

/**
 * Upload gambar sementara ke Google Drive, kembalikan URL publik untuk dipakai insertInlineImage.
 * Setelah gambar disisipkan, file sementara ini akan dihapus.
 */
async function uploadTempImage(
	drive: any,
	imageBuffer: Buffer,
	imageMimeType: string,
	imageFilename: string
): Promise<{ tempFileId: string; imageUrl: string }> {
	const { Readable } = await import('stream');

	const stream = new Readable();
	stream.push(imageBuffer);
	stream.push(null);

	// Upload gambar ke Google Drive sebagai file sementara
	const uploadRes = await drive.files.create({
		requestBody: {
			name: `_temp_logbook_${Date.now()}_${imageFilename}`,
			mimeType: imageMimeType
		},
		media: {
			mimeType: imageMimeType,
			body: stream
		},
		fields: 'id'
	});

	const tempFileId = uploadRes.data.id;

	// Jadikan file bisa diakses oleh siapa saja dengan link (read-only)
	await drive.permissions.create({
		fileId: tempFileId,
		requestBody: {
			role: 'reader',
			type: 'anyone'
		}
	});

	// URL publik yang bisa dipakai oleh Google Docs API insertInlineImage
	const imageUrl = `https://drive.google.com/uc?id=${tempFileId}`;

	return { tempFileId, imageUrl };
}

/**
 * Hapus file sementara dari Google Drive.
 */
async function deleteTempFile(drive: any, tempFileId: string): Promise<void> {
	try {
		await drive.files.delete({ fileId: tempFileId });
	} catch {
		// Tidak fatal jika gagal dihapus, abaikan saja
		console.warn(`[Cleanup] Gagal menghapus file sementara: ${tempFileId}`);
	}
}

/**
 * Memproses dan menyisipkan data logbook langsung ke Google Drive / Google Docs document.
 * Otomatis mendeteksi tipe file (Google Docs native vs File .docx asli di Drive).
 */
export async function processAndSaveLogbookToDrive(entry: LogbookEntryPayload, targetFileId?: string): Promise<boolean> {
	const status = checkGoogleDriveStatus();
	if (!status.configured) {
		throw new Error(`Google Drive API belum terhubung: ${status.details}`);
	}

	const fileId = targetFileId || env.GOOGLE_DRIVE_FILE_ID || process.env.GOOGLE_DRIVE_FILE_ID;
	const clientEmail = env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || '';
	const privateKey = (env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

	if (!fileId) {
		throw new Error('ID file Google Drive belum ditentukan.');
	}

	const { google } = await import('googleapis');
	const { Readable } = await import('stream');

	const auth = new google.auth.JWT({
		email: clientEmail,
		key: privateKey,
		scopes: [
			'https://www.googleapis.com/auth/drive',
			'https://www.googleapis.com/auth/documents'
		]
	});

	const drive = google.drive({ version: 'v3', auth });

	try {
		// Cek metadata tipe file (tambahkan no-cache untuk menghindari CDN/API cache)
		const meta = await drive.files.get({
			fileId,
			fields: 'id, name, mimeType'
		}, {
			headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
		});
		const isGoogleDoc = meta.data.mimeType === 'application/vnd.google-apps.document';

		if (isGoogleDoc) {
			// =============================================
			// Skenario A: Google Docs Native Document
			// =============================================
			const docs = google.docs({ version: 'v1', auth });
			const doc = await docs.documents.get({ documentId: fileId });

			// Cari elemen tabel di dalam struktur dokumen
			const bodyContent = doc.data.body?.content || [];
			let tableElement: any = null;
			let tableStartIndex = 0;

			for (const element of bodyContent) {
				if (element.table) {
					tableElement = element.table;
					tableStartIndex = element.startIndex || 0;
					break;
				}
			}

			if (!tableElement) {
				throw new Error('Tabel logbook tidak ditemukan di dalam Google Docs.');
			}

			const tableRows = tableElement.tableRows || [];
			const numRows = tableRows.length;
			// Hitung nomor otomatis (abaikan baris header: Judul, Nama, NIM, Header Kolom = ~4 baris)
			const calculatedNo = Math.max(1, numRows > 3 ? numRows - 3 : 1);

			// ---- STEP 1: Sisipkan baris tabel baru ----
			await docs.documents.batchUpdate({
				documentId: fileId,
				requestBody: {
					requests: [
						{
							insertTableRow: {
								tableCellLocation: {
									tableStartIndex,
									rowIndex: Math.max(0, numRows - 1),
									columnIndex: 0
								},
								insertBelow: true
							}
						}
					]
				}
			});

			// ---- STEP 2: Re-fetch dokumen untuk posisi cell baru ----
			const updatedDoc = await docs.documents.get({ documentId: fileId });
			const updatedBody = updatedDoc.data.body?.content || [];
			let updatedTable: any = null;

			for (const element of updatedBody) {
				if (element.table) {
					updatedTable = element.table;
					break;
				}
			}

			if (!updatedTable || !updatedTable.tableRows) {
				throw new Error('Gagal mendapatkan tabel setelah penyisipan baris baru.');
			}

			const lastRow = updatedTable.tableRows[updatedTable.tableRows.length - 1];
			const cells = lastRow.tableCells || [];

			// ---- STEP 3: Isi teks ke 4 kolom pertama (No, Tanggal, Deskripsi, Luaran) ----
			// Dieksekusi terbalik (dari kolom terakhir ke pertama) agar indeks tidak bergeser
			const cellTexts = [
				String(calculatedNo),
				entry.tanggal,
				entry.deskripsi,
				entry.luaran
			];

			const textInsertRequests: any[] = [];

			// Kolom ke-4 (Luaran) hingga kolom ke-0 (No)
			for (let i = Math.min(cells.length - 1, 3); i >= 0; i--) {
				const cell = cells[i];
				const text = cellTexts[i] || '';
				if (cell && cell.startIndex !== undefined && text) {
					textInsertRequests.push({
						insertText: {
							location: { index: cell.startIndex + 1 },
							text
						}
					});
				}
			}

			if (textInsertRequests.length > 0) {
				await docs.documents.batchUpdate({
					documentId: fileId,
					requestBody: { requests: textInsertRequests }
				});
			}

			// ---- STEP 4: Sisipkan gambar asli ke kolom Bukti Kegiatan (kolom ke-5) ----
			if (entry.imageBuffer && entry.imageMimeType && entry.imageFilename && cells.length >= 5) {
				// Upload gambar sementara ke Drive
				const { tempFileId, imageUrl } = await uploadTempImage(
					drive,
					entry.imageBuffer,
					entry.imageMimeType,
					entry.imageFilename
				);

				try {
					// Re-fetch lagi untuk mendapatkan indeks terbaru setelah teks dimasukkan
					const refreshedDoc = await docs.documents.get({ documentId: fileId });
					const refreshedBody = refreshedDoc.data.body?.content || [];
					let refreshedTable: any = null;

					for (const element of refreshedBody) {
						if (element.table) {
							refreshedTable = element.table;
							break;
						}
					}

					if (refreshedTable && refreshedTable.tableRows) {
						const refreshedLastRow = refreshedTable.tableRows[refreshedTable.tableRows.length - 1];
						const refreshedCells = refreshedLastRow.tableCells || [];

						if (refreshedCells.length >= 5) {
							const buktiCell = refreshedCells[4];
							const insertIndex = buktiCell.startIndex + 1;

							await docs.documents.batchUpdate({
								documentId: fileId,
								requestBody: {
									requests: [
										{
											insertInlineImage: {
												location: { index: insertIndex },
												uri: imageUrl,
												objectSize: {
													width: { magnitude: 120, unit: 'PT' },
													height: { magnitude: 90, unit: 'PT' }
												}
											}
										}
									]
								}
							});
						}
					}
				} finally {
					// Bersihkan file sementara dari Drive
					await deleteTempFile(drive, tempFileId);
				}
			} else if (cells.length >= 5) {
				// Tidak ada gambar, tulis tanda strip "-"
				const refreshedDoc2 = await docs.documents.get({ documentId: fileId });
				const refreshedBody2 = refreshedDoc2.data.body?.content || [];
				let refreshedTable2: any = null;

				for (const element of refreshedBody2) {
					if (element.table) {
						refreshedTable2 = element.table;
						break;
					}
				}

				if (refreshedTable2 && refreshedTable2.tableRows) {
					const lastRow2 = refreshedTable2.tableRows[refreshedTable2.tableRows.length - 1];
					const cells2 = lastRow2.tableCells || [];
					if (cells2.length >= 5) {
						const buktiCell = cells2[4];
						await docs.documents.batchUpdate({
							documentId: fileId,
							requestBody: {
								requests: [
									{
										insertText: {
											location: { index: buktiCell.startIndex + 1 },
											text: '-'
										}
									}
								]
							}
						});
					}
				}
			}

			return true;
		} else {
			// =============================================
			// Skenario B: File Microsoft Word .docx asli
			// =============================================
			const downloadRes = await drive.files.get(
				{ fileId, alt: 'media' },
				{ 
					responseType: 'arraybuffer',
					headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
				}
			);
			const originalBuffer = Buffer.from(downloadRes.data as ArrayBuffer);

			// Edit buffer .docx di memori
			const updatedBuffer = await appendLogbookToDocx(originalBuffer, entry);

			const stream = new Readable();
			stream.push(updatedBuffer);
			stream.push(null);

			await drive.files.update({
				fileId,
				media: {
					mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					body: stream
				}
			});

			return true;
		}
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);

		if (errorMessage.includes('File not found') || errorMessage.includes('404')) {
			throw new Error(
				`File tidak ditemukan (File not found: ${fileId}). Pastikan dokumen di Google Drive sudah di-share (Bagikan) ke email Service Account (${clientEmail}) dengan hak akses Editor!`
			);
		}

		throw new Error(`Gagal memperbarui file di Google Drive: ${errorMessage}`);
	}
}
