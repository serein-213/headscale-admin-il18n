import { browser } from '$app/environment';
import { init, register, locale } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('zh', () => import('./locales/zh.json'));

const getInitialLocale = () => {
	if (browser) {
		const stored = window.localStorage.getItem('locale');
		if (stored && (stored === 'en' || stored === 'zh')) {
			return stored;
		}
	}
	return defaultLocale;
};

init({
	fallbackLocale: defaultLocale,
	initialLocale: getInitialLocale()
});

// Set the locale immediately for SSR compatibility
locale.set(getInitialLocale());
