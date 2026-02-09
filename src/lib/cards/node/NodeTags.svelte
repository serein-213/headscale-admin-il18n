<script lang="ts">
	import { InputChip, getToastStore, getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';

	import type { Node } from '$lib/common/types';
	import { setNodeTags } from '$lib/common/api';
	import { toastError } from '$lib/common/funcs';
	import { localizeError } from '$lib/common/errors';
	import CardListEntry from '../CardListEntry.svelte';
	import { _ } from 'svelte-i18n';

	import { App } from '$lib/States.svelte';

	type NodeTagsProps = {
		node: Node,
	}

	let {
		node = $bindable(),
	}: NodeTagsProps = $props()

	let tags = $state(node.tags.map((tag) => tag.replace('tag:', '')));

	$effect(() => {
		const nodeTagsShort = node.tags.map((tag) => tag.replace('tag:', ''));
		if (JSON.stringify(nodeTagsShort) !== JSON.stringify(tags)) {
			tags = nodeTagsShort;
		}
	});

	let disabled = $state(false);
	const ToastStore = getToastStore();
	const ModalStore = getModalStore();

	async function saveTags() {
		// If adding the first tag to a node with no tags, warn about ownership change (v0.28+)
		if (node.tags.length === 0 && tags.length > 0) {
			const modal: ModalSettings = {
				type: 'confirm',
				title: $_('common.confirm'),
				body: $_('cards.tagOwnershipWarning'),
				response: (r: boolean) => {
					if (r) {
						performSave();
					} else {
						// Revert tags
						tags = node.tags.map((tag) => tag.replace('tag:', ''));
					}
				}
			};
			ModalStore.trigger(modal);
		} else {
			performSave();
		}
	}

	async function performSave() {
		disabled = true;
		try {
			const n = await setNodeTags(node, tags);
			node = n;
			App.updateValue(App.nodes, n);
		} catch (e) {
			toastError($_('cards.invalidTags') + ' ' + localizeError(e), ToastStore);
			tags = node.tags.map((tag) => tag.replace('tag:', ''));
		} finally {
			disabled = false;
		}
	}
</script>

<div class="space-y-4">
	<CardListEntry top title={$_('cards.tags')}>
		<InputChip
			name="tags-node-{node.id}"
			bind:value={tags}
			{disabled}
			class="w-full"
			chips="variant-filled-surface"
			on:add={saveTags}
			on:remove={saveTags}
		/>
	</CardListEntry>
</div>
