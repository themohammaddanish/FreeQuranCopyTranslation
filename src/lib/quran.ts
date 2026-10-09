import type { Chapter, Verse } from "@/lib/quran-types";
import {
  getTranslationResourceId,
  isTranslationLanguage,
} from "@/lib/quran-types";
import type { TranslationLanguage } from "@/lib/quran-types";

const QURAN_API_URL = "https://api.quran.com/api/v4";
const DEFAULT_TRANSLATIONS: TranslationLanguage[] = ["en", "ne", "ur"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTranslationResourceIdFromPayload(value: unknown): number | null {
  return isRecord(value) && typeof value.resource_id === "number" ? value.resource_id : null;
}

function cleanTranslationText(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

export function parseTranslationLanguages(value: string | null): TranslationLanguage[] | null {
  if (value === null) return DEFAULT_TRANSLATIONS;
  if (value === "") return [];

  const languages = value.split(",");
  if (!languages.every(isTranslationLanguage)) return null;
  return [...new Set(languages)];
}

export async function getChapters(): Promise<Chapter[]> {
  const response = await fetch(`${QURAN_API_URL}/chapters?language=en`, {
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error(`Quran.com returned ${response.status} while loading chapters.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.chapters)) {
    throw new Error("Quran.com returned an invalid chapters response.");
  }

  return payload.chapters.map((chapter, index) => {
    if (
      !isRecord(chapter) ||
      typeof chapter.id !== "number" ||
      typeof chapter.name_arabic !== "string" ||
      typeof chapter.name_simple !== "string" ||
      typeof chapter.verses_count !== "number" ||
      !isRecord(chapter.translated_name) ||
      typeof chapter.translated_name.name !== "string"
    ) {
      throw new Error(`Quran.com returned invalid chapter data at position ${index + 1}.`);
    }

    return {
      id: chapter.id,
      name_arabic: chapter.name_arabic,
      name_simple: chapter.name_simple,
      verses_count: chapter.verses_count,
      translated_name: { name: chapter.translated_name.name },
    };
  });
}

async function getVerses(path: string, languages: TranslationLanguage[]): Promise<Verse[]> {
  const translationIds = languages.map(getTranslationResourceId);
  const query = new URLSearchParams({
    language: "en",
    fields: "text_uthmani",
    per_page: "300",
  });
  if (translationIds.length > 0) query.set("translations", translationIds.join(","));
  const response = await fetch(`${QURAN_API_URL}${path}?${query.toString()}`, {
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error(`Quran.com returned ${response.status} while loading Quran verses.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.verses)) {
    throw new Error("Quran.com returned an invalid verses response.");
  }

  return payload.verses.map((verse, index) => {
    if (
      !isRecord(verse) ||
      typeof verse.verse_key !== "string" ||
      typeof verse.verse_number !== "number" ||
      typeof verse.page_number !== "number" ||
      typeof verse.text_uthmani !== "string" ||
      (translationIds.length > 0 && !Array.isArray(verse.translations))
    ) {
      throw new Error(`Quran.com returned invalid verse data at position ${index + 1}.`);
    }

    const verseTranslations = Array.isArray(verse.translations) ? verse.translations : [];
    const translations = verseTranslations.flatMap((translation) => {
      if (
        !isRecord(translation) ||
        typeof translation.text !== "string"
      ) {
        return [];
      }

      const resourceId = getTranslationResourceIdFromPayload(translation);
      if (resourceId === null || !translationIds.includes(resourceId)) return [];

      return [{
        resource_id: resourceId,
        text: cleanTranslationText(translation.text),
      }];
    });

    return {
      verse_key: verse.verse_key,
      verse_number: verse.verse_number,
      page_number: verse.page_number,
      text_uthmani: verse.text_uthmani,
      translations,
    };
  });
}

export async function getChapterVerses(
  chapterId: number,
  languages: TranslationLanguage[] = DEFAULT_TRANSLATIONS,
): Promise<Verse[]> {
  return getVerses(`/verses/by_chapter/${chapterId}`, languages);
}

export async function getPageVerses(
  pageNumber: number,
  languages: TranslationLanguage[] = DEFAULT_TRANSLATIONS,
): Promise<Verse[]> {
  return getVerses(`/verses/by_page/${pageNumber}`, languages);
}

export async function getAllVerses(languages: TranslationLanguage[]): Promise<Verse[]> {
  const chapters = await getChapters();
  const verses: Verse[] = [];
  const batchSize = 8;

  for (let index = 0; index < chapters.length; index += batchSize) {
    const batch = chapters.slice(index, index + batchSize);
    const batchVerses = await Promise.all(
      batch.map((chapter) => getChapterVerses(chapter.id, languages)),
    );
    batch.forEach((chapter, batchIndex) => {
      if (batchVerses[batchIndex].length !== chapter.verses_count) {
        throw new Error(`Quran.com returned an incomplete verse list for chapter ${chapter.id}.`);
      }
      verses.push(...batchVerses[batchIndex]);
    });
  }

  const expectedVerseCount = chapters.reduce((total, chapter) => total + chapter.verses_count, 0);
  if (verses.length !== expectedVerseCount) {
    throw new Error(`Quran.com returned ${verses.length} verses; expected ${expectedVerseCount}.`);
  }

  return verses;
}
