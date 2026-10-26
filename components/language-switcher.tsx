'use client';
import { useEffect, useState } from 'react';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    // Check saved language
    try {
      const saved = localStorage.getItem('mahacare-lang') || 'en';
      setLang(saved);
    } catch {}
  }, []);

  const switchLanguage = (targetLang: string) => {
    setLang(targetLang);
    try {
      localStorage.setItem('mahacare-lang', targetLang);
    } catch {}

    // Trigger Google Translate select element if present
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      select.value = targetLang;
      select.dispatchEvent(new Event('change'));
    } else {
      // Set cookie as fallback
      document.cookie = `googtrans=/en/${targetLang}; path=/;`;
      window.location.reload();
    }
  };

  return (
    <div className="pub-language-switcher notranslate" translate="no">
      <span className="flex items-center gap-1 text-slate-500 font-medium mr-1">
        <span className="hidden sm:inline">Language:</span>
      </span>
      <div className="inline-flex rounded-md border border-slate-200 bg-white shadow-xs p-0.5" role="group" aria-label="Language">
        <button
          type="button"
          onClick={() => switchLanguage('en')}
          className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
            lang === 'en' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          aria-label="Switch to English"
          aria-pressed={lang === 'en'}
        >
          <span className="hidden sm:inline">English</span>
          <span className="sm:hidden text-[11px]">EN</span>
        </button>
        <button
          type="button"
          onClick={() => switchLanguage('mr')}
          className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
            lang === 'mr' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          aria-label="मराठीमध्ये बदला (Switch to Marathi)"
          aria-pressed={lang === 'mr'}
        >
          <span className="text-[11px] sm:text-xs">मराठी</span>
        </button>
      </div>

    </div>
  );
}
