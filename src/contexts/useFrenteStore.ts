import { create } from 'zustand';
import { Frente } from '@/types';

type FrenteState = {
    selectedFrente: Frente | null;
    setSelectedFrente: (frente: Frente) => void;
};

const useFrenteStore = create<FrenteState>((set) => ({
    selectedFrente: null,
    setSelectedFrente: (frente: Frente) => set({ selectedFrente: frente }),
}));

export default useFrenteStore;
