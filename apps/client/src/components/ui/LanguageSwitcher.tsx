import { useLanguageStore } from '@/store/language.store';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bg' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
      aria-label="Switch language"
    >
      {language === 'en' ? 'БГ' : 'EN'}
    </button>
  );
}
