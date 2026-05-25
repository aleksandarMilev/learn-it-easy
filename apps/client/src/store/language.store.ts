import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n/index';

interface LanguageState {
  language: 'en' | 'bg';
  setLanguage: (language: 'en' | 'bg') => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => {
        void i18n.changeLanguage(language);
        set({ language });
      },
    }),
    { name: 'language' },
  ),
);
