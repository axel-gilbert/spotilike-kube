const API_BASE = typeof window !== 'undefined'
	? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
	: (process.env.API_BASE_URL || 'http://backend:8000/api');

function getToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string> || {}),
	};
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
	if (!res.ok) {
		const err = await res.json().catch(() => ({ detail: res.statusText }));
		throw new Error(err.detail || 'Erreur réseau');
	}
	if (res.status === 204) return undefined as T;
	return res.json();
}

export const api = {
	auth: {
		login: (email: string, password: string) => {
			const form = new URLSearchParams();
			form.append('username', email);
			form.append('password', password);
			return fetch(`${API_BASE}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: form.toString(),
			}).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.detail))));
		},
		register: (email: string, password: string, firstName: string, lastName: string) =>
			request<{ access_token: string }>('/auth/register', {
				method: 'POST',
				body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
			}),
		me: () => request<{ id: number; email: string; first_name: string; last_name: string }>('/users/me'),
	},
	todos: {
		list: () => request<Todo[]>('/todos'),
		create: (title: string, description?: string) =>
			request<Todo>('/todos', { method: 'POST', body: JSON.stringify({ title, description }) }),
		update: (id: number, data: Partial<Todo>) =>
			request<Todo>(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
		delete: (id: number) => request<void>(`/todos/${id}`, { method: 'DELETE' }),
	},
};

export interface Todo {
	id: number;
	title: string;
	description?: string;
	completed: boolean;
	user_id: number;
	created_at: string;
	updated_at?: string;
}
