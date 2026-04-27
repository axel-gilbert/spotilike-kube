<script lang="ts">
	import { token, user } from '$lib/stores';
	import { api, type Todo } from '$lib/api';
	import { onMount } from 'svelte';

	let todos: Todo[] = [];
	let newTitle = '';
	let newDesc = '';
	let loading = false;
	let error = '';

	// Auth forms
	let showLogin = false;
	let showRegister = false;
	let loginEmail = '';
	let loginPassword = '';
	let regEmail = '';
	let regPassword = '';
	let regFirstName = '';
	let regLastName = '';

	onMount(async () => {
		if ($token) await loadTodos();
	});

	async function loadTodos() {
		try {
			todos = await api.todos.list();
		} catch (e: any) {
			error = e.message;
		}
	}

	async function login() {
		try {
			const res = await api.auth.login(loginEmail, loginPassword);
			token.set(res.access_token);
			const me = await api.auth.me();
			user.set(me);
			showLogin = false;
			await loadTodos();
		} catch (e: any) {
			error = e.message;
		}
	}

	async function register() {
		try {
			const res = await api.auth.register(regEmail, regPassword, regFirstName, regLastName);
			token.set(res.access_token);
			const me = await api.auth.me();
			user.set(me);
			showRegister = false;
			await loadTodos();
		} catch (e: any) {
			error = e.message;
		}
	}

	function logout() {
		token.set(null);
		user.set(null);
		todos = [];
	}

	async function addTodo() {
		if (!newTitle.trim()) return;
		loading = true;
		try {
			const todo = await api.todos.create(newTitle.trim(), newDesc.trim() || undefined);
			todos = [...todos, todo];
			newTitle = '';
			newDesc = '';
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function toggleTodo(todo: Todo) {
		try {
			const updated = await api.todos.update(todo.id, { completed: !todo.completed });
			todos = todos.map(t => t.id === todo.id ? updated : t);
		} catch (e: any) {
			error = e.message;
		}
	}

	async function deleteTodo(id: number) {
		try {
			await api.todos.delete(id);
			todos = todos.filter(t => t.id !== id);
		} catch (e: any) {
			error = e.message;
		}
	}
</script>

<svelte:head>
	<title>TodoList - Organisez vos tâches</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Navbar -->
	<nav class="bg-black text-white px-6 py-4 flex justify-between items-center shadow-md">
		<h1 class="text-xl font-bold tracking-tight">TodoList</h1>
		<div class="flex gap-3">
			{#if $user}
				<span class="text-sm text-gray-300 self-center">Bonjour, {$user.first_name}</span>
				<button on:click={logout} class="text-sm bg-white text-black px-3 py-1.5 rounded font-medium hover:bg-gray-200 transition">
					Déconnexion
				</button>
			{:else}
				<button on:click={() => { showLogin = true; showRegister = false; }} class="text-sm border border-white px-3 py-1.5 rounded hover:bg-white hover:text-black transition">
					Connexion
				</button>
				<button on:click={() => { showRegister = true; showLogin = false; }} class="text-sm bg-yellow-400 text-black px-3 py-1.5 rounded font-medium hover:bg-yellow-300 transition">
					S'inscrire
				</button>
			{/if}
		</div>
	</nav>

	<main class="max-w-2xl mx-auto px-4 py-10">
		{#if error}
			<div class="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 flex justify-between">
				<span>{error}</span>
				<button on:click={() => error = ''} class="font-bold">×</button>
			</div>
		{/if}

		{#if !$token}
			<!-- Landing -->
			<div class="text-center py-16">
				<h2 class="text-4xl font-bold text-gray-900 mb-4">Simplifiez votre quotidien</h2>
				<p class="text-gray-500 text-lg mb-8">Un gestionnaire de tâches minimaliste et efficace.</p>
				<button on:click={() => showRegister = true} class="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
					Commencer gratuitement
				</button>
			</div>

			<!-- Login modal -->
			{#if showLogin}
				<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
						<h3 class="text-xl font-bold mb-6">Connexion</h3>
						<input bind:value={loginEmail} type="email" placeholder="Email" class="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-black" />
						<input bind:value={loginPassword} type="password" placeholder="Mot de passe" class="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black" />
						<div class="flex gap-3">
							<button on:click={login} class="flex-1 bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition">Se connecter</button>
							<button on:click={() => showLogin = false} class="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Annuler</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Register modal -->
			{#if showRegister}
				<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
						<h3 class="text-xl font-bold mb-6">Créer un compte</h3>
						<input bind:value={regFirstName} type="text" placeholder="Prénom" class="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-black" />
						<input bind:value={regLastName} type="text" placeholder="Nom" class="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-black" />
						<input bind:value={regEmail} type="email" placeholder="Email" class="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-black" />
						<input bind:value={regPassword} type="password" placeholder="Mot de passe" class="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black" />
						<div class="flex gap-3">
							<button on:click={register} class="flex-1 bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition">S'inscrire</button>
							<button on:click={() => showRegister = false} class="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Annuler</button>
						</div>
					</div>
				</div>
			{/if}
		{:else}
			<!-- App -->
			<h2 class="text-2xl font-bold text-gray-900 mb-6">Mes tâches</h2>

			<!-- Add form -->
			<div class="bg-white rounded-xl shadow-sm border p-4 mb-6">
				<div class="flex gap-2 mb-2">
					<input bind:value={newTitle} on:keydown={e => e.key === 'Enter' && addTodo()} type="text" placeholder="Nouvelle tâche..." class="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
					<button on:click={addTodo} disabled={loading} class="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition">
						{loading ? '...' : 'Ajouter'}
					</button>
				</div>
				<input bind:value={newDesc} type="text" placeholder="Description (optionnel)" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
			</div>

			<!-- Todo list -->
			{#if todos.length === 0}
				<p class="text-center text-gray-400 py-12">Aucune tâche pour l'instant. Créez-en une !</p>
			{:else}
				<ul class="space-y-3">
					{#each todos as todo (todo.id)}
						<li class="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3 group">
							<input type="checkbox" checked={todo.completed} on:change={() => toggleTodo(todo)} class="mt-1 w-4 h-4 cursor-pointer accent-black" />
							<div class="flex-1 min-w-0">
								<p class="font-medium text-gray-900 {todo.completed ? 'line-through text-gray-400' : ''}">{todo.title}</p>
								{#if todo.description}
									<p class="text-sm text-gray-500 mt-0.5">{todo.description}</p>
								{/if}
							</div>
							<button on:click={() => deleteTodo(todo.id)} class="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 font-bold text-lg leading-none">×</button>
						</li>
					{/each}
				</ul>
				<p class="text-sm text-gray-400 text-center mt-6">
					{todos.filter(t => t.completed).length}/{todos.length} tâches complétées
				</p>
			{/if}
		{/if}
	</main>
</div>
