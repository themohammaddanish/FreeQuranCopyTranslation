import type { Chapter, Language, TranslationLanguage, Verse } from "@/lib/quran-types";
import {
  coreLanguages,
  getTranslation,
  isLanguage,
  isTranslationLanguage,
  languageLabels,
  translationNames,
} from "@/lib/quran-types";
import { getAllVerses, getChapters } from "@/lib/quran";
import PrintActions from "./print-actions";

type PrintMode = "single" | "paired" | "all";
type PrintPageProps = {
  searchParams: Promise<{
    mode?: string;
    language?: string;
    translation?: string;
  }>;
};

const allLanguages: Language[] = coreLanguages;

function isPrintMode(value: string | undefined): value is PrintMode {
  return value === "single" || value === "paired" || value === "all";
}

function getVerseText(verse: Verse, language: Language): string {
  if (language === "ar") return verse.text_uthmani;
  return getTranslation(verse, language) ?? "Translation unavailable for this verse.";
}

function getPrintTitle(mode: PrintMode, languages: Language[]): string {
  if (mode === "all") return "Arabic · English · Nepali · Urdu";
  if (mode === "paired") return `Arabic + ${languageLabels[languages[1]]}`;
  return languageLabels[languages[0]];
}

function groupVersesByChapter(verses: Verse[]): Map<number, Verse[]> {
  const grouped = new Map<number, Verse[]>();
  for (const verse of verses) {
    const chapterId = Number(verse.verse_key.split(":")[0]);
    const chapterVerses = grouped.get(chapterId) ?? [];
    chapterVerses.push(verse);
    grouped.set(chapterId, chapterVerses);
  }
  return grouped;
}

function PrintVerse({
  verse,
  languages,
  showLanguageLabels,
}: {
  verse: Verse;
  languages: Language[];
  showLanguageLabels: boolean;
}) {
  return (
    <article className="print-verse">
      <span className="print-verse-reference" dir="ltr">{verse.verse_key}</span>
      <div className="print-verse-languages">
        {languages.map((language) => (
          <div
            className={`print-language print-language-${language}`}
            key={language}
            lang={language}
            dir={language === "ar" || language === "ur" || language === "fa" ? "rtl" : "ltr"}
          >
            {showLanguageLabels && (
              <span className="print-language-label">{languageLabels[language]}</span>
            )}
            <p>{getVerseText(verse, language)}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function PrintChapter({
  chapter,
  verses,
  languages,
  first,
  showLanguageLabels,
}: {
  chapter: Chapter;
  verses: Verse[];
  languages: Language[];
  first: boolean;
  showLanguageLabels: boolean;
}) {
  return (
    <section className={`print-chapter ${first ? "print-chapter-first" : ""}`}>
      <header className="print-chapter-heading">
        <span>Chapter {chapter.id}</span>
        <h2>{chapter.name_simple}</h2>
        <p lang="ar" dir="rtl">{chapter.name_arabic}</p>
      </header>
      {verses.map((verse) => (
        <PrintVerse
          key={verse.verse_key}
          verse={verse}
          languages={languages}
          showLanguageLabels={showLanguageLabels}
        />
      ))}
    </section>
  );
}

export default async function PrintQuranPage({ searchParams }: PrintPageProps) {
  const params = await searchParams;
  if (!isPrintMode(params.mode)) {
    return (
      <main className="print-error">
        <h1>Choose a PDF language layout</h1>
        <p>Return to the Quran reader and select one language, Arabic plus a translation, or all four.</p>
        <a href="/">Back to reader</a>
      </main>
    );
  }

  let languages: Language[];
  if (params.mode === "single") {
    if (!isLanguage(params.language)) {
      return <main className="print-error"><h1>Select a valid language for the PDF.</h1><a href="/">Back to reader</a></main>;
    }
    languages = [params.language];
  } else if (params.mode === "paired") {
    if (!isTranslationLanguage(params.translation)) {
      return <main className="print-error"><h1>Select a valid translation for the PDF.</h1><a href="/">Back to reader</a></main>;
    }
    languages = ["ar", params.translation];
  } else {
    languages = allLanguages;
  }

  const selectedTranslations = languages.filter(
    (language): language is TranslationLanguage => language !== "ar",
  );
  const [chapters, verses] = await Promise.all([
    getChapters(),
    getAllVerses(selectedTranslations),
  ]);
  const versesByChapter = groupVersesByChapter(verses);
  const title = getPrintTitle(params.mode, languages);
  const credits = selectedTranslations.map(
    (language) => `${languageLabels[language]}: ${translationNames[language]}`,
  );

  return (
    <main className="print-shell">
      <PrintActions />
      <header className="print-cover">
        <p className="print-eyebrow">FREE QURAN COPY TRANSLATION</p>
        <h1>The Quran</h1>
        <p className="print-language-summary">{title}</p>
        <p className="print-verse-count">{verses.length.toLocaleString()} verses · Complete Quran</p>
        <div className="print-attribution">
          <p>Quran text and translations provided by the Quran.com API.</p>
          {credits.map((credit) => <p key={credit}>{credit}</p>)}
          <p>Translations remain the work of their respective authors and publishers.</p>
        </div>
      </header>
      {chapters.map((chapter, index) => (
        <PrintChapter
          key={chapter.id}
          chapter={chapter}
          verses={versesByChapter.get(chapter.id) ?? []}
          languages={languages}
          first={index === 0}
          showLanguageLabels={params.mode === "all"}
        />
      ))}
      <footer className="print-document-footer">
        Content is supplied by the Quran.com API. Check the API provider’s and translation publishers’ current terms before redistributing this PDF.
      </footer>
    </main>
  );
}
