export type Language = "ar" | "en" | "ne" | "ur";
export type TranslationLanguage = Exclude<Language, "ar">;

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
};

export function getTranslationResourceId(language: TranslationLanguage): number {
  return resourceIdByLanguage[language];
}

export function getTranslation(verse: Verse, language: TranslationLanguage): string | undefined {
  return verse.translations.find((translation) => translation.resource_id === getTranslationResourceId(language))?.text;
}
