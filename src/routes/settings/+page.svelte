<script lang="ts">
	import { ALL_THEMES, setTheme } from '$lib/common/themes';
	import {
		getTime,
		getTimeDifference,
		getTimeDifferenceColor,
		toastSuccess,
	} from '$lib/common/funcs';

	import { page } from '$app/state';
	import { debug } from '$lib/common/debug';
	import { createPopulateErrorHandler } from '$lib/common/errors';
	import type { ApiKeyInfo, ExpirationMessage } from '$lib/common/types';
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { getToastStore, Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import { refreshApiKey } from '$lib/common/api';

	// icons
	import RawMdiContentSaveOutline from '~icons/mdi/content-save-outline';
	import RawMdiOrbit from '~icons/mdi/orbit-variant';
	import RawMdiEye from '~icons/mdi/eye-outline';
	import RawMdiEyeOff from '~icons/mdi/eye-off-outline';

	import { App } from '$lib/States.svelte';
	import { goto } from '$app/navigation';
	import { _, locale } from 'svelte-i18n';
	import { browser } from '$app/environment';

	const LANGUAGES = [
		{ code: 'en', name: 'English' },
		{ code: 'zh', name: '中文' }
	];

	type Settings = {
		apiUrl: string;
		apiKey: string;
		apiTtl: number;
		theme: string;
		debug: boolean;
		language: string;
		rememberMe: boolean;
	};

	let settings = $state<Settings>({
		apiUrl: App.apiUrl.value,
		apiKey: App.apiKey.value,
		apiTtl: App.apiTtl.value / 1000,
		debug: App.debug.value,
		theme: App.theme.value,
		language: App.language.value,
		rememberMe: App.apiRememberMe.value,
	});

	const ToastStore = getToastStore();

	let apiKeyInfo = $derived(App.apiKeyInfo.value);
	let apiKeyShow = $state(false);
	let loading = $state(false);

	const apiKeyExpirationMessage: ExpirationMessage = $derived.by(() => {
		if (apiKeyInfo.expires !== ''){
			const td = getTimeDifference(getTime(apiKeyInfo.expires));
			return {
				message: td.message,
				color: getTimeDifferenceColor(td),
			};
		} else {
			return { message: '', color: '' };
		}
	});

	async function saveSettings(event?: Event) {
		event?.preventDefault()

		loading = true;
		try {
			if(settings.apiUrl === '') {
				settings.apiUrl = page.url.origin
			}
			// Trim inputs to avoid common copy-paste errors
			settings.apiUrl = settings.apiUrl.trim();
			settings.apiKey = settings.apiKey.trim();

			App.apiRememberMe.value = settings.rememberMe
			App.apiUrl.value = settings.apiUrl
			App.apiKey.value = settings.apiKey
			App.apiTtl.value = settings.apiTtl * 1000
			App.debug.value = settings.debug
			App.theme.value = settings.theme
			App.language.value = settings.language
			App.apiKeyInfo.value = {
				expires: '',
				authorized: null,
				informedUnauthorized: false,
				informedExpiringSoon: false,
			};
			
			const handler = createPopulateErrorHandler(ToastStore);
			await App.populateApiKeyInfo().catch(handler);
			await App.populateAll(handler, false);

			if (App.hasValidApi) {
				toastSuccess($_('settings.savedSettings'), ToastStore);
			}
		} catch (err) {
			debug(err);
		} finally {
			loading = false;
		}
	}
</script>

<Page classes="items-start">
	<PageHeader title={$_('settings.title')} />
	<form onsubmit={saveSettings} class="max-w-3xl mx-auto p-6 card shadow rounded-lg">
		<div class="space-y-6">
			<div>
				<label for="api-url" class="block text-lg font-medium">{$_('settings.apiUrl')}</label>
				<input
					id="api-url"
					class="mt-1 block w-full input rounded-md"
					type="text"
					placeholder={page.url.origin}
					disabled={loading}
					bind:value={settings.apiUrl}
				/>
			</div>

			<div>
				<label for="api-key" class="block text-lg font-medium">{$_('settings.apiKey')}</label>
				<div class="mt-1 flex items-center">
					<input
						id="api-key"
						class="flex-1 input rounded-md"
						type={apiKeyShow ? "text" : "password"}
						placeholder={$_('settings.apiKeyPlaceholder')}
						disabled={loading}
						bind:value={settings.apiKey}
					/>
					<button
						type="button"
						disabled={loading}
						class="ml-2 p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
						onclick={() => { apiKeyShow = !apiKeyShow; }}
						aria-label={apiKeyShow ? $_('settings.hideApiKey') : $_('settings.showApiKey')}
					>
						{#if apiKeyShow}
							<RawMdiEyeOff class="w-5 h-5" />
						{:else}
							<RawMdiEye class="w-5 h-5" />
						{/if}
					</button>
					<button
						type="button"
						disabled={loading}
						class="ml-2 p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
						onclick={async () => {
							loading = true;
							try {
								await refreshApiKey();
								settings.apiKey = App.apiKey.value;
								saveSettings();
							} finally {
								loading = false;
							}
						}}
						aria-label={$_('settings.refreshApiKey')}
					>
						<RawMdiOrbit />
					</button>
				</div>
				{#if apiKeyInfo.authorized !== null}
					<div class="mt-2 text-sm">
						<span class={apiKeyInfo.authorized ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
							{apiKeyInfo.authorized ? $_('settings.authorized') : $_('settings.notAuthorized')}
						</span>
						{#if apiKeyInfo.authorized && apiKeyExpirationMessage.message}
							<span class="ml-2 text-gray-500 dark:text-gray-400">
								{$_('settings.expiresIn')}: {apiKeyExpirationMessage.message}
							</span>
						{/if}
					</div>
				                {:else if loading}
									<div class="mt-2 text-sm text-yellow-500 dark:text-yellow-400">{$_('settings.checkingAuth')}</div>
								{/if}
							</div>
				
							<div class="flex items-center space-x-2">
								<input
									id="remember-me"
									type="checkbox"
									class="checkbox"
									disabled={loading}
									bind:checked={settings.rememberMe}
								/>
								<label for="remember-me" class="text-sm font-medium cursor-pointer">
									{$_('settings.rememberMe')}
								</label>
							</div>

							{#if App.hasValidApi}
								<div>
									<label for="api-ttl" class="block text-lg font-medium text-gray-700 dark:text-gray-200">{$_('settings.apiTtl')}</label>
									<input
										id="api-ttl"
										class="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
										type="number"
										min="1"
										disabled={loading}
										bind:value={settings.apiTtl}
									/>
								</div>
				
								                <Accordion>
								                    <AccordionItem>
								                        {#snippet lead()}<RawMdiOrbit />{/snippet}
								                        {#snippet summary()}
								                            <!-- svelte-ignore a11y_click_events_have_key_events -->
								                            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
								                            <div class="flex items-center space-x-2" onclick={(e) => e.stopPropagation()} role="group">
								                                <input
								                                    id="debugging"
								                                    name="debugging"
								                                    type="checkbox"
								                                    class="checkbox"
								                                    disabled={loading}
								                                    bind:checked={settings.debug}
								                                />
								                                <label for="debugging" class="text-lg font-medium cursor-pointer">
								                                    {$_('settings.debugging')}
								                                </label>
								                            </div>
								                        {/snippet}
								                        {#snippet content()}											<div class="flex flex-col space-y-4 pt-2">
												<div class="flex items-start justify-between space-x-4">
													<button type="button" class="btn btn-sm rounded-md variant-ghost-primary w-full" onclick={() => console.log(JSON.stringify(App.users.value, null, 4))}>
														{$_('settings.logUsers')}
													</button>
													<button type="button" class="btn btn-sm rounded-md variant-ghost-primary w-full" onclick={() => console.log(JSON.stringify(App.nodes.value, null, 4))}>
														{$_('settings.logNodes')}
													</button>
												</div>
												<div class="flex items-start justify-between space-x-4">
													<button type="button" class="btn btn-sm rounded-md variant-ghost-primary w-full" onclick={() => console.log(JSON.stringify(App.preAuthKeys.value, null, 4))}>
														{$_('settings.logPreAuthKeys')}
													</button>
													<button type="button" class="btn btn-sm rounded-md variant-ghost-primary w-full" onclick={() => console.log(JSON.stringify(App.apiKeyInfo.value, null, 4))}>
														{$_('settings.logApiKeyInfo')}
													</button>
												</div>
											</div>
										{/snippet}
									</AccordionItem>
								</Accordion>
							{/if}
				
							<div>				<label for="theme-selector" class="block text-lg font-medium">{$_('settings.theme')}</label>
				<select
					id="theme-selector"
					class="mt-1 block w-full select rounded-md"
					bind:value={App.theme.value}
					onchange={() => {
						setTheme(App.theme.value)
						settings.theme = App.theme.value
					}}
				>
					{#each ALL_THEMES as theme}
						<option value={theme}>{theme}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="language-selector" class="block text-lg font-medium">{$_('settings.language')}</label>
				<select
					id="language-selector"
					class="mt-1 block w-full select rounded-md"
					bind:value={settings.language}
					onchange={() => {
						App.language.value = settings.language;
						locale.set(settings.language);
						if (browser) {
							localStorage.setItem('locale', settings.language);
						}
					}}
				>
					{#each LANGUAGES as language}
						<option value={language.code}>{language.name}</option>
					{/each}
				</select>
			</div>

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={loading || !settings.apiKey}
					class="btn variant-filled-primary"
				>
					<RawMdiContentSaveOutline class="w-5 h-5 mr-2" />
					{$_('settings.save')}
				</button>
			</div>
		</div>
	</form>
</Page>