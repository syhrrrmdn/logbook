import { writable } from 'svelte/store';
import type { ToastMessage } from '$lib/types';

function createToastStore() {
	const { subscribe, update } = writable<ToastMessage[]>([]);

	return {
		subscribe,
		add: (toast: Omit<ToastMessage, 'id'>) => {
			const id = Math.random().toString(36).substring(2, 9);
			const newToast: ToastMessage = {
				id,
				duration: 5000,
				...toast
			};

			update((toasts) => [...toasts, newToast]);

			if (newToast.duration && newToast.duration > 0) {
				setTimeout(() => {
					update((toasts) => toasts.filter((t) => t.id !== id));
				}, newToast.duration);
			}

			return id;
		},
		success: (title: string, message: string, duration = 5000) => {
			return createToastStoreInstance.add({ type: 'success', title, message, duration });
		},
		error: (title: string, message: string, duration = 6000) => {
			return createToastStoreInstance.add({ type: 'error', title, message, duration });
		},
		info: (title: string, message: string, duration = 5000) => {
			return createToastStoreInstance.add({ type: 'info', title, message, duration });
		},
		warning: (title: string, message: string, duration = 5000) => {
			return createToastStoreInstance.add({ type: 'warning', title, message, duration });
		},
		dismiss: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		},
		clear: () => {
			update(() => []);
		}
	};
}

export const toast = createToastStore();
const createToastStoreInstance = toast;
