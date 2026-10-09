import {
  getTranslationResourceId,
  isLanguage,
  translationLanguages,
} from "@/lib/quran-types";
import type { Language, VerseSearchResponse, VerseSearchResult } from "@/lib/quran-types";

const QURAN_API_URL = "https://api.quran.com/api/v4";
const languages: Language[] = ["ar", ...translationLanguages];
const PAGE_SIZE = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanTranslationText(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("query")?.trim() ?? "";
  const language = params.get("language");
  const pageValue = params.get("page") ?? "0";
  const page = Number(pageValue);

  if (!query || query.length > 100) {
    return Response.json({ error: "Enter a search term between 1 and 100 characters." }, { status: 400 });
  }
  if (language === null || !isLanguage(language) || !languages.includes(language)) {
    return Response.json({ error: "Choose a supported Quran language to search." }, { status: 400 });
  }
  if (!Number.isInteger(page) || page < 0 || page > 1000) {
    return Response.json({ error: "The search results page is invalid." }, { status: 400 });
  }

  try {
    const searchParams = new URLSearchParams({
      q: query,
      size: String(PAGE_SIZE),
      page: String(page + 1),
      language: language === "ar" ? "en" : language,
    });
    searchParams.set(
      "translations",
      String(language === "ar" ? getTranslationResourceId("en") : getTranslationResourceId(language)),
    );

    const response = await fetch(`${QURAN_API_URL}/search?${searchParams.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Quran.com returned ${response.status} while searching Quran content.`);
    }

    const payload: unknown = await response.json();
    if (
      !isRecord(payload) ||
      !isRecord(payload.search) ||
      typeof payload.search.query !== "string" ||
      !Number.isInteger(payload.search.total_pages) ||
      typeof payload.search.total_pages !== "number" ||
      payload.search.total_pages < 0 ||
      !Number.isInteger(payload.search.total_results) ||
      typeof payload.search.total_results !== "number" ||
      payload.search.total_results < 0 ||
      !Array.isArray(payload.search.results)
    ) {
      throw new Error("Quran.com returned an invalid search response.");
    }

    const results: VerseSearchResult[] = payload.search.results.map((result, index) => {
      if (
        !isRecord(result) ||
        typeof result.verse_key !== "string" ||
        typeof result.text !== "string" ||
        !Array.isArray(result.translations)
      ) {
        throw new Error(`Quran.com returned invalid search data at position ${index + 1}.`);
      }

      const matchingTranslation =
        language === "ar"
          ? undefined
          : result.translations.find(
              (translation) =>
                isRecord(translation) &&
                translation.resource_id === getTranslationResourceId(language),
            );
      if (matchingTranslation !== undefined && (!isRecord(matchingTranslation) || typeof matchingTranslation.text !== "string")) {
        throw new Error(`Quran.com returned an invalid translation at search position ${index + 1}.`);
      }

      return {
        verse_key: result.verse_key,
        arabic_text: result.text,
        translation_text:
          isRecord(matchingTranslation) && typeof matchingTranslation.text === "string"
            ? cleanTranslationText(matchingTranslation.text)
            : null,
      };
    });

    const searchResponse: VerseSearchResponse = {
      query: payload.search.query,
      current_page: page,
      total_pages: payload.search.total_pages,
      total_results: payload.search.total_results,
      results,
    };
    return Response.json(searchResponse);
  } catch (error) {
    console.error("Unable to search Quran content.", error);
    return Response.json(
      { error: "Quran search is temporarily unavailable. Please try again." },
      { status: 502 },
    );
  }
}
