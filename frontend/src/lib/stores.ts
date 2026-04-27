import { writable } from 'svelte/store';

export const token = writable<string | null>(
	typeof window !== 'undefined' ? localStorage.getItem('token') : null
);

export const user = writable<{ id: number; email: string; first_name: string; last_name: string } | null>(null);

token.subscribe((value) => {
	if (typeof window !== 'undefined') {
		if (value) localStorage.setItem('token', value);
		else localStorage.removeItem('token');
	}
});
