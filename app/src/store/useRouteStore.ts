import { create } from 'zustand';

export type Page = 'landing' | 'simulator' | 'docs' | 'media';

interface RouteState {
    currentPage: Page;
    navigate: (page: Page) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
    currentPage: 'landing',
    navigate: (page) => set({ currentPage: page }),
}));
