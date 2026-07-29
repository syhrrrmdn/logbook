<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { 
		FileText, 
		PlusCircle, 
		HardDrive, 
		FileSpreadsheet, 
		ShieldCheck, 
		Zap, 
		ArrowRight, 
		CheckCircle2, 
		AlertCircle,
		Key,
		Trash2
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const drive = $derived(data.driveStatus);
	const docx = $derived(data.docxStatus);
</script>

<svelte:head>
	<title>Dashboard | Otomatisasi Logbook Google Drive</title>
</svelte:head>

<div class="space-y-8">
	<!-- Hero Header -->
	<section class="relative overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-950 border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
		<div class="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
		<div class="absolute -left-20 -bottom-20 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none"></div>

		<div class="relative z-10 max-w-3xl space-y-4">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
				<Zap class="w-3.5 h-3.5" />
				<span>Automated Word Document Sync</span>
			</div>

			<h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
				Sistem Otomatisasi Logbook <span class="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">Google Drive</span>
			</h1>

			<p class="text-base sm:text-lg text-slate-300 leading-relaxed">
				Solusi praktis untuk mempercepat pengisian dokumen Word (.docx) logbook kegiatan harian secara aman, cepat, dan otomatis tanpa penyimpanan file permanen di server.
			</p>

			<div class="pt-2 flex flex-wrap items-center gap-3">
				<a
					href="/logbook"
					class="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5"
				>
					<PlusCircle class="w-5 h-5 text-indigo-200" />
					<span>Buka Form Logbook</span>
					<ArrowRight class="w-4 h-4 ml-1" />
				</a>

				<a
					href="#status-section"
					class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm border border-slate-800 transition-all"
				>
					<span>Cek Status Sistem</span>
				</a>
			</div>
		</div>
	</section>

	<!-- Main Feature Card Section -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main CTA Card -->
		<div class="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-xl">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
						<PlusCircle class="w-6 h-6" />
					</div>
					<span class="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
						Fitur Utama
					</span>
				</div>

				<div>
					<h2 class="text-2xl font-bold text-white tracking-tight">Fitur Logbook Magang Mandiri</h2>
					<p class="text-slate-400 text-sm mt-1 leading-relaxed">
						Input logbook terstruktur sesuai format tabel dokumen (No, Tanggal, Deskripsi Kegiatan, Luaran Kegiatan, Bukti Kegiatan).
					</p>
				</div>

				<ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
					<li class="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
						<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
						<span>Kolom Nomor (No) otomatisasi berurutan</span>
					</li>
					<li class="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
						<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
						<span>Input Tanggal & Deskripsi Kegiatan</span>
					</li>
					<li class="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
						<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
						<span>Input Luaran (Output) & Foto Bukti</span>
					</li>
					<li class="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
						<CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
						<span>Auto-clean memori temporer serverless</span>
					</li>
				</ul>
			</div>

			<div class="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
				<span class="text-xs text-slate-500">Siap digunakan untuk pengisian logbook</span>
				<a
					href="/logbook"
					class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all"
				>
					<span>Mulai Mengisi Logbook</span>
					<ArrowRight class="w-4 h-4" />
				</a>
			</div>
		</div>

		<!-- Security & Policy Summary Card -->
		<div class="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col justify-between shadow-lg">
			<div class="space-y-4">
				<div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
					<ShieldCheck class="w-5 h-5" />
				</div>

				<h3 class="text-lg font-bold text-white">Prinsip Keamanan & Privasi</h3>

				<div class="space-y-3 text-xs text-slate-300">
					<div class="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
						<Key class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
						<div>
							<strong class="text-slate-200 block mb-0.5">Credential Rahasia</strong>
							<span>Semua credential Google tersimpan di Environment Variables server.</span>
						</div>
					</div>

					<div class="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
						<Trash2 class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
						<div>
							<strong class="text-slate-200 block mb-0.5">Tanpa Permanent Storage</strong>
							<span>Tidak menggunakan Database, Supabase, Cloudinary, atau Firebase.</span>
						</div>
					</div>
				</div>
			</div>

			<div class="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-500">
				Target Deployment: Vercel Serverless
			</div>
		</div>
	</div>

	<!-- Connection & Service Status Section -->
	<section id="status-section" class="space-y-4 pt-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
			<div>
				<h2 class="text-xl font-bold text-white tracking-tight">Status Koneksi Layanan</h2>
				<p class="text-xs sm:text-sm text-slate-400">Pemantauan konfigurasi backend & Google Drive API</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Google Drive API Status Card -->
			<div class="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
							<HardDrive class="w-5 h-5" />
						</div>
						<div>
							<h3 class="font-bold text-white text-base">Google Drive API</h3>
							<p class="text-xs text-slate-400">Penyimpanan Dokumen DOCX Target</p>
						</div>
					</div>
					<StatusBadge statusText={drive.statusText} isConfigured={drive.configured} />
				</div>

				<div class="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
					<div class="flex items-center justify-between text-slate-300">
						<span class="text-slate-400">ID File Target:</span>
						<span class="font-mono font-medium">{drive.fileId || 'Belum diisi'}</span>
					</div>
					<div class="flex items-center justify-between text-slate-300">
						<span class="text-slate-400">Service Account Email:</span>
						<span class="font-medium">{drive.clientEmailConfigured ? 'Terdefinisi' : 'Belum diisi'}</span>
					</div>
					<div class="flex items-center justify-between text-slate-300">
						<span class="text-slate-400">Private Key:</span>
						<span class="font-medium">{drive.privateKeyConfigured ? 'Terdefinisi' : 'Belum diisi'}</span>
					</div>
				</div>

				<p class="text-xs text-slate-400 leading-relaxed">
					{drive.details}
				</p>

				{#if !drive.configured}
					<div class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
						<AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
						<span>Atur <code>GOOGLE_DRIVE_FILE_ID</code>, <code>GOOGLE_CLIENT_EMAIL</code>, dan <code>GOOGLE_PRIVATE_KEY</code> pada file <code>.env</code> untuk menghubungkan.</span>
					</div>
				{/if}
			</div>

			<!-- DOCX Processing Status Card -->
			<div class="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
							<FileSpreadsheet class="w-5 h-5" />
						</div>
						<div>
							<h3 class="font-bold text-white text-base">Pemrosesan DOCX</h3>
							<p class="text-xs text-slate-400">Modifikasi File Word In-Memory</p>
						</div>
					</div>
					<StatusBadge statusText={docx.statusText} isConfigured={docx.configured} />
				</div>

				<div class="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
					<div class="flex items-center justify-between text-slate-300">
						<span class="text-slate-400">Modul Pemrosesan:</span>
						<span class="font-medium text-slate-200">Abstraksi Siap (docx library)</span>
					</div>
					<div class="flex items-center justify-between text-slate-300">
						<span class="text-slate-400">Struktur Template:</span>
						<span class="font-medium text-emerald-400">Format Tabel Disesuaikan</span>
					</div>
				</div>

				<p class="text-xs text-slate-400 leading-relaxed">
					{docx.details}
				</p>
			</div>
		</div>
	</section>

	<!-- Workflow Step Explanation -->
	<section class="space-y-4 pt-4">
		<h2 class="text-xl font-bold text-white tracking-tight">Alur Kerja Otomatisasi</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
			<div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
				<div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">1</div>
				<h4 class="font-bold text-sm text-white">Input Form</h4>
				<p class="text-xs text-slate-400">User mengisi tanggal, kegiatan, deskripsi, & preview gambar.</p>
			</div>

			<div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
				<div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">2</div>
				<h4 class="font-bold text-sm text-white">Server Endpoint</h4>
				<p class="text-xs text-slate-400">Kirim data ke Vercel Serverless Function via HTTPS POST.</p>
			</div>

			<div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
				<div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">3</div>
				<h4 class="font-bold text-sm text-white">Fetch Google Drive</h4>
				<p class="text-xs text-slate-400">Sistem mengunduh dokumen .docx dari Drive ke memori ram sementara.</p>
			</div>

			<div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
				<div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">4</div>
				<h4 class="font-bold text-sm text-white">Edit DOCX</h4>
				<p class="text-xs text-slate-400">Data & gambar disisipkan ke dalam dokumen di memori RAM.</p>
			</div>

			<div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
				<div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">5</div>
				<h4 class="font-bold text-sm text-white">Update & Cleanup</h4>
				<p class="text-xs text-slate-400">Upload kembali ke Google Drive & hapus memori temporer.</p>
			</div>
		</div>
	</section>
</div>
