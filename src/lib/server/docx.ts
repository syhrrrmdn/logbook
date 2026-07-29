import type { DocxStatusResult } from '$lib/types';

export interface LogbookEntryPayload {
	tanggal: string;
	deskripsi: string;
	luaran: string;
	imageBuffer?: Buffer | null;
	imageMimeType?: string | null;
	imageFilename?: string | null;
}

/**
 * Memeriksa status abstraksi pemrosesan DOCX.
 */
export function checkDocxProcessingStatus(): DocxStatusResult {
	return {
		configured: true,
		statusText: 'Aktif & Siap Memproses',
		details: 'Struktur tabel terkonfigurasi (No [Otomatis], Tanggal, Deskripsi Kegiatan, Luaran Kegiatan, Bukti Kegiatan).'
	};
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Mendapatkan ekstensi file dari MIME type gambar.
 */
function getImageExtension(mimeType: string): string {
	const map: Record<string, string> = {
		'image/jpeg': 'jpeg',
		'image/jpg': 'jpeg',
		'image/png': 'png',
		'image/gif': 'gif',
		'image/webp': 'webp'
	};
	return map[mimeType] || 'png';
}

/**
 * Memastikan Content_Types.xml memiliki entry untuk tipe gambar yang digunakan.
 */
function ensureContentType(zip: any, extension: string): void {
	const contentTypesPath = '[Content_Types].xml';
	let contentTypes = zip.file(contentTypesPath)?.asText();
	if (!contentTypes) return;

	const extLower = extension.toLowerCase();
	if (contentTypes.includes(`Extension="${extLower}"`)) return;

	const mimeMap: Record<string, string> = {
		'png': 'image/png',
		'jpeg': 'image/jpeg',
		'jpg': 'image/jpeg',
		'gif': 'image/gif',
		'webp': 'image/webp'
	};

	const mime = mimeMap[extLower] || `image/${extLower}`;
	const newDefault = `<Default Extension="${extLower}" ContentType="${mime}"/>`;

	contentTypes = contentTypes.replace('</Types>', `${newDefault}</Types>`);
	zip.file(contentTypesPath, contentTypes);
}

/**
 * Menambahkan relationship gambar ke word/_rels/document.xml.rels
 */
function addImageRelationship(zip: any, mediaFileName: string): string {
	const relsPath = 'word/_rels/document.xml.rels';
	let relsContent = zip.file(relsPath)?.asText();

	if (!relsContent) {
		relsContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
			'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
			'</Relationships>';
	}

	const rIdMatches = relsContent.match(/Id="rId(\d+)"/g) || [];
	let maxId = 0;
	for (const match of rIdMatches) {
		const num = parseInt(match.replace(/[^0-9]/g, ''), 10);
		if (num > maxId) maxId = num;
	}
	const newRId = `rId${maxId + 1}`;

	const newRel = `<Relationship Id="${newRId}" ` +
		`Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" ` +
		`Target="media/${mediaFileName}"/>`;

	relsContent = relsContent.replace('</Relationships>', `${newRel}</Relationships>`);
	zip.file(relsPath, relsContent);

	return newRId;
}

/**
 * Memastikan namespace yang dibutuhkan untuk drawing sudah ada di root element document.xml.
 */
function ensureDrawingNamespaces(xmlContent: string): string {
	const requiredNamespaces: Record<string, string> = {
		'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
		'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
		'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
		'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
	};

	const docTagMatch = xmlContent.match(/<w:document[^>]*>/);
	if (!docTagMatch) return xmlContent;

	let docTag = docTagMatch[0];
	let modified = false;

	for (const [prefix, uri] of Object.entries(requiredNamespaces)) {
		if (!docTag.includes(prefix + '=')) {
			docTag = docTag.replace('>', ` ${prefix}="${uri}">`);
			modified = true;
		}
	}

	if (modified) {
		xmlContent = xmlContent.replace(docTagMatch[0], docTag);
	}

	return xmlContent;
}

/**
 * Membuat XML untuk gambar inline dalam sel tabel Word.
 */
function createImageDrawingXml(rId: string, imageNo: number, widthEmu: number, heightEmu: number): string {
	return `<w:drawing>` +
		`<wp:inline distT="0" distB="0" distL="0" distR="0">` +
		`<wp:extent cx="${widthEmu}" cy="${heightEmu}"/>` +
		`<wp:docPr id="${imageNo}" name="Bukti_${imageNo}"/>` +
		`<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
		`<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
		`<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
		`<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
		`<pic:nvPicPr>` +
		`<pic:cNvPr id="${imageNo}" name="Bukti_${imageNo}"/>` +
		`<pic:cNvPicPr/>` +
		`</pic:nvPicPr>` +
		`<pic:blipFill>` +
		`<a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>` +
		`<a:stretch><a:fillRect/></a:stretch>` +
		`</pic:blipFill>` +
		`<pic:spPr>` +
		`<a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm>` +
		`<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
		`</pic:spPr>` +
		`</pic:pic>` +
		`</a:graphicData>` +
		`</a:graphic>` +
		`</wp:inline>` +
		`</w:drawing>`;
}

/**
 * Mendapatkan isi teks dari dalam sel XML <w:tc>
 */
function getCellText(cellXml: string): string {
	const tMatches = cellXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
	let text = '';
	for (const t of tMatches) {
		const contentMatch = t.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/);
		if (contentMatch) {
			text += contentMatch[1].trim();
		}
	}
	return text;
}

/**
 * Memasukkan teks baru ke dalam sel XML <w:tc> dengan mempertahankan properti paragraf dan run asli
 * serta secara otomatis menghapus formatting bold agar teks hasil input berukuran normal.
 */
function fillCellText(cellXml: string, text: string): string {
	const pMatch = cellXml.match(/<w:p[\s>][\s\S]*?<\/w:p>/);
	if (!pMatch) return cellXml;

	const pXml = pMatch[0];
	const pPrMatch = pXml.match(/<w:pPr[\s>][\s\S]*?<\/w:pPr>/);
	const pPr = pPrMatch ? pPrMatch[0] : '';

	// Dapatkan run properties asli (rPr) untuk mempertahankan warna, ukuran, dan font asli template
	const rPrMatch = pXml.match(/<w:rPr[\s>][\s\S]*?<\/w:rPr>/);
	let rPr = rPrMatch ? rPrMatch[0] : '<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>';

	// Hapus tag bold (<w:b/> atau <w:b w:val="..."/>) dari properti teks
	rPr = rPr.replace(/<w:b\s*\/?>/g, '').replace(/<w:b\s+[^>]*\s*\/?>/g, '');

	const newPXml = `<w:p>${pPr}<w:r>${rPr}<w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
	return cellXml.replace(pXml, newPXml);
}

/**
 * Memasukkan gambar/drawing ke dalam sel XML <w:tc> dengan mempertahankan properti sel asli
 */
function fillCellDrawing(cellXml: string, drawingXml: string): string {
	const pMatch = cellXml.match(/<w:p[\s>][\s\S]*?<\/w:p>/);
	if (!pMatch) return cellXml;

	const pXml = pMatch[0];
	const pPrMatch = pXml.match(/<w:pPr[\s>][\s\S]*?<\/w:pPr>/);
	const pPr = pPrMatch ? pPrMatch[0] : '';

	const newPXml = `<w:p>${pPr}<w:r>${drawingXml}</w:r></w:p>`;
	return cellXml.replace(pXml, newPXml);
}

/**
 * Menghapus shading (warna latar belakang) dari sel agar menjadi putih/transparan
 */
function stripCellShading(cellXml: string): string {
	const tcPrMatch = cellXml.match(/<w:tcPr[\s>][\s\S]*?<\/w:tcPr>/);
	if (!tcPrMatch) return cellXml;

	let tcPr = tcPrMatch[0];
	// Hapus tag shading jika ada
	tcPr = tcPr.replace(/<w:shd[\s\S]*?\/>/g, '');
	
	return cellXml.replace(tcPrMatch[0], tcPr);
}

/**
 * Mengisi struktur baris XML model dengan data logbook baru
 */
function cloneAndFillRow(
	modelRowXml: string,
	no: string,
	entry: LogbookEntryPayload,
	drawingXml?: string,
	shouldStripShading = false
): string {
	const trPrMatch = modelRowXml.match(/<w:trPr[\s>][\s\S]*?<\/w:trPr>/);
	const trPr = trPrMatch ? trPrMatch[0] : '';

	const cells = modelRowXml.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
	if (cells.length < 5) {
		return modelRowXml;
	}

	let cell0 = fillCellText(cells[0], no);
	let cell1 = fillCellText(cells[1], entry.tanggal);
	let cell2 = fillCellText(cells[2], entry.deskripsi);
	let cell3 = fillCellText(cells[3], entry.luaran);
	
	let cell4 = '';
	if (drawingXml) {
		cell4 = fillCellDrawing(cells[4], drawingXml);
	} else {
		cell4 = fillCellText(cells[4], '-');
	}

	if (shouldStripShading) {
		cell0 = stripCellShading(cell0);
		cell1 = stripCellShading(cell1);
		cell2 = stripCellShading(cell2);
		cell3 = stripCellShading(cell3);
		cell4 = stripCellShading(cell4);
	}

	return `<w:tr>${trPr}${cell0}${cell1}${cell2}${cell3}${cell4}</w:tr>`;
}

/**
 * Memproses file DOCX di memori.
 * Membuka word/document.xml, mendeteksi jika ada baris kosong di template untuk diisi,
 * atau menambahkan baris baru di akhir jika semua baris template sudah terisi.
 */
export async function appendLogbookToDocx(
	docxBuffer: Buffer,
	entry: LogbookEntryPayload
): Promise<Buffer> {
	try {
		const PizZip = (await import('pizzip')).default;
		const zip = new PizZip(docxBuffer);

		let documentXmlContent = zip.file('word/document.xml')?.asText();
		if (!documentXmlContent) {
			throw new Error('Format file .docx tidak valid (word/document.xml tidak ditemukan).');
		}

		// Cari semua baris tabel yang ada
		const allRows = documentXmlContent.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
		
		let dataRowCount = 0;
		let firstEmptyRowIndex = -1;
		let preservedNo = '';
		let emptyRowXml = '';

		// Hitung baris data (baris dengan 5 kolom)
		for (let i = 0; i < allRows.length; i++) {
			const rowXml = allRows[i];
			const cells = rowXml.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];

			if (cells.length === 5) {
				dataRowCount++;

				// Cek apakah kolom 2 (Tanggal), 3 (Deskripsi), dan 4 (Luaran) kosong
				const cell1Text = getCellText(cells[1]);
				const cell2Text = getCellText(cells[2]);
				const cell3Text = getCellText(cells[3]);

				if (!cell1Text && !cell2Text && !cell3Text && firstEmptyRowIndex === -1) {
					firstEmptyRowIndex = i;
					emptyRowXml = rowXml;
					// Ambil No yang sudah ada di kolom 1 jika ada
					const cell0Text = getCellText(cells[0]);
					preservedNo = cell0Text;
				}
			}
		}

		// Tentukan nomor untuk baris ini
		const finalNo = preservedNo || String(dataRowCount);

		// --- Siapkan drawing gambar jika ada ---
		let drawingXml = '';
		if (entry.imageBuffer && entry.imageMimeType && entry.imageFilename) {
			const ext = getImageExtension(entry.imageMimeType);
			const mediaFileName = `logbook_bukti_${finalNo}_${Date.now()}.${ext}`;

			zip.file(`word/media/${mediaFileName}`, entry.imageBuffer);
			ensureContentType(zip, ext);
			const rId = addImageRelationship(zip, mediaFileName);
			documentXmlContent = ensureDrawingNamespaces(documentXmlContent);

			const widthEmu = 1440000;  // ~4cm
			const heightEmu = 1080000; // ~3cm
			drawingXml = createImageDrawingXml(rId, Number(finalNo) || 1, widthEmu, heightEmu);
		}

		// Cari model baris dari template asli untuk menduplikasi properties sel & tabel
		const modelRowXml = emptyRowXml || allRows[allRows.length - 1];
		if (!modelRowXml) {
			throw new Error('Tidak dapat menemukan baris template untuk diduplikasi.');
		}

		// Buat baris baru yang mempertahankan format asli dengan membersihkan shading (warna latar belakang)
		const newRowXml = cloneAndFillRow(modelRowXml, finalNo, entry, drawingXml || undefined, true);

		let updatedXml = '';
		if (firstEmptyRowIndex !== -1 && emptyRowXml) {
			// Skenario 1: Mengisi baris kosong yang sudah tersedia di template
			console.log(`[DOCX] Mengisi baris kosong template di baris data ke-${dataRowCount}. No: ${finalNo}`);
			updatedXml = documentXmlContent.replace(emptyRowXml, newRowXml);
		} else {
			// Skenario 2: Menambahkan baris baru ke akhir tabel
			console.log(`[DOCX] Menambahkan baris baru ke tabel logbook. No: ${finalNo}`);
			const lastTblEndIndex = documentXmlContent.lastIndexOf('</w:tbl>');
			if (lastTblEndIndex === -1) {
				throw new Error('Tabel logbook tidak ditemukan di dalam dokumen Word.');
			}
			updatedXml =
				documentXmlContent.slice(0, lastTblEndIndex) +
				newRowXml +
				documentXmlContent.slice(lastTblEndIndex);
		}

		zip.file('word/document.xml', updatedXml);
		const updatedBuffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
		return updatedBuffer;
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		throw new Error(`Gagal memproses file DOCX: ${errorMessage}`);
	}
}
