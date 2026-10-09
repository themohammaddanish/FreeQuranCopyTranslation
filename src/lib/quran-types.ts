export type Language =
  | "ar"
  | "bn"
  | "de"
  | "en"
  | "es"
  | "fa"
  | "fr"
  | "id"
  | "ne"
  | "pt"
  | "ru"
  | "tr"
  | "ur"
  | "zh";
export type TranslationLanguage = Exclude<Language, "ar">;

export const translationLanguages: TranslationLanguage[] = [
  "en",
  "ne",
  "ur",
  "es",
  "fr",
  "id",
  "bn",
  "tr",
  "fa",
  "ru",
  "de",
  "pt",
  "zh",
];

export const coreLanguages: Language[] = ["ar", "en", "ne", "ur"];

export const languageLabels: Record<Language, string> = {
  ar: "Arabic",
  bn: "Bengali",
  de: "German",
  en: "English",
  es: "Spanish",
  fa: "Persian",
  fr: "French",
  id: "Indonesian",
  ne: "Nepali",
  pt: "Portuguese",
  ru: "Russian",
  tr: "Turkish",
  ur: "Urdu",
  zh: "Chinese (Simplified)",
};

export const translationNames: Record<TranslationLanguage, string> = {
  en: "Saheeh International",
  ne: "Ahl Al-Hadith Central Society of Nepal",
  ur: "Muhammad Junagarhi",
  es: "Sheikh Isa Garcia",
  fr: "Muhammad Hamidullah",
  id: "Indonesian Islamic Affairs Ministry",
  bn: "Taisirul Quran",
  tr: "Turkish Translation (Diyanet)",
  fa: "Hussein Taji Kal Dari",
  ru: "Elmir Kuliev",
  de: "Frank Bubenheim and Nadeem",
  pt: "Samir El-Hayek",
  zh: "Ma Jian",
};

export type Chapter = {
  id: number;
  name_arabic: string;
  name_simple: string;
  verses_count: number;
  translated_name: {
    name: string;
  };
};

export type Verse = {
  verse_key: string;
  verse_number: number;
  page_number: number;
  text_uthmani: string;
  translations: {
    resource_id: number;
    text: string;
  }[];
};

export type VerseSearchResult = {
  verse_key: string;
  arabic_text: string;
  translation_text: string | null;
};

export type VerseSearchResponse = {
  query: string;
  current_page: number;
  total_pages: number;
  total_results: number;
  results: VerseSearchResult[];
};

const resourceIdByLanguage: Record<TranslationLanguage, number> = {
  en: 20,
  ur: 54,
  ne: 108,
  es: 83,
  fr: 31,
  id: 33,
  bn: 161,
  tr: 77,
  fa: 29,
  ru: 45,
  de: 27,
  pt: 43,
  zh: 56,
};

export function isLanguage(value: string | null | undefined): value is Language {
  return typeof value === "string" && Object.hasOwn(languageLabels, value);
}

export function isTranslationLanguage(value: string | null | undefined): value is TranslationLanguage {
  return typeof value === "string" && translationLanguages.some((language) => language === value);
}

export function getTranslationResourceId(language: TranslationLanguage): number {
  return resourceIdByLanguage[language];
}

export function getTranslation(verse: Verse, language: TranslationLanguage): string | undefined {
  return verse.translations.find((translation) => translation.resource_id === getTranslationResourceId(language))?.text;
}
