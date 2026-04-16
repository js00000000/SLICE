import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zhTw from './locales/zh-tw.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-TW': { translation: zhTw },
      'zh': { translation: zhTw }
    },
    fallbackLng: 'zh-TW',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
