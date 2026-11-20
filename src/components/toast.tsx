import { CheckCircle2 } from "lucide-react";
import { create } from "zustand";

interface ToastState {
  items: { id: number; text: string }[];
  push: (text: string) => void;
}

const useToasts = create<ToastState>((set) => ({
  items: [],
  push: (text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items.slice(-2), { id, text }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 2600);
  },
}));

export const toast = (text: string) => useToasts.getState().push(text);

export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className="animate-fade-up flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
          <CheckCircle2 className="size-4 text-brand-200" /> {i.text}
        </div>
      ))}
    </div>
  );
}
