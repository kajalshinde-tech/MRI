'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          container: string,
        ) => unknown;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

/** Keep Google's DOM outside the public shell, which unmounts on navigation. */
export default function GoogleTranslate() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    // Next renders route announcements as bare text through a shadow-DOM
    // portal. Translation must not replace text owned by that live region.
    const protectRouteAnnouncements = () => {
      document.querySelectorAll('next-route-announcer').forEach(announcer => {
        announcer.setAttribute('translate', 'no');
        announcer.classList.add('notranslate');
        announcer.shadowRoot?.querySelector('[role="alert"]')?.setAttribute('translate', 'no');
      });
    };
    protectRouteAnnouncements();
    const observer = new MutationObserver(protectRouteAnnouncements);
    observer.observe(document.body, { childList: true });

    const initialize = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      // Google owns the host's children. Never recreate them during a rerender
      // or the development Strict Mode effect replay.
      if (!TranslateElement || container.childNodes.length > 0) return;
      new TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,mr,hi',
        autoDisplay: false,
      }, container.id);
    };

    window.googleTranslateElementInit = initialize;
    if (window.google?.translate?.TranslateElement) {
      initialize();
    } else if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      observer.disconnect();
      if (window.googleTranslateElementInit === initialize) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  return <div ref={host} id="google_translate_element" className="notranslate" translate="no" hidden />;
}
