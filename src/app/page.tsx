"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { getTranslation } from "@/lib/quran-types";
import type {
  Chapter,
  Language,
  TranslationLanguage,
  Verse,
  VerseSearchResponse,
} from "@/lib/quran-types";
import { readingGuideItems, readingGuideSource } from "@/lib/reading-guide";

type ReadingMode = "single" | "paired" | "all";
type ReadingStyle = "ayah" | "book";
type ReaderTheme = "paper" | "sepia" | "night";
type TextSize = "small" | "medium" | "large";
type LineSpacing = "standard" | "spacious";
const TOTAL_MUSHAF_PAGES = 604;

const languageLabels: Record<Language, string> = {
  ar: "Arabic",
  en: "English",
  ne: "Nepali",
  ur: "Urdu",
};

const translatedNames: Record<TranslationLanguage, string> = {
  en: "Saheeh International",
  ne: "Ahl Al-Hadith Central Society of Nepal",
  ur: "Muhammad Junagarhi",
};

const translationLanguages: TranslationLanguage[] = ["en", "ne", "ur"];
const allLanguages: Language[] = ["ar", "en", "ne", "ur"];
const PREFERENCES_KEY = "free-quran-reader-preferences-v1";

type ReaderPreferences = {
  mode: ReadingMode;
  readingStyle: ReadingStyle;
  pageMode: boolean;
  singleLanguage: Language;
  translationLanguage: TranslationLanguage;
  readerTheme: ReaderTheme;
  textSize: TextSize;
  lineSpacing: LineSpacing;
};

function isLanguage(value: string): value is Language {
  return Object.hasOwn(languageLabels, value);
}

function isTranslationLanguage(value: string): value is TranslationLanguage {
  return translationLanguages.some((language) => language === value);
}

function isReadingMode(value: unknown): value is ReadingMode {
  return value === "single" || value === "paired" || value === "all";
}

function isReadingStyle(value: unknown): value is ReadingStyle {
  return value === "ayah" || value === "book";
}

function isReaderTheme(value: unknown): value is ReaderTheme {
  return value === "paper" || value === "sepia" || value === "night";
}

function isTextSize(value: unknown): value is TextSize {
  return value === "small" || value === "medium" || value === "large";
}

function isLineSpacing(value: unknown): value is LineSpacing {
  return value === "standard" || value === "spacious";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isVerseSearchResponse(value: unknown): value is VerseSearchResponse {
  return (
    isRecord(value) &&
    typeof value.query === "string" &&
    typeof value.current_page === "number" &&
    typeof value.total_pages === "number" &&
    typeof value.total_results === "number" &&
    Array.isArray(value.results) &&
    value.results.every(
      (result) =>
        isRecord(result) &&
        typeof result.verse_key === "string" &&
        typeof result.arabic_text === "string" &&
        (typeof result.translation_text === "string" || result.translation_text === null),
    )
  );
}

function isChapter(value: unknown): value is Chapter {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name_arabic === "string" &&
    typeof value.name_simple === "string" &&
    typeof value.verses_count === "number" &&
    isRecord(value.translated_name) &&
    typeof value.translated_name.name === "string"
  );
}

function isVerse(value: unknown): value is Verse {
  return (
    isRecord(value) &&
    typeof value.verse_key === "string" &&
    typeof value.verse_number === "number" &&
    typeof value.page_number === "number" &&
    typeof value.text_uthmani === "string" &&
    Array.isArray(value.translations) &&
    value.translations.every(
      (translation) =>
        isRecord(translation) &&
        typeof translation.resource_id === "number" &&
        typeof translation.text === "string",
    )
  );
}

async function readJson(response: Response): Promise<unknown> {
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "The Quran content could not be loaded.";
    throw new Error(message);
  }
  return payload;
}

