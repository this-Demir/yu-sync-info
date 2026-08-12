import { create } from 'zustand';

export type Page = 'docs' | 'simulator' | 'media';

interface RouteState {
    currentPage: Page;
    navigate: (page: Page) => void;
}

// Docs is the entry screen. There is no separate landing page, the document
// itself is the front door and it points at the simulator in its first note.
export const useRouteStore = create<RouteState>((set) => ({
    currentPage: 'docs',
    navigate: (page) => set({ currentPage: page }),
}));
