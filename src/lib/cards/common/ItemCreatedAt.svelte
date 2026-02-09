<script lang="ts">
	import CardListEntry from '../CardListEntry.svelte';
	import type { Named } from '$lib/common/types';
	import { _ } from 'svelte-i18n';

	type ItemCreatedAtProps = {
		item: Named,
	}

	let { item = $bindable() }: ItemCreatedAtProps = $props()

</script>

<CardListEntry title={$_('cards.created')}>
	{new Date(item.createdAt).toLocaleString('en-Gb', {
		minute: '2-digit',
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		hour12: false,
	})}
</CardListEntry>