export default function Home() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterId, setChapterId] = useState(1);
  const [chapterRequestId, setChapterRequestId] = useState(0);
  const [verseRequestId, setVerseRequestId] = useState(0);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [pageMode, setPageMode] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [mode, setMode] = useState<ReadingMode>("paired");
  const [pdfMode, setPdfMode] = useState<ReadingMode>("paired");
  const [pdfSingleLanguage, setPdfSingleLanguage] = useState<Language>("ar");
  const [pdfTranslationLanguage, setPdfTranslationLanguage] = useState<TranslationLanguage>("en");
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [readingStyle, setReadingStyle] = useState<ReadingStyle>("ayah");
  const [singleLanguage, setSingleLanguage] = useState<Language>("ar");
  const [translationLanguage, setTranslationLanguage] = useState<TranslationLanguage>("en");
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>("paper");
  const [textSize, setTextSize] = useState<TextSize>("medium");
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("standard");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isLoadingVerses, setIsLoadingVerses] = useState(true);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [verseError, setVerseError] = useState<string | null>(null);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [showPreferenceSetup, setShowPreferenceSetup] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [chapterSearch, setChapterSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [searchLanguage, setSearchLanguage] = useState<Language>("en");
  const [searchResults, setSearchResults] = useState<VerseSearchResponse["results"]>([]);
  const [searchPage, setSearchPage] = useState(0);
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pendingVerseKey, setPendingVerseKey] = useState<string | null>(null);
  const [highlightedVerseKey, setHighlightedVerseKey] = useState<string | null>(null);
  const searchControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<HTMLElement>(null);
  const pendingPageScrollRef = useRef(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(PREFERENCES_KEY);
      if (!storedValue) {
        setShowPreferenceSetup(true);
      } else {
        const saved: unknown = JSON.parse(storedValue);
        if (
          isRecord(saved) &&
          isReadingMode(saved.mode) &&
          typeof saved.singleLanguage === "string" &&
          isLanguage(saved.singleLanguage) &&
          typeof saved.translationLanguage === "string" &&
          isTranslationLanguage(saved.translationLanguage)
        ) {
          setMode(saved.mode);
          if (isReadingStyle(saved.readingStyle)) setReadingStyle(saved.readingStyle);
          if (typeof saved.pageMode === "boolean") setPageMode(saved.pageMode);
          setSingleLanguage(saved.singleLanguage);
          setTranslationLanguage(saved.translationLanguage);
          if (isReaderTheme(saved.readerTheme)) setReaderTheme(saved.readerTheme);
          if (isTextSize(saved.textSize)) setTextSize(saved.textSize);
          if (isLineSpacing(saved.lineSpacing)) setLineSpacing(saved.lineSpacing);
        } else {
          setShowPreferenceSetup(true);
        }
      }
    } catch (loadError) {
      console.error("Unable to read saved Quran reader preferences.", loadError);
      setShowPreferenceSetup(true);
    } finally {
      setPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesReady || showPreferenceSetup) return;
    try {
      const preferences: ReaderPreferences = {
        mode,
        readingStyle,
        pageMode,
        singleLanguage,
        translationLanguage,
        readerTheme,
        textSize,
        lineSpacing,
      };
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      setPreferenceError(null);
    } catch (saveError) {
      console.error("Unable to save Quran reader preferences.", saveError);
      setPreferenceError("Your preferences could not be saved in this browser.");
    }
  }, [
    mode,
    readingStyle,
    pageMode,
    singleLanguage,
    translationLanguage,
    readerTheme,
    textSize,
    lineSpacing,
    preferencesReady,
    showPreferenceSetup,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadChapters() {
      setIsLoadingChapters(true);
      try {
        const response = await fetch("/api/chapters", { signal: controller.signal });
        const payload = await readJson(response);
        if (!isRecord(payload) || !Array.isArray(payload.chapters) || !payload.chapters.every(isChapter)) {
          throw new Error("The chapter list had an unexpected format.");
        }
        setChapters(payload.chapters);
        setChapterError(null);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setChapterError(loadError instanceof Error ? loadError.message : "Chapters could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingChapters(false);
      }
    }

    void loadChapters();
    return () => controller.abort();
  }, [chapterRequestId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadVerses() {
      setIsLoadingVerses(true);
      setVerseError(null);
      try {
        const verseUrl = pageMode
          ? `/api/pages/${pageNumber}/verses`
          : `/api/chapters/${chapterId}/verses`;
        const response = await fetch(verseUrl, {
          signal: controller.signal,
        });
        const payload = await readJson(response);
        if (!isRecord(payload) || !Array.isArray(payload.verses) || !payload.verses.every(isVerse)) {
          throw new Error("The chapter verses had an unexpected format.");
        }
        setVerses(payload.verses);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setVerses([]);
          setVerseError(loadError instanceof Error ? loadError.message : "This chapter could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingVerses(false);
      }
    }

    void loadVerses();
    return () => controller.abort();
  }, [chapterId, pageMode, pageNumber, verseRequestId]);

  const chapter = chapters.find((item) => item.id === chapterId);
  const visibleChapterId =
    pageMode && verses.length > 0
      ? Number(verses[0].verse_key.split(":")[0]) || chapterId
      : chapterId;
  const visibleChapter = chapters.find((item) => item.id === visibleChapterId);
  const pageVerseSummary = (() => {
    const firstVerseKey = verses[0]?.verse_key;
    const lastVerseKey = verses.at(-1)?.verse_key;
    if (!firstVerseKey || !lastVerseKey) return "";
    const [firstChapter, firstVerse] = firstVerseKey.split(":");
    const [lastChapter, lastVerse] = lastVerseKey.split(":");
    return firstChapter === lastChapter
      ? `Verses ${firstVerseKey}–${lastVerse}`
      : `Verses ${firstVerseKey}–${lastVerseKey}`;
  })();
  const visibleLanguages = useMemo<Language[]>(() => {
    if (mode === "all") return allLanguages;
    if (mode === "single") return [singleLanguage];
    return ["ar", translationLanguage];
  }, [mode, singleLanguage, translationLanguage]);

  useEffect(() => {
    if (!visibleLanguages.includes(searchLanguage)) {
      searchControllerRef.current?.abort();
      setIsSearching(false);
      const preferredSearchLanguage =
        mode === "single" ? singleLanguage : mode === "paired" ? translationLanguage : "ar";
      setSearchLanguage(preferredSearchLanguage);
      setSearchResults([]);
      setActiveSearchQuery("");
      setSearchError(null);
      setSearchTotalPages(0);
      setSearchTotalResults(0);
    }
  }, [searchLanguage, visibleLanguages, mode, singleLanguage, translationLanguage]);

  useEffect(() => {
    return () => searchControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    function updateBackToTopVisibility() {
      setShowBackToTop(window.scrollY > 500);
    }

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateBackToTopVisibility);
  }, []);

  useEffect(() => {
    if (!pendingPageScrollRef.current) return;
    if (!pageMode) {
      pendingPageScrollRef.current = false;
      return;
    }
    if (isLoadingVerses) return;

    pendingPageScrollRef.current = false;
    document.getElementById("mushaf-page-heading")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [isLoadingVerses, pageMode, pageNumber]);

  useEffect(() => {
    if (!pendingVerseKey || isLoadingVerses) return;
    const verse = verses.find((item) => item.verse_key === pendingVerseKey);
    if (!verse) return;

    const element = document.getElementById(`ayah-${pendingVerseKey}`);
    if (!element) return;
    setHighlightedVerseKey(pendingVerseKey);
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus({ preventScroll: true });
    setPendingVerseKey(null);
  }, [pendingVerseKey, isLoadingVerses, verses]);

  async function searchVerses(query: string, page: number, append: boolean) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    setIsSearching(true);
    setSearchError(null);
    if (!append) {
      setSearchResults([]);
      setSearchPage(0);
      setSearchTotalPages(0);
      setSearchTotalResults(0);
      setActiveSearchQuery(normalizedQuery);
    }

    try {
      const params = new URLSearchParams({
        query: normalizedQuery,
        language: searchLanguage,
        page: String(page),
      });
      const response = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      });
      const payload = await readJson(response);
      if (!isVerseSearchResponse(payload)) {
        throw new Error("Search results had an unexpected format.");
      }
      setSearchResults((current) => append ? [...current, ...payload.results] : payload.results);
      setSearchPage(payload.current_page);
      setSearchTotalPages(payload.total_pages);
      setSearchTotalResults(payload.total_results);
    } catch (loadError) {
      if (!controller.signal.aborted) {
        setSearchError(loadError instanceof Error ? loadError.message : "Quran search could not be completed.");
      }
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  }

  function submitVerseSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingVerseKey(null);
    setHighlightedVerseKey(null);
    void searchVerses(searchInput, 0, false);
  }

  function chooseChapterFromSearch(value: string) {
    setChapterSearch(value);
    const normalizedValue = value.trim().toLocaleLowerCase();
    const selectedChapter = chapters.find((item) => {
      const datalistValue =
        `${item.id}. ${item.name_simple} — ${item.name_arabic} — ${item.translated_name.name}`.toLocaleLowerCase();
      return (
        item.id.toString() === normalizedValue ||
        item.name_simple.toLocaleLowerCase() === normalizedValue ||
        item.name_arabic.toLocaleLowerCase() === normalizedValue ||
        item.translated_name.name.toLocaleLowerCase() === normalizedValue ||
        datalistValue === normalizedValue
      );
    });
    if (selectedChapter) {
      changeChapter(selectedChapter.id);
      setChapterSearch("");
    }
  }

  function openSearchResult(verseKey: string) {
    const chapterNumber = Number(verseKey.split(":")[0]);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 114) return;
    changeChapter(chapterNumber, verseKey);
  }

  function startReading() {
    try {
      const preferences: ReaderPreferences = {
        mode,
        readingStyle,
        pageMode,
        singleLanguage,
        translationLanguage,
        readerTheme,
        textSize,
        lineSpacing,
      };
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      setPreferenceError(null);
      setShowPreferenceSetup(false);
    } catch (saveError) {
      console.error("Unable to save Quran reader preferences.", saveError);
      setPreferenceError("Your preferences could not be saved. Please check browser storage and try again.");
    }
  }

  function continueWithoutSaving() {
    setShowPreferenceSetup(false);
  }

  function changePage(nextPageNumber: number) {
    if (nextPageNumber < 1 || nextPageNumber > TOTAL_MUSHAF_PAGES || nextPageNumber === pageNumber) return;
    pendingPageScrollRef.current = true;
    setIsLoadingVerses(true);
    setPageNumber(nextPageNumber);
    setPageInput(String(nextPageNumber));
    setHighlightedVerseKey(null);
  }

  function submitPageJump(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestedPage = Number(pageInput);
    if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > TOTAL_MUSHAF_PAGES) {
      setPageInput(String(pageNumber));
      return;
    }
    changePage(requestedPage);
  }

  function changeChapter(nextChapterId: number, targetVerseKey: string | null = null) {
    if (nextChapterId >= 1 && nextChapterId <= 114) {
      setPageMode(false);
      setChapterId(nextChapterId);
      setPendingVerseKey(targetVerseKey);
      setHighlightedVerseKey(null);
    }
  }

  function openPdfDialog() {
    setPdfMode(mode);
    setPdfSingleLanguage(singleLanguage);
    setPdfTranslationLanguage(translationLanguage);
    setShowPdfDialog(true);
  }

  function getPdfUrl(): string {
    const params = new URLSearchParams({ mode: pdfMode });
    if (pdfMode === "single") params.set("language", pdfSingleLanguage);
    if (pdfMode === "paired") params.set("translation", pdfTranslationLanguage);
    return `/print?${params.toString()}`;
  }

  return (
    <main className="site-shell">
      {preferencesReady && showPreferenceSetup && (
        <div className="preference-backdrop">
          <section
            className="preference-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preference-title"
            aria-describedby="preference-description"
          >
            <p className="eyebrow">MAKE IT YOURS</p>
            <h1 id="preference-title">How would you like to read?</h1>
            <p className="preference-description" id="preference-description">
              Choose your preferred language and reading layout. You can change these any time.
            </p>

            <fieldset className="preference-fieldset">
              <legend>Reading layout</legend>
              <div className="preference-options">
                {([
                  ["single", "One language", "Read in just one language."],
                  ["paired", "Arabic + translation", "Read Arabic alongside one translation."],
                  ["all", "All four", "See Arabic, English, Nepali, and Urdu together."],
                ] as const).map(([value, title, description]) => (
                  <label
                    className={`preference-option ${mode === value ? "selected" : ""}`}
                    key={value}
                  >
                    <input
                      type="radio"
                      name="reading-layout"
                      value={value}
                      checked={mode === value}
                      autoFocus={mode === value}
                      onChange={() => setMode(value)}
                    />
                    <span className="preference-option-title">{title}</span>
                    <span className="preference-option-description">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="preference-fieldset preference-style-fieldset">
              <legend>Text style</legend>
              <div className="preference-options preference-style-options">
                {([
                  ["ayah", "Ayah by ayah", "Keep each verse in its own row."],
                  ["book", "Book page", "Read flowing paragraphs with verse markers."],
                ] as const).map(([value, title, description]) => (
                  <label
                    className={`preference-option ${readingStyle === value ? "selected" : ""}`}
                    key={value}
                  >
                    <input
                      type="radio"
                      name="reading-style"
                      value={value}
                      checked={readingStyle === value}
                      onChange={() => setReadingStyle(value)}
                    />
                    <span className="preference-option-title">{title}</span>
                    <span className="preference-option-description">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {mode === "single" && (
              <div className="preference-language">
                <label htmlFor="setup-single-language">Preferred language</label>
                <select
                  id="setup-single-language"
                  value={singleLanguage}
                  onChange={(event) => {
                    if (isLanguage(event.target.value)) setSingleLanguage(event.target.value);
                  }}
                >
                  {allLanguages.map((language) => (
                    <option key={language} value={language}>{languageLabels[language]}</option>
                  ))}
                </select>
              </div>
            )}
            {mode === "paired" && (
              <div className="preference-language">
                <label htmlFor="setup-translation-language">Preferred translation</label>
                <select
                  id="setup-translation-language"
                  value={translationLanguage}
                  onChange={(event) => {
                    if (isTranslationLanguage(event.target.value)) {
                      setTranslationLanguage(event.target.value);
                    }
                  }}
                >
                  {translationLanguages.map((language) => (
                    <option key={language} value={language}>{languageLabels[language]}</option>
                  ))}
                </select>
              </div>
            )}
            {mode === "all" && (
              <p className="preference-all-languages">Arabic · English · Nepali · Urdu</p>
            )}

            {preferenceError && <p className="preference-error" role="alert">{preferenceError}</p>}
            <button className="start-reading-button" type="button" onClick={startReading}>
              Start reading <span aria-hidden="true">→</span>
            </button>
            {preferenceError && (
              <button
                className="continue-without-saving"
                type="button"
                onClick={continueWithoutSaving}
              >
                Continue without saving
              </button>
            )}
          </section>
        </div>
      )}

      {showPdfDialog && (
        <div className="preference-backdrop">
          <section
            className="preference-dialog pdf-export-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-export-title"
            aria-describedby="pdf-export-description"
          >
            <button
              className="pdf-dialog-close"
              type="button"
              aria-label="Close PDF options"
              onClick={() => setShowPdfDialog(false)}
            >
              ×
            </button>
            <p className="eyebrow">FULL QURAN PDF</p>
            <h2 id="pdf-export-title">Choose what to include</h2>
            <p className="preference-description" id="pdf-export-description">
              Prepare the complete Quran in a print-ready layout. Your browser will open its print dialog;
              choose “Save as PDF” to download a file.
            </p>

            <fieldset className="preference-fieldset">
              <legend>PDF languages</legend>
              <div className="preference-options">
                {([
                  ["single", "One language", "Choose Arabic or one translation."],
                  ["paired", "Arabic + translation", "Arabic alongside one translation."],
                  ["all", "All four languages", "Arabic, English, Nepali, and Urdu."],
                ] as const).map(([value, title, description]) => (
                  <label
                    className={`preference-option ${pdfMode === value ? "selected" : ""}`}
                    key={value}
                  >
                    <input
                      type="radio"
                      name="pdf-layout"
                      value={value}
                      checked={pdfMode === value}
                      onChange={() => setPdfMode(value)}
                    />
                    <span className="preference-option-title">{title}</span>
                    <span className="preference-option-description">{description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {pdfMode === "single" && (
              <div className="preference-language">
                <label htmlFor="pdf-single-language">Language</label>
                <select
                  id="pdf-single-language"
                  value={pdfSingleLanguage}
                  onChange={(event) => {
                    if (isLanguage(event.target.value)) setPdfSingleLanguage(event.target.value);
                  }}
                >
                  {allLanguages.map((language) => (
                    <option key={language} value={language}>{languageLabels[language]}</option>
                  ))}
                </select>
              </div>
            )}
            {pdfMode === "paired" && (
              <div className="preference-language">
                <label htmlFor="pdf-translation-language">Translation</label>
                <select
                  id="pdf-translation-language"
                  value={pdfTranslationLanguage}
                  onChange={(event) => {
                    if (isTranslationLanguage(event.target.value)) {
                      setPdfTranslationLanguage(event.target.value);
                    }
                  }}
                >
                  {translationLanguages.map((language) => (
                    <option key={language} value={language}>{languageLabels[language]}</option>
                  ))}
                </select>
              </div>
            )}
            <a
              className="pdf-export-submit"
              href={getPdfUrl()}
              target="_blank"
              rel="noreferrer"
              onClick={() => setShowPdfDialog(false)}
            >
              Prepare PDF <span aria-hidden="true">→</span>
            </a>
          </section>
        </div>
      )}

      <header className="topbar">
        <a className="brand" href="/" aria-label="Free Quran Copy Translation home">
          <span className="brand-mark" aria-hidden="true">۞</span>
          <span>
            <strong>Quran</strong>
            <span className="brand-subtitle">READ & REFLECT</span>
          </span>
        </a>
        <span className="topbar-note">Read, compare, or explore at your own pace</span>
      </header>

      <section className="intro">
        <p className="eyebrow">QURAN READER</p>
        <h1>Read and explore at your own pace.</h1>
        <p className="intro-copy">
          Choose Arabic or a translation in English, Nepali, or Urdu. No prior background is needed.
        </p>
      </section>

      <details className="reading-guide">
        <summary>New to these terms? Open the reading guide</summary>
        <div className="reading-guide-content">
          {readingGuideItems.map((item) => (
            <section key={item.term}>
              <h2>{item.term}</h2>
              <p>{item.description}</p>
            </section>
          ))}
          <p className="reading-guide-source">
            Reader terminology and chapter/verse references follow the{" "}
            <a href={readingGuideSource.href} target="_blank" rel="noreferrer">
              {readingGuideSource.label}
            </a>
            . Translation sources are identified below the reader.
          </p>
        </div>
      </details>

      <section
        className="reader"
        aria-label="Quran reader"
        data-reader-theme={readerTheme}
        data-text-size={textSize}
        data-line-spacing={lineSpacing}
        ref={readerRef}
      >
        <div className="reader-toolbar">
          <div className="chapter-picker">
            <label htmlFor="chapter-select">CHAPTER</label>
            <select
              id="chapter-select"
              value={visibleChapterId}
              disabled={isLoadingChapters || chapters.length === 0}
              onChange={(event) => changeChapter(Number(event.target.value))}
            >
              {chapters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}. {item.name_simple} — {item.name_arabic}
                </option>
              ))}
            </select>
          </div>
          <div className="chapter-search">
            <label htmlFor="chapter-search">FIND A CHAPTER</label>
            <input
              id="chapter-search"
              type="search"
              list="chapter-options"
              value={chapterSearch}
              placeholder="Name or number"
              disabled={isLoadingChapters || chapters.length === 0}
              onChange={(event) => chooseChapterFromSearch(event.target.value)}
            />
            <datalist id="chapter-options">
              {chapters.map((item) => (
                <option
                  key={item.id}
                  value={`${item.id}. ${item.name_simple} — ${item.name_arabic} — ${item.translated_name.name}`}
                />
              ))}
            </datalist>
          </div>
          {!pageMode && (
            <div className="chapter-navigation" aria-label="Chapter navigation">
              <button
                className="icon-button"
                type="button"
                aria-label="Previous chapter"
                disabled={visibleChapterId === 1 || isLoadingChapters}
                onClick={() => changeChapter(visibleChapterId - 1)}
              >
                ←
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="Next chapter"
                disabled={visibleChapterId === 114 || isLoadingChapters}
                onClick={() => changeChapter(visibleChapterId + 1)}
              >
                →
              </button>
            </div>
          )}
        </div>

        {chapterError && (
          <div className="inline-error" role="alert">
            <span>{chapterError}</span>
            <button type="button" onClick={() => setChapterRequestId((requestId) => requestId + 1)}>
              Retry
            </button>
          </div>
        )}

        <div className="chapter-heading" id={pageMode ? "mushaf-page-heading" : undefined}>
          <div>
            <p className="eyebrow">
              {pageMode ? `MUSHAF PAGE ${pageNumber} OF ${TOTAL_MUSHAF_PAGES}` : `CHAPTER ${chapterId}`}
            </p>
            <h2>{visibleChapter?.translated_name.name ?? "The Quran"}</h2>
            <p className="chapter-meta">
              {pageMode
                ? `${visibleChapter?.name_simple ?? "Loading chapter"}${pageVerseSummary ? ` · ${pageVerseSummary}` : ""}`
                : `${chapter?.name_simple ?? "Loading chapter"}${chapter ? ` · ${chapter.verses_count} verses` : ""}`}
            </p>
          </div>
          <p className="chapter-arabic" lang="ar" dir="rtl">
            {visibleChapter?.name_arabic ?? "القرآن الكريم"}
          </p>
        </div>

        {pageMode ? (
          <div className="mushaf-page-jump">
            <form className="page-jump-form" onSubmit={submitPageJump}>
              <label htmlFor="mushaf-page-input">PAGE</label>
              <div className="page-jump-controls">
                <input
                  id="mushaf-page-input"
                  type="number"
                  min={1}
                  max={TOTAL_MUSHAF_PAGES}
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  aria-label={`Go to a page from 1 to ${TOTAL_MUSHAF_PAGES}`}
                />
                <span>of {TOTAL_MUSHAF_PAGES}</span>
                <button type="submit">Go</button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="reading-controls">
          <div className="reader-view-switch" role="group" aria-label="Reader navigation style">
            <button type="button" aria-pressed={!pageMode} onClick={() => setPageMode(false)}>
              Chapter view
            </button>
            <button
              type="button"
              aria-pressed={pageMode}
              onClick={() => {
                const firstPage = verses[0]?.page_number ?? 1;
                setPageNumber(firstPage);
                setPageInput(String(firstPage));
                setPageMode(true);
              }}
            >
              Mushaf pages
            </button>
          </div>
          <div className="mode-switch" role="group" aria-label="Reading layout">
            <button type="button" aria-pressed={mode === "single"} onClick={() => setMode("single")}>
              One language
            </button>
            <button type="button" aria-pressed={mode === "paired"} onClick={() => setMode("paired")}>
              Arabic + translation
            </button>
            <button type="button" aria-pressed={mode === "all"} onClick={() => setMode("all")}>
              All four
            </button>
          </div>
          <button className="pdf-export-trigger" type="button" onClick={openPdfDialog}>
            <span aria-hidden="true">↓</span>
            Download Quran PDF
          </button>

          <div className="display-style-switch" role="group" aria-label="Text style">
            <button
              type="button"
              aria-pressed={readingStyle === "ayah"}
              onClick={() => setReadingStyle("ayah")}
            >
              Ayah by ayah
            </button>
            <button
              type="button"
              aria-pressed={readingStyle === "book"}
              onClick={() => setReadingStyle("book")}
            >
              Book page
            </button>
          </div>

          {preferenceError && !showPreferenceSetup && (
            <p className="preference-save-warning" role="status">{preferenceError}</p>
          )}

          {mode === "single" && (
            <div className="language-control">
              <label htmlFor="single-language">SHOW LANGUAGE</label>
              <select
                id="single-language"
                value={singleLanguage}
                onChange={(event) => {
                  if (isLanguage(event.target.value)) setSingleLanguage(event.target.value);
                }}
              >
                {allLanguages.map((language) => (
                  <option key={language} value={language}>{languageLabels[language]}</option>
                ))}
              </select>
            </div>
          )}
          {mode === "paired" && (
            <div className="language-control">
              <label htmlFor="translation-language">TRANSLATION</label>
              <select
                id="translation-language"
                value={translationLanguage}
                onChange={(event) => {
                  if (isTranslationLanguage(event.target.value)) {
                    setTranslationLanguage(event.target.value);
                  }
                }}
              >
                {translationLanguages.map((language) => (
                  <option key={language} value={language}>{languageLabels[language]}</option>
                ))}
              </select>
            </div>
          )}
          <div className="comfort-controls" aria-label="Reading comfort">
            <div>
              <label htmlFor="reader-text-size">TEXT SIZE</label>
              <select
                id="reader-text-size"
                value={textSize}
                onChange={(event) => {
                  if (isTextSize(event.target.value)) setTextSize(event.target.value);
                }}
              >
                <option value="small">Small</option>
                <option value="medium">Default</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label htmlFor="reader-line-spacing">LINE SPACING</label>
              <select
                id="reader-line-spacing"
                value={lineSpacing}
                onChange={(event) => {
                  if (isLineSpacing(event.target.value)) setLineSpacing(event.target.value);
                }}
              >
                <option value="standard">Standard</option>
                <option value="spacious">Relaxed</option>
              </select>
            </div>
            <div>
              <label htmlFor="reader-theme">READER COLOR</label>
              <select
                id="reader-theme"
                value={readerTheme}
                onChange={(event) => {
                  if (isReaderTheme(event.target.value)) setReaderTheme(event.target.value);
                }}
              >
                <option value="paper">Paper</option>
                <option value="sepia">Sepia</option>
                <option value="night">Night</option>
              </select>
            </div>
          </div>
        </div>

        <section className="search-panel" aria-label="Find Quran verses">
          <div className="search-panel-heading">
            <div>
              <h3>Find a word or phrase</h3>
              <p>Search the Quran text or the selected translation.</p>
            </div>
          </div>
          <form className="verse-search-form" onSubmit={submitVerseSearch}>
            <div className="verse-search-language">
              <label htmlFor="search-language">SEARCH IN</label>
              <select
                id="search-language"
                value={searchLanguage}
                onChange={(event) => {
                  if (isLanguage(event.target.value)) {
                    searchControllerRef.current?.abort();
                    setIsSearching(false);
                    setSearchLanguage(event.target.value);
                    setSearchResults([]);
                    setActiveSearchQuery("");
                    setSearchError(null);
                    setSearchTotalPages(0);
                    setSearchTotalResults(0);
                  }
                }}
              >
                {visibleLanguages.map((language) => (
                  <option key={language} value={language}>{languageLabels[language]}</option>
                ))}
              </select>
            </div>
            <div className="verse-search-query">
              <label htmlFor="verse-search-query">WORD OR PHRASE</label>
              <input
                id="verse-search-query"
                type="search"
                value={searchInput}
                maxLength={100}
                placeholder={`Search in ${languageLabels[searchLanguage]}`}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <button className="verse-search-button" type="submit" disabled={isSearching || !searchInput.trim()}>
              {isSearching ? "Searching…" : "Search"}
            </button>
          </form>
          <p className="search-attribution">
            {searchLanguage === "ar"
              ? "Searching the Arabic Quran text."
              : `Translation source: ${translatedNames[searchLanguage]}.`}
          </p>

          {(isSearching || searchError || activeSearchQuery) && (
            <div className="search-results-region">
              {isSearching && (
                <p className="search-status" role="status">
                  Searching {languageLabels[searchLanguage]}…
                </p>
              )}
              {searchError && <p className="search-error" role="alert">{searchError}</p>}
              {!isSearching && !searchError && activeSearchQuery && searchResults.length === 0 && (
                <p className="search-status" role="status">
                  No matches found. Try another spelling or search language.
                </p>
              )}
              {searchResults.length > 0 && (
                <>
                  <p className="search-status" role="status">
                    Showing {searchResults.length} results for “{activeSearchQuery}”. The source reports{" "}
                    {searchTotalResults.toLocaleString()} matches.
                  </p>
                  <ol className="search-results">
                    {searchResults.map((result) => (
                      <li key={`${activeSearchQuery}-${result.verse_key}`}>
                        <div className="search-result-heading">
                          <strong>Verse {result.verse_key}</strong>
                          <button
                            type="button"
                            aria-label={`Open verse ${result.verse_key}`}
                            onClick={() => openSearchResult(result.verse_key)}
                          >
                            Open verse
                          </button>
                        </div>
                        {searchLanguage === "ar" || !result.translation_text ? (
                          <>
                            {searchLanguage !== "ar" && (
                              <span className="search-match-note">Arabic text match</span>
                            )}
                            <p className="search-result-text search-result-arabic" lang="ar" dir="rtl">
                              {result.arabic_text}
                            </p>
                          </>
                        ) : (
                          <>
                            <p
                              className={`search-result-text search-result-${searchLanguage}`}
                              lang={searchLanguage}
                              dir={searchLanguage === "ur" ? "rtl" : "ltr"}
                            >
                              {result.translation_text}
                            </p>
                            <p className="search-result-arabic search-result-secondary" lang="ar" dir="rtl">
                              {result.arabic_text}
                            </p>
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                  {searchPage + 1 < searchTotalPages && (
                    <button
                      className="load-more-search-results"
                      type="button"
                      disabled={isSearching}
                      onClick={() => void searchVerses(activeSearchQuery, searchPage + 1, true)}
                    >
                      {isSearching ? "Loading…" : "Show more results"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <div className={`verse-list ${mode === "all" ? "verse-list-all" : ""} ${readingStyle === "book" ? "verse-list-book" : ""}`}>
          {isLoadingVerses ? (
            <p className="status-message" role="status">Loading verses…</p>
          ) : verseError ? (
            <div className="error-message" role="alert">
              <p>{verseError}</p>
              <button type="button" onClick={() => setVerseRequestId((requestId) => requestId + 1)}>
                Try again
              </button>
            </div>
          ) : verses.length === 0 ? (
            <p className="status-message">No verses are available for this chapter.</p>
          ) : readingStyle === "book" ? (
            <div className="book-page">
              {visibleLanguages.map((language) => (
                <section
                  className={`book-language book-language-${language}`}
                  key={language}
                  lang={language}
                  dir={language === "ar" || language === "ur" ? "rtl" : "ltr"}
                  aria-label={languageLabels[language]}
                >
                  {(mode === "all" || mode === "paired") && (
                    <h3 className="book-language-heading">{languageLabels[language]}</h3>
                  )}
                  <p className={`book-flow verse-${language}`}>
                    {verses.map((verse) => {
                      const text =
                        language === "ar" ? verse.text_uthmani : getTranslation(verse, language);

                      return (
                        <span
                          className={`book-verse ${highlightedVerseKey === verse.verse_key ? "search-highlight" : ""}`}
                          key={verse.verse_key}
                          id={language === visibleLanguages[0] ? `ayah-${verse.verse_key}` : undefined}
                          tabIndex={language === visibleLanguages[0] ? -1 : undefined}
                        >
                          <span className="book-verse-text">
                            {text || (
                              <span className="missing-translation">
                                {languageLabels[language]} translation unavailable for this verse.
                              </span>
                            )}
                          </span>
                          <span className="book-verse-marker" aria-label={`Verse ${verse.verse_number}`}>
                            {" "}۞{verse.verse_number}{" "}
                          </span>
                        </span>
                      );
                    })}
                  </p>
                </section>
              ))}
            </div>
          ) : (
            verses.map((verse) => (
              <article
                className={`verse ${highlightedVerseKey === verse.verse_key ? "search-highlight" : ""}`}
                key={verse.verse_key}
                id={`ayah-${verse.verse_key}`}
                tabIndex={-1}
              >
                <span className="verse-number" aria-label={`Verse ${verse.verse_number}`}>
                  {verse.verse_number}
                </span>
                <div className="verse-content">
                  {visibleLanguages.map((language) => {
                    const text =
                      language === "ar" ? verse.text_uthmani : getTranslation(verse, language);

                    return (
                      <p
                        className={`verse-text verse-${language}`}
                        key={`${verse.verse_key}-${language}`}
                        lang={language}
                        dir={language === "ar" || language === "ur" ? "rtl" : "ltr"}
                      >
                        {text || (
                          <span className="missing-translation">
                            {languageLabels[language]} translation unavailable for this verse.
                          </span>
                        )}
                      </p>
                    );
                  })}
                </div>
              </article>
            ))
          )}
        </div>

        {pageMode && (
          <div className="mushaf-page-navigation mushaf-page-navigation-bottom" aria-label="Page navigation">
            <button
              className="page-nav-button"
              type="button"
              aria-label="Previous Quran page"
              disabled={pageNumber === 1 || isLoadingVerses}
              onClick={() => changePage(pageNumber - 1)}
            >
              <span aria-hidden="true">←</span>
              <span>Previous</span>
            </button>
            <span className="page-bottom-status">Page {pageNumber} of {TOTAL_MUSHAF_PAGES}</span>
            <button
              className="page-nav-button"
              type="button"
              aria-label="Next Quran page"
              disabled={pageNumber === TOTAL_MUSHAF_PAGES || isLoadingVerses}
              onClick={() => changePage(pageNumber + 1)}
            >
              <span>Next</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        <footer className="reader-footer">
          <span>
            {pageMode
              ? `Mushaf page ${pageNumber} · ${verses.length} verses`
              : chapter
                ? `${chapter.verses_count} verses · ${readingStyle === "book" ? "Book page" : "Ayah by ayah"}`
                : "Quran reader"}
          </span>
          <span>Translations: {visibleLanguages.filter((language) => language !== "ar").map((language) => translatedNames[language]).join(" · ") || "—"}</span>
        </footer>
      </section>

      <footer className="site-footer">
        Quran text and translations are served by the{" "}
        <a href="https://quran.com" target="_blank" rel="noreferrer">Quran.com API</a>.
        Translation attributions remain with their respective authors and publishers.
      </footer>
      {pageMode && showBackToTop && (
        <button
          className="back-to-top"
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span aria-hidden="true">↑</span>
          <span>Top</span>
        </button>
      )}
    </main>
  );
}
