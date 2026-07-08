<script lang="ts">
	import { TabGroup, getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';
	import JWCC from 'json5';
	import RawMdiCodeJSON from '~icons/mdi/code-json';
	import RawMdiConsole from '~icons/mdi/console';
	import RawMdiDevices from '~icons/mdi/devices';
	import RawMdiGroups from '~icons/mdi/account-group';
	import RawMdiKey from '~icons/mdi/key-variant';
	import RawMdiSecurity from '~icons/mdi/security';
	import RawMdiTune from '~icons/mdi/tune-variant';
	import RawMdiTag from '~icons/mdi/tag';

	import { ACLBuilder, type ACL } from '$lib/common/acl.svelte';
	import { debug } from '$lib/common/debug';
	import { getPolicy } from '$lib/common/api';
	import { toastError } from '$lib/common/funcs';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import Tabbed from '$lib/parts/Tabbed.svelte';

	import { _ } from 'svelte-i18n';

	const ToastStore = getToastStore();

	let acl = $state(ACLBuilder.defaultACL());
	let loading = $state(false);

	// Navigation tabs
	let tabSet: number = $state(0);
	type AclTabName =
		| 'groups'
		| 'tag-owners'
		| 'hosts'
		| 'policies'
		| 'ssh'
		| 'advanced'
		| 'auth'
		| 'config';
	type AclTabComponent = Component<Record<string, unknown>>;
	type AclTabModule = { default: AclTabComponent };

	const tabs = [
		{ name: 'groups', titleKey: 'acls.groups', logo: RawMdiGroups },
		{ name: 'tag-owners', titleKey: 'acls.tagOwners', logo: RawMdiTag },
		{ name: 'hosts', titleKey: 'acls.hosts', logo: RawMdiDevices },
		{ name: 'policies', titleKey: 'acls.policies', logo: RawMdiSecurity },
		{ name: 'ssh', titleKey: 'acls.sshRules', logo: RawMdiConsole },
		{ name: 'advanced', titleKey: 'acls.advanced', logo: RawMdiTune },
		{ name: 'auth', titleKey: 'acls.auth', logo: RawMdiKey },
		{ name: 'config', titleKey: 'acls.config', logo: RawMdiCodeJSON },
	] satisfies { name: AclTabName; titleKey: string; logo: Component }[];

	const tabLoaders = {
		groups: () => import('./Groups.svelte'),
		'tag-owners': () => import('./TagOwners.svelte'),
		hosts: () => import('./Hosts.svelte'),
		policies: () => import('./Policies.svelte'),
		ssh: () => import('./SshRules.svelte'),
		advanced: () => import('./Advanced.svelte'),
		auth: () => import('./Auth.svelte'),
		config: () => import('./Config.svelte'),
	} satisfies Record<AclTabName, () => Promise<unknown>>;

	const loadedTabs = new Map<AclTabName, AclTabComponent>();
	let activeTab = $derived(tabs[tabSet].name);
	let ActiveTabComponent = $state<AclTabComponent | undefined>(undefined);
	let tabLoading = $state(false);

	async function loadActiveTab(name: AclTabName) {
		ActiveTabComponent = loadedTabs.get(name);
		if (ActiveTabComponent) {
			tabLoading = false;
			return;
		}

		tabLoading = true;
		try {
			const module = (await tabLoaders[name]()) as AclTabModule;
			loadedTabs.set(name, module.default);
			if (activeTab === name) {
				ActiveTabComponent = module.default;
			}
		} catch (reason) {
			debug('failed to load ACL tab:', name, reason);
			toastError(
				`Unable to load ACL tab.`,
				ToastStore,
				reason instanceof Error ? reason : undefined,
			);
		} finally {
			if (activeTab === name) {
				tabLoading = false;
			}
		}
	}

	onMount(() => {
		loadActiveTab(activeTab);
		getPolicy()
			.then((policy) => {
				acl = ACLBuilder.fromPolicy(JWCC.parse<ACL>(policy));
			})
			.catch((reason) => {
				debug('failed to get policy:', reason);
				toastError(`Unable to get policy from server.`, ToastStore, reason);
			});
	});

	$effect(() => {
		loadActiveTab(activeTab);
	});
</script>

<Page>
	<PageHeader title={$_('acls.title')} />
	<TabGroup
		justify="justify-left"
		active="variant-filled-secondary"
		hover="hover:variant-soft-secondary"
		flex="flex-1 lg:flex-none"
		rounded="rounded-md"
		border=""
		class="bg-surface-100-800-token w-full px-2 py-2"
	>
		<div class="flex text-center">
			<Tabbed {tabs} bind:tabSet />
		</div>
		<svelte:fragment slot="panel">
			{#if tabLoading || !ActiveTabComponent}
				<div class="p-6 text-sm text-surface-500">{$_('common.loading')}</div>
			{:else if activeTab == 'auth'}
				<ActiveTabComponent bind:loading />
			{:else}
				<ActiveTabComponent bind:loading bind:acl />
			{/if}
		</svelte:fragment>
	</TabGroup>
</Page>
