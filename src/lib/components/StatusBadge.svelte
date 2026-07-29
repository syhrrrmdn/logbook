<script lang="ts">
	interface Props {
		statusText: string;
		isConfigured: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	let { statusText, isConfigured, size = 'md' }: Props = $props();
</script>

<div
	class="inline-flex items-center gap-2 rounded-full border backdrop-blur-sm font-medium transition-all
	{isConfigured
		? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
		: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/10'}
	{size === 'sm' ? 'px-2.5 py-0.5 text-xs' : ''}
	{size === 'md' ? 'px-3 py-1 text-xs sm:text-sm' : ''}
	{size === 'lg' ? 'px-4 py-1.5 text-sm font-semibold' : ''}"
>
	<span class="relative flex h-2 w-2">
		{#if isConfigured}
			<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
			<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
		{:else}
			<span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
		{/if}
	</span>
	<span>{statusText}</span>
</div>
