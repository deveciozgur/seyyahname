// Runs in <head> before first paint, so the page never flashes the wrong theme (no FOUC):
// a stored manual choice first, otherwise the system setting. ThemeProvider takes over after hydration.
export const THEME_KEY = 'seyyahname.theme';

export const THEME_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';d.dataset.theme=t;d.style.colorScheme=t}catch(e){d.dataset.theme='dark'}})()`;
