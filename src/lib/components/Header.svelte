<script lang="ts">
	import { FileText, PlusCircle, LayoutDashboard, ShieldCheck } from 'lucide-svelte';
	import { page } from '$app/state';
</script>

<header class="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo & Title -->
			<a href="/" class="flex items-center gap-3 group">
				<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
					<FileText class="w-5 h-5 text-white" />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<span class="font-bold text-lg text-white tracking-tight group-hover:text-indigo-300 transition-colors">
							Logbook Drive
						</span>
						<span class="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
							v1.0
						</span>
					</div>
					<p class="text-[11px] text-slate-400 hidden sm:block">Otomatisasi Dokumen Google Drive</p>
				</div>
			</a>

			<!-- Navigation Links -->
			<nav class="flex items-center gap-1 sm:gap-2">
				<a
					href="/"
					class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
					{page.url.pathname === '/' 
						? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' 
						: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
				>
					<LayoutDashboard class="w-4 h-4" />
					<span>Dashboard</span>
				</a>

				<a
					href="/logbook"
					class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all
					{page.url.pathname === '/logbook'
						? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40' 
						: 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-800'}"
				>
					<PlusCircle class="w-4 h-4 text-indigo-300" />
					<span>Tambah Logbook</span>
				</a>
			</nav>
		</div>
	</div>
</header>
