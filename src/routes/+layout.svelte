<script lang="ts">
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Sistem Otomatisasi Logbook DOCX - Google Drive</title>
</svelte:head>

<div class="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
	<Header />
	
	<main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
		{@render children()}
	</main>

	<footer class="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
		<div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
			<p>© {new Date().getFullYear()} Logbook Automation System. Serverless Vercel Ready.</p>
			<p class="text-slate-600">Tanpa simpan file permanen • Tanpa Database</p>
		</div>
	</footer>

	<Toast />
</div>
