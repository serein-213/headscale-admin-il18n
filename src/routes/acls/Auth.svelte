<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import { App } from '$lib/States.svelte';
	import { authApprove, authRegister, authReject } from '$lib/common/api';
	import { debug } from '$lib/common/debug';
	import { getUserDisplay, type User } from '$lib/common/types';
	import { toastError, toastSuccess } from '$lib/common/funcs';
	import { _ } from 'svelte-i18n';

	type AuthProps = {
		loading?: boolean;
	};

	let { loading = $bindable(false) }: AuthProps = $props();

	const ToastStore = getToastStore();
	let authId = $state('');
	let userId = $state('');

	const users = $derived(App.users.value);

	function userValue(user: User): string {
		return user.name || user.id;
	}

	async function runAuthAction(action: 'approve' | 'reject' | 'register') {
		if (!authId.trim()) {
			toastError($_('acls.authIdRequired'), ToastStore);
			return;
		}
		if (action === 'register' && !userId) {
			toastError($_('acls.authUserRequired'), ToastStore);
			return;
		}

		loading = true;
		try {
			if (action === 'approve') {
				await authApprove(authId.trim());
				toastSuccess($_('acls.authApproved'), ToastStore);
			} else if (action === 'reject') {
				await authReject(authId.trim());
				toastSuccess($_('acls.authRejected'), ToastStore);
			} else {
				const node = await authRegister(userId, authId.trim());
				if (App.nodes.value.some((existing) => existing.id === node.id)) {
					App.updateValue(App.nodes, node);
				} else {
					App.nodes.value = [...App.nodes.value, node];
				}
				toastSuccess($_('acls.authRegistered'), ToastStore);
			}
		} catch (e) {
			if (e instanceof Error) {
				toastError($_('acls.authActionFailed'), ToastStore, e);
			}
			debug(e);
		} finally {
			loading = false;
		}
	}
</script>

<CardListPage>
	<div class="grid gap-4 max-w-2xl">
		<label class="label">
			<span>{$_('acls.authId')}</span>
			<input
				class="input rounded-md"
				autocomplete="off"
				placeholder={$_('acls.authIdPlaceholder')}
				bind:value={authId}
			/>
		</label>

		<label class="label">
			<span>{$_('acls.authUser')}</span>
			<select class="select rounded-md" bind:value={userId}>
				<option value="">{$_('acls.selectUser')}</option>
				{#each users as user}
					<option value={userValue(user)}>{getUserDisplay(user)}</option>
				{/each}
			</select>
		</label>

		<div class="flex flex-wrap gap-2">
			<button
				class="btn-sm rounded-md variant-filled-success"
				disabled={loading}
				onclick={() => runAuthAction('register')}
			>
				{$_('acls.authRegister')}
			</button>
			<button
				class="btn-sm rounded-md variant-filled-primary"
				disabled={loading}
				onclick={() => runAuthAction('approve')}
			>
				{$_('acls.authApprove')}
			</button>
			<button
				class="btn-sm rounded-md variant-filled-error"
				disabled={loading}
				onclick={() => runAuthAction('reject')}
			>
				{$_('acls.authReject')}
			</button>
		</div>
	</div>
</CardListPage>
