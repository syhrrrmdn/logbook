<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { 
		Calendar, 
		FileText, 
		AlignLeft, 
		Image as ImageIcon, 
		Upload, 
		X, 
		Send, 
		Loader2, 
		ArrowLeft,
		CheckCircle2,
		AlertTriangle,
		Info,
		ShieldAlert,
		Sparkles,
		Layers
	} from 'lucide-svelte';
	import type { ApiResponse } from '$lib/types';

	// Fungsi untuk mendapatkan tanggal hari ini dalam format DD-MM-YYYY waktu lokal
	const getLocalDateString = () => {
		const d = new Date();
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		return `${day}-${month}-${d.getFullYear()}`;
	};

	// State menggunakan Svelte 5 Runes ($state)
	let tanggal = $state(getLocalDateString());
	let deskripsi = $state('');
	let luaran = $state('');
	
	let selectedFile = $state<File | null>(null);
	let imagePreviewUrl = $state<string | null>(null);
	
	let isSubmitting = $state(false);
	let isGeneratingDescription = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let serverResponse = $state<ApiResponse | null>(null);

	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

	async function generateDescriptionWithAI() {
		if (!deskripsi.trim()) {
			toast.warning('Teks Kosong', 'Silakan ketik beberapa kata deskripsi terlebih dahulu.');
			return;
		}

		isGeneratingDescription = true;
		try {
			const res = await fetch('/api/generate-description', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ description: deskripsi, luaran: luaran })
			});

			const data = await res.json();
			if (data.success && data.text) {
				deskripsi = data.text;
				if (data.luaran) {
					luaran = data.luaran;
				}
				toast.success('Penyempurnaan AI Berhasil', 'Deskripsi & Luaran disempurnakan. Anda masih bisa mengeditnya sebelum dikirim.');
			} else {
				toast.error('AI Gagal Merapikan', data.message || 'Terjadi kesalahan.');
			}
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungkan ke server.';
			toast.error('Kesalahan Jaringan', errorMsg);
		} finally {
			isGeneratingDescription = false;
		}
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			processFile(input.files[0]);
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
			processFile(event.dataTransfer.files[0]);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function processFile(file: File) {
		delete fieldErrors.dokumentasi;

		if (!ALLOWED_TYPES.includes(file.type)) {
			const err = 'File harus berupa gambar (JPG, PNG, WEBP, atau GIF).';
			fieldErrors = { ...fieldErrors, dokumentasi: err };
			toast.error('File Tidak Valid', err);
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			const err = `Ukuran file (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas 5 MB.`;
			fieldErrors = { ...fieldErrors, dokumentasi: err };
			toast.error('Ukuran File Terlalu Besar', err);
			return;
		}

		selectedFile = file;
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
		}
		imagePreviewUrl = URL.createObjectURL(file);
		toast.info('Bukti Kegiatan Dimuat', `Gambar "${file.name}" siap disisipkan ke kolom Bukti Kegiatan.`);
	}

	function removeSelectedImage() {
		selectedFile = null;
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
			imagePreviewUrl = null;
		}
	}

	function validateForm(): boolean {
		const errors: Record<string, string> = {};

		if (!tanggal.trim()) {
			errors.tanggal = 'Tanggal/Rentang logbook wajib diisi.';
		}

		if (!deskripsi.trim()) {
			errors.deskripsi = 'Deskripsi kegiatan wajib diisi.';
		} else if (deskripsi.trim().length < 5) {
			errors.deskripsi = 'Deskripsi kegiatan minimal 5 karakter.';
		}

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		serverResponse = null;

		if (!validateForm()) {
			toast.warning('Form Belum Lengkap', 'Silakan periksa kembali field input yang wajib diisi.');
			return;
		}

		isSubmitting = true;

		try {
			const formData = new FormData();
			formData.append('tanggal', tanggal);
			formData.append('deskripsi', deskripsi);
			formData.append('luaran', luaran);
			
			if (selectedFile) {
				formData.append('dokumentasi', selectedFile);
			}

			const res = await fetch('/logbook', {
				method: 'POST',
				body: formData
			});

			const data: ApiResponse = await res.json();
			serverResponse = data;

			if (data.success) {
				toast.success('Berhasil!', data.message);
				// Reset form
				deskripsi = '';
				luaran = '';
				removeSelectedImage();
			} else {
				if (res.status === 503 || !data.driveConfigured || !data.docxConfigured) {
					toast.warning(
						'Status Integrasi System', 
						data.message + ' (Cek konfigurasi Google Drive di bawah).'
					);
				} else {
					toast.error('Gagal Memproses Data', data.message);
				}
			}
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungkan ke server.';
			toast.error('Kesalahan Jaringan', errorMsg);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Input Logbook Magang Mandiri | Otomatisasi Google Drive</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
	<!-- Top Navigation Back Button -->
	<div class="flex items-center justify-between">
		<a
			href="/"
			class="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
		>
			<ArrowLeft class="w-4 h-4" />
			<span>Kembali ke Dashboard</span>
		</a>

		<span class="text-xs text-slate-500 font-mono flex items-center gap-1.5">
			<Sparkles class="w-3.5 h-3.5 text-indigo-400" />
			<span>Format Tabel Magang Mandiri</span>
		</span>
	</div>

	<!-- Main Form Card -->
	<div class="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
		<div class="border-b border-slate-800 pb-5 space-y-2">
			<div class="flex items-center justify-between flex-wrap gap-2">
				<h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
					<FileText class="w-7 h-7 text-indigo-400" />
					<span>Form Logbook Kegiatan</span>
				</h1>

				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
					<Sparkles class="w-3.5 h-3.5" />
					<span>No. Otomatisasi (Auto-Index)</span>
				</span>
			</div>
			<p class="text-xs sm:text-sm text-slate-400">
				Isi data tanggal, deskripsi, luaran, dan foto bukti. Nomor urut logbook (No) akan dibuat secara otomatis di tabel dokumen Word.
			</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Info Banner Auto-No -->
			<div class="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200">
				<Info class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
				<div>
					<strong class="text-white block font-semibold">Otomatisasi Kolom Nomor (No)</strong>
					<span>Kolom <b>No</b> pada tabel Word diisi otomatis oleh sistem sesuai urutan baris kegiatan yang sudah ada.</span>
				</div>
			</div>

			<!-- 1. Tanggal -->
			<div class="space-y-2">
				<label for="tanggal" class="flex items-center gap-2 text-sm font-semibold text-slate-200">
					<Calendar class="w-4 h-4 text-indigo-400" />
					<span>Tanggal / Rentang Tanggal <span class="text-rose-400">*</span></span>
				</label>
				<input
					type="text"
					id="tanggal"
					placeholder="Contoh: 30-07-2026 atau 01-01-2026 - 05-01-2026"
					bind:value={tanggal}
					disabled={isSubmitting}
					class="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
				/>
				{#if fieldErrors.tanggal}
					<p class="text-xs text-rose-400 flex items-center gap-1 mt-1">
						<AlertTriangle class="w-3.5 h-3.5" />
						<span>{fieldErrors.tanggal}</span>
					</p>
				{/if}
			</div>

			<!-- 2. Deskripsi Kegiatan -->
			<div class="space-y-2">
				<label for="deskripsi" class="flex items-center justify-between text-sm font-semibold text-slate-200">
					<span class="flex items-center gap-2">
						<AlignLeft class="w-4 h-4 text-indigo-400" />
						<span>Deskripsi Kegiatan <span class="text-rose-400">*</span></span>
					</span>
					<span class="text-[11px] font-normal text-slate-400">{deskripsi.length} karakter</span>
				</label>
				<textarea
					id="deskripsi"
					rows="4"
					placeholder="Cukup ketik kata kunci singkat, misal: bikin login supabase"
					bind:value={deskripsi}
					disabled={isSubmitting || isGeneratingDescription}
					class="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50 resize-y"
				></textarea>
				{#if fieldErrors.deskripsi}
					<p class="text-xs text-rose-400 flex items-center gap-1 mt-1">
						<AlertTriangle class="w-3.5 h-3.5" />
						<span>{fieldErrors.deskripsi}</span>
					</p>
				{/if}
			</div>

			<!-- 3. Luaran Kegiatan -->
			<div class="space-y-2">
				<label for="luaran" class="flex items-center justify-between text-sm font-semibold text-slate-200">
					<span class="flex items-center gap-2">
						<Layers class="w-4 h-4 text-indigo-400" />
						<span>Luaran Kegiatan</span>
					</span>
					<span class="text-[11px] text-slate-400 font-normal">Hasil / Output kegiatan</span>
				</label>
				<input
					type="text"
					id="luaran"
					placeholder="Cukup ketik kata kunci singkat, misal: halaman login"
					bind:value={luaran}
					disabled={isSubmitting || isGeneratingDescription}
					class="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
				/>
			</div>

			<!-- Tombol Sempurnakan dengan AI -->
			<button
				type="button"
				onclick={generateDescriptionWithAI}
				disabled={isSubmitting || isGeneratingDescription || !deskripsi.trim()}
				class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/15 to-violet-500/15 hover:from-indigo-500/25 hover:to-violet-500/25 border border-indigo-500/30 text-indigo-300 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
			>
				{#if isGeneratingDescription}
					<Loader2 class="w-4 h-4 animate-spin" />
					<span>Menyempurnakan Deskripsi & Luaran...</span>
				{:else}
					<Sparkles class="w-4 h-4 text-indigo-400" />
					<span>Sempurnakan Deskripsi & Luaran dengan AI ✨</span>
				{/if}
			</button>

			<!-- 4. Bukti Kegiatan (Dokumentasi Foto) -->
			<div class="space-y-2">
				<label class="flex items-center gap-2 text-sm font-semibold text-slate-200">
					<ImageIcon class="w-4 h-4 text-indigo-400" />
					<span>Bukti Kegiatan (Foto / Gambar Dokumentasi)</span>
				</label>

				{#if selectedFile && imagePreviewUrl}
					<!-- Image Preview Card -->
					<div class="relative p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
						<div class="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center">
							<img
								src={imagePreviewUrl}
								alt="Preview Bukti Kegiatan"
								class="w-full h-full object-cover"
							/>
						</div>

						<div class="flex-1 space-y-1 text-xs w-full">
							<div class="flex items-center justify-between">
								<span class="font-semibold text-slate-200 truncate max-w-[200px]" title={selectedFile.name}>
									{selectedFile.name}
								</span>
								<button
									type="button"
									onclick={removeSelectedImage}
									disabled={isSubmitting}
									class="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
									title="Hapus Bukti Foto"
								>
									<X class="w-4 h-4" />
								</button>
							</div>
							<p class="text-slate-400">Ukuran: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
							<p class="text-slate-400">Tipe: {selectedFile.type}</p>
							<div class="inline-flex items-center gap-1 text-[11px] text-emerald-400 pt-1">
								<CheckCircle2 class="w-3.5 h-3.5" />
								<span>Preview foto siap dimasukkan ke kolom Bukti Kegiatan</span>
							</div>
						</div>
					</div>
				{:else}
					<!-- File Upload Drag Zone -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 text-center bg-slate-950/50 hover:bg-slate-900/50 transition-all cursor-pointer group"
						ondrop={handleDrop}
						ondragover={handleDragOver}
					>
						<input
							type="file"
							id="dokumentasi"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onchange={handleFileSelect}
							disabled={isSubmitting}
							class="hidden"
						/>
						<label for="dokumentasi" class="cursor-pointer block space-y-2">
							<div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
								<Upload class="w-6 h-6" />
							</div>
							<div>
								<span class="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
									Klik untuk memilih foto Bukti Kegiatan
								</span>
								<span class="text-sm text-slate-400"> atau seret file gambar ke sini</span>
							</div>
							<p class="text-xs text-slate-500">
								Format: JPG, PNG, WEBP, atau GIF (Maksimum 5 MB)
							</p>
						</label>
					</div>
				{/if}

				{#if fieldErrors.dokumentasi}
					<p class="text-xs text-rose-400 flex items-center gap-1 mt-1">
						<AlertTriangle class="w-3.5 h-3.5" />
						<span>{fieldErrors.dokumentasi}</span>
					</p>
				{/if}
			</div>

			<!-- 5. Submit Button -->
			<div class="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex items-center gap-2 text-xs text-slate-400">
					<Info class="w-4 h-4 text-indigo-400 shrink-0" />
					<span>Data diproses secara temporary tanpa database.</span>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<Loader2 class="w-4 h-4 animate-spin text-white" />
						<span>Memproses Data Logbook...</span>
					{:else}
						<Send class="w-4 h-4 text-indigo-200" />
						<span>Tambahkan ke Logbook</span>
					{/if}
				</button>
			</div>
		</form>
	</div>

	<!-- Server Feedback / Integration Status Display -->
	{#if serverResponse}
		<div
			class="rounded-2xl border p-6 shadow-xl space-y-3 transition-all
			{serverResponse.success 
				? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100' 
				: 'bg-amber-950/40 border-amber-500/30 text-amber-100'}"
		>
			<div class="flex items-start gap-3">
				{#if serverResponse.success}
					<CheckCircle2 class="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
				{:else}
					<ShieldAlert class="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
				{/if}

				<div class="space-y-1 min-w-0 flex-1">
					<h3 class="font-bold text-base tracking-tight">
						{serverResponse.success ? 'Proses Berhasil' : 'Status Integrasi System'}
					</h3>
					<p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
						{serverResponse.message}
					</p>

					{#if serverResponse.details}
						<div class="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
							<span class="text-slate-400 block font-sans font-semibold mb-1">Rincian Server Response:</span>
							<p class="break-words text-amber-300">{serverResponse.details}</p>
						</div>
					{/if}

					{#if serverResponse.data}
						<div class="mt-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
							<span class="text-slate-400 block font-semibold mb-1">Payload Terverifikasi:</span>
							<div class="grid grid-cols-2 gap-2 text-slate-300">
								<div>Tanggal: <span class="text-white font-medium">{serverResponse.data.tanggal}</span></div>
								<div>Luaran: <span class="text-white font-medium">{serverResponse.data.luaran || '-'}</span></div>
								{#if serverResponse.data.hasImage}
									<div class="col-span-2">Bukti Foto: <span class="text-indigo-300">{serverResponse.data.imageName} ({(Number(serverResponse.data.imageSize) / (1024 * 1024)).toFixed(2)} MB)</span></div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
