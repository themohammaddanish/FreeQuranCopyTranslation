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
  text_uthmani: string;
  translations: {
    resource_id: number;
    text: string;
  }[];
};

const resourceIdByLanguage: Record<TranslationLanguage, number> = {
  en: 20,
  ur: 54,
  ne: 108,
};

export function getTranslation(verse: Verse, language: TranslationLanguage): string | undefined {
  return verse.translations.find(
    (translation) => translation.resource_id === resourceIdByLanguage[language],
  )?.text;
}
