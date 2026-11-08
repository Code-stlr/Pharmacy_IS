import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
export const languages = { en: 'English', kk: 'Қазақша', ru: 'Русский' }
void i18n.use(initReactI18next).init({
  lng: 'en', fallbackLng: 'en', interpolation: { escapeValue: false },
  resources: {
    en: { translation: { title: 'Pharmacy IS', subtitle: 'Educational pharmacy information system', language: 'Language', heading: 'Application foundation', description: 'The application structure is ready. Patient records, prescriptions and dispensing will follow in the next implementation phase.', checking: 'Checking connection…', ready: 'API and database connected', offline: 'API or database unavailable', retry: 'Check again' } },
    kk: { translation: { title: 'Pharmacy IS', subtitle: 'Дәріхананың оқу ақпараттық жүйесі', language: 'Тіл', heading: 'Қолданбаның негізі', description: 'Қолданба құрылымы дайын. Пациенттер, рецепттер және дәрі беру келесі кезеңде іске асырылады.', checking: 'Байланыс тексерілуде…', ready: 'API мен дерекқор қосылған', offline: 'API немесе дерекқор қолжетімсіз', retry: 'Қайта тексеру' } },
    ru: { translation: { title: 'Pharmacy IS', subtitle: 'Учебная информационная система аптеки', language: 'Язык', heading: 'Основа приложения', description: 'Структура приложения готова. Пациенты, рецепты и отпуск лекарств появятся на следующем этапе.', checking: 'Проверка соединения…', ready: 'API и база данных подключены', offline: 'API или база данных недоступны', retry: 'Проверить снова' } },
  },
})
export default i18n
