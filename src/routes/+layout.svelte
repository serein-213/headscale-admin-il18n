<script lang="ts">
	import Navigation from '$lib/Navigation.svelte';
	import RawMdiGithub from '~icons/mdi/github';
	import '../app.postcss';
	import {
		AppBar,
		AppShell,
		LightSwitch,
		Modal,
		Toast,
		getDrawerStore,
		getToastStore,
		initializeStores,
		type DrawerSettings,
	} from '@skeletonlabs/skeleton';

	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	initializeStores();

	const DrawerStore = getDrawerStore();

	let drawerSettings = $state({
		id: 'navDrawer',
		position: 'left',
		width: 'w-64',
		padding: '',
	}) as DrawerSettings;

	// Highlight JS
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	storeHighlightJs.set(hljs);

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	import PageDrawer from '$lib/page/PageDrawer.svelte';
	import { fade } from 'svelte/transition';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import { version } from '$lib/common/debug';
	import { App } from '$lib/States.svelte';
	import { setTheme } from '$lib/common/themes';
	import '$lib/i18n';
	import { locale, waitLocale, _, isLoading } from 'svelte-i18n';

	let { children } = $props()

	let ToastStore = $state(getToastStore());

	onMount(async () => {
		// Wait for i18n to be ready first
		await waitLocale();
		
		// Initialize language
		locale.set(App.language.value);
		await waitLocale();
		
		setTheme(App.theme.value || 'skeleton')
		App.populateAll(createPopulateErrorHandler(ToastStore), true)

		if (!App.hasValidApi) {
			goto(`${base}/settings`);
		}
	});
</script>

<Toast />
<PageDrawer />
<Modal
	background="bg-surface-50-900-token"
/>
<AppShell slotSidebarLeft="bg-surface-50-900-token border-r border-surface-500/30 w-0 lg:w-48" scrollGutter="stable both-edges">
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<div>
					<button
						aria-label="open navigation panel"
						class="lg:hidden btn btn-sm mr-4"
						onclick={() => {
							DrawerStore.open(drawerSettings);
						}}
					>
						<span>
							<svg viewBox="0 0 100 80" class="fill-token w-4 h-4">
								<rect width="100" height="20" />
								<rect y="30" width="100" height="20" />
								<rect y="60" width="100" height="20" />
							</svg>
						</span>
					</button>
					<strong class="text-xl uppercase">{$isLoading ? 'Headscale-Admin' : $_('app.title')}</strong>
					<span class="text-sm lowercase">{version}</span>
				</div>
			</svelte:fragment>

			<svelte:fragment slot="trail">
				<LightSwitch />
				<a
					class="btn btn-sm variant-ghost-surface"
					href="https://github.com/serein-213/headscale-admin-il18n"
					target="_blank"
					rel="noreferrer"
				>
					<RawMdiGithub class="mr-2" />
					{$isLoading ? 'GitHub' : $_('app.github')}
				</a>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<Navigation />
	</svelte:fragment>
	<div class="pl-2 h-full" transition:fade|local>
		{#if App.hasValidApi || $page.url.pathname.includes('/settings')}
			{@render children()}
		{/if}
	</div>
</AppShell>
