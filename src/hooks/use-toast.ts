import { ref } from "vue";

export type ToastVariant = "default" | "destructive";
export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open: boolean;
}

const toasts = ref<Toast[]>([]);
let counter = 0;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function remove(id: string) {
  toasts.value = toasts.value.filter((item) => item.id !== id);
  timers.delete(id);
}

export function dismiss(id?: string) {
  if (id) {
    const current = toasts.value.find((item) => item.id === id);
    if (current) current.open = false;
    setTimeout(() => remove(id), 150);
    return;
  }
  toasts.value.forEach((item) => { item.open = false; });
  setTimeout(() => { toasts.value = []; }, 150);
}

export function toast(input: Omit<Toast, "id" | "open">) {
  const id = String(++counter);
  toasts.value = [{ ...input, id, open: true }, ...toasts.value].slice(0, 1);
  timers.set(id, setTimeout(() => remove(id), 5000));
  return {
    id,
    dismiss: () => dismiss(id),
    update: (next: Partial<Omit<Toast, "id">>) => {
      const current = toasts.value.find((item) => item.id === id);
      if (current) Object.assign(current, next);
    },
  };
}

export function useToast() {
  return { toasts, toast, dismiss };
}