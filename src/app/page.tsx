"use client";

import { useEffect, useMemo, useState } from "react";
import { getTranslation } from "@/lib/quran-types";
import type { Chapter, Language, TranslationLanguage, Verse } from "@/lib/quran-types";

type ReadingMode = "single" | "paired" | "all";
type ReadingStyle = "ayah" | "book";

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
  singleLanguage: Language;
  translationLanguage: TranslationLanguage;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  const [mode, setMode] = useState<ReadingMode>("paired");
  const [readingStyle, setReadingStyle] = useState<ReadingStyle>("ayah");
  const [singleLanguage, setSingleLanguage] = useState<Language>("ar");
  const [translationLanguage, setTranslationLanguage] = useState<TranslationLanguage>("en");
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isLoadingVerses, setIsLoadingVerses] = useState(true);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [verseError, setVerseError] = useState<string | null>(null);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [showPreferenceSetup, setShowPreferenceSetup] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);

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
          setSingleLanguage(saved.singleLanguage);
          setTranslationLanguage(saved.translationLanguage);
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
      const preferences: ReaderPreferences = { mode, readingStyle, singleLanguage, translationLanguage };
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      setPreferenceError(null);
    } catch (saveError) {
      console.error("Unable to save Quran reader preferences.", saveError);
      setPreferenceError("Your preferences could not be saved in this browser.");
    }
  }, [mode, readingStyle, singleLanguage, translationLanguage, preferencesReady, showPreferenceSetup]);

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
        const response = await fetch(`/api/chapters/${chapterId}/verses`, {
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
  }, [chapterId, verseRequestId]);

  const chapter = chapters.find((item) => item.id === chapterId);
  const visibleLanguages = useMemo<Language[]>(() => {
    if (mode === "all") return allLanguages;
    if (mode === "single") return [singleLanguage];
    return ["ar", translationLanguage];
  }, [mode, singleLanguage, translationLanguage]);

  function startReading() {
    try {
      const preferences: ReaderPreferences = { mode, readingStyle, singleLanguage, translationLanguage };
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

  function changeChapter(nextChapterId: number) {
    if (nextChapterId >= 1 && nextChapterId <= 114) setChapterId(nextChapterId);
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

      <header className="topbar">
        <a className="brand" href="/" aria-label="Free Quran Copy Translation home">
          <span className="brand-mark" aria-hidden="true">۞</span>
          <span>
            <strong>Quran</strong>
            <span className="brand-subtitle">READ & REFLECT</span>
          </span>
        </a>
        <span className="topbar-note">A calm space for the words of the Quran</span>
      </header>

      <section className="intro">
        <p className="eyebrow">THE NOBLE QURAN</p>
        <h1>Read at your own pace.</h1>
        <p className="intro-copy">
          Explore the Quran in Arabic, English, Nepali, or Urdu — together or one language at a time.
        </p>
      </section>

      <section className="reader" aria-label="Quran reader">
        <div className="reader-toolbar">
          <div className="chapter-picker">
            <label htmlFor="chapter-select">CHAPTER</label>
            <select
              id="chapter-select"
              value={chapterId}
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
          <div className="chapter-navigation" aria-label="Chapter navigation">
            <button
              className="icon-button"
              type="button"
              aria-label="Previous chapter"
              disabled={chapterId === 1 || isLoadingChapters}
              onClick={() => changeChapter(chapterId - 1)}
            >
              ←
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Next chapter"
              disabled={chapterId === 114 || isLoadingChapters}
              onClick={() => changeChapter(chapterId + 1)}
            >
              →
            </button>
          </div>
        </div>

        {chapterError && (
          <div className="inline-error" role="alert">
            <span>{chapterError}</span>
            <button type="button" onClick={() => setChapterRequestId((requestId) => requestId + 1)}>
              Retry
            </button>
          </div>
        )}

        <div className="chapter-heading">
          <div>
            <p className="eyebrow">CHAPTER {chapterId}</p>
            <h2>{chapter?.translated_name.name ?? "The Quran"}</h2>
            <p className="chapter-meta">
              {chapter?.name_simple ?? "Loading chapter"}
              {chapter ? ` · ${chapter.verses_count} verses` : ""}
            </p>
          </div>
          <p className="chapter-arabic" lang="ar" dir="rtl">
            {chapter?.name_arabic ?? "القرآن الكريم"}
          </p>
        </div>

        <div className="reading-controls">
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
        </div>

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
                        <span className="book-verse" key={verse.verse_key} id={`ayah-${verse.verse_key}`}>
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
              <article className="verse" key={verse.verse_key}>
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

        <footer className="reader-footer">
          <span>
            {chapter ? `${chapter.verses_count} verses · ${readingStyle === "book" ? "Book page" : "Ayah by ayah"}` : "Quran reader"}
          </span>
          <span>Translations: {visibleLanguages.filter((language) => language !== "ar").map((language) => translatedNames[language]).join(" · ") || "—"}</span>
        </footer>
      </section>

      <footer className="site-footer">
        Quran text and translations are served by the{" "}
        <a href="https://quran.com" target="_blank" rel="noreferrer">Quran.com API</a>.
        Translation attributions remain with their respective authors and publishers.
      </footer>
    </main>
  );
}
