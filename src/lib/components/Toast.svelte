<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-svelte';

	let toasts = $state<import('$lib/types').ToastMessage[]>([]);

	toast.subscribe((val) => {
		toasts = val;
	});
</script>

{#if toasts.length > 0}
	<div 
		class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none"
		aria-live="polite"
		aria-atomic="true"
	>
		{#each toasts as t (t.id)}
			<div
				class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0
				{t.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50' : ''}
				{t.type === 'error' ? 'bg-rose-950/80 border-rose-500/40 text-rose-100 shadow-rose-950/50' : ''}
				{t.type === 'warning' ? 'bg-amber-950/80 border-amber-500/40 text-amber-100 shadow-amber-950/50' : ''}
				{t.type === 'info' ? 'bg-sky-950/80 border-sky-500/40 text-sky-100 shadow-sky-950/50' : ''}"
			>
				<div class="mt-0.5 shrink-0">
					{#if t.type === 'success'}
						<CheckCircle2 class="w-5 h-5 text-emerald-400" />
					{:else if t.type === 'error'}
						<XCircle class="w-5 h-5 text-rose-400" />
					{:else if t.type === 'warning'}
						<AlertTriangle class="w-5 h-5 text-amber-400" />
					{:else}
						<Info class="w-5 h-5 text-sky-400" />
					{/if}
				</div>

				<div class="flex-1 min-w-0">
					<h4 class="text-sm font-semibold tracking-tight">{t.title}</h4>
					<p class="text-xs mt-1 text-slate-300 leading-relaxed break-words">{t.message}</p>
				</div>

				<button
					type="button"
					onclick={() => toast.dismiss(t.id)}
					class="shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5"
					aria-label="Tutup notifikasi"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
		{/each}
	</div>
{/if}
