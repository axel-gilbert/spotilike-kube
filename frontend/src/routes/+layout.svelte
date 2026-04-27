<script lang="ts">
	import '../app.css';
	import { token, user } from '$lib/stores';
	import { api } from '$lib/api';
	import { onMount } from 'svelte';

	onMount(async () => {
		if ($token) {
			try {
				const me = await api.auth.me();
				user.set(me);
			} catch {
				token.set(null);
				user.set(null);
			}
		}
	});
</script>

<slot />
