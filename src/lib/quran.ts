import type { Chapter, Verse } from "@/lib/quran-types";

const QURAN_API_URL = "https://api.quran.com/api/v4";
const TRANSLATION_IDS: number[] = [20, 54, 108];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTranslationResourceId(value: unknown): number | null {
  return isRecord(value) && typeof value.resource_id === "number" ? value.resource_id : null;
}

function cleanTranslationText(text: string): string {
  return text.replace(/<[^>]*>/g, "");
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

export async function getChapterVerses(chapterId: number): Promise<Verse[]> {
  const query = new URLSearchParams({
    language: "en",
    translations: TRANSLATION_IDS.join(","),
    fields: "text_uthmani",
    per_page: "300",
  });
  const response = await fetch(
    `${QURAN_API_URL}/verses/by_chapter/${chapterId}?${query.toString()}`,
    { next: { revalidate: 86_400 } },
  );

  if (!response.ok) {
    throw new Error(`Quran.com returned ${response.status} while loading chapter ${chapterId}.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.verses)) {
    throw new Error(`Quran.com returned an invalid verses response for chapter ${chapterId}.`);
  }

  return payload.verses.map((verse, index) => {
    if (
      !isRecord(verse) ||
      typeof verse.verse_key !== "string" ||
      typeof verse.verse_number !== "number" ||
      typeof verse.text_uthmani !== "string" ||
      !Array.isArray(verse.translations)
    ) {
      throw new Error(`Quran.com returned invalid verse data at position ${index + 1}.`);
    }

    const translations = verse.translations.flatMap((translation) => {
      if (
        !isRecord(translation) ||
        typeof translation.resource_id !== "number" ||
        typeof translation.text !== "string" ||
        !TRANSLATION_IDS.includes(translation.resource_id)
      ) {
        return [];
      }

      return [{
        resource_id: translation.resource_id,
        text: cleanTranslationText(translation.text),
      }];
    });

    return {
      verse_key: verse.verse_key,
      verse_number: verse.verse_number,
      text_uthmani: verse.text_uthmani,
      translations,
    };
  });
}
