import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { readingGuideGlossarySource } from "@/lib/reading-guide";
import { translationLanguages, languageLabels, translationNames } from "@/lib/quran-types";

export default function AboutPage() {
  return (
    <>
      <SiteHeader active="about" />
      <main className="site-shell page-container">
        <header className="page-intro">
          <p className="eyebrow">ABOUT THIS PROJECT</p>
          <h1>A place to read, compare, and learn</h1>
          <p className="intro-copy">
            Free Quran Copy Translation is a learning-oriented reader for people curious about the Quran,
            especially readers in Nepal and Southeast Asia.
          </p>
        </header>

        <section className="about-section">
          <h2>Our approach</h2>
          <p>
            Begin with English or Nepali, read a translation alongside the Arabic text, and explore at your
            own pace. The site is designed for readers with different backgrounds and does not assume prior
            knowledge or tell readers what to believe.
          </p>
          <p>
            Arabic text and translations are presented separately. A translation is a translator’s rendering
            of meaning; wording may vary by source and context.
          </p>
          <p>
            The Myth section displays the English quotations submitted with its questions, followed by context
            and links to tafsir by Ibn Kathir and Mufti Muhammad Shafi. The submitted quotations are static page
            content; they are not fetched from an API. Ellipses indicate excerpts where supplied.
          </p>
        </section>

        <section className="about-section">
          <h2>Content and attribution</h2>
          <p>
            Quran text and translations are retrieved from the{" "}
            <a href="https://api.quran.com/" target="_blank" rel="noreferrer">Quran.com API</a>.
            Translation text remains the work of its respective authors and publishers.
          </p>
          <p>
            The Myth section links to Quran.com tafsir pages for{" "}
            <a href="https://quran.com/2/190/tafsirs/169" target="_blank" rel="noreferrer">
              Ibn Kathir (Abridged)
            </a>{" "}
            and{" "}
            <a href="https://quran.com/2/190/tafsirs/168" target="_blank" rel="noreferrer">
              Ma&apos;arif al-Qur&apos;an
            </a>
            . These commentaries are scholarly interpretations, distinct from the Quran&apos;s Arabic text and
            from any translation.
          </p>
          <ul className="translation-attribution-list">
            {translationLanguages.map((language) => (
              <li key={language}>
                <strong>{languageLabels[language]}:</strong> {translationNames[language]}
              </li>
            ))}
          </ul>
          <p>
            Basic Arabic word meanings are short learning aids, not full explanations. For additional
            word-level references, visit the{" "}
            <a href={readingGuideGlossarySource.href} target="_blank" rel="noreferrer">
              {readingGuideGlossarySource.label}
            </a>.
          </p>
          <p>
            Check the API provider’s and translation publishers’ current terms before redistributing downloaded
            or printed content.
          </p>
        </section>
        <div className="page-actions">
          <Link className="primary-link" href="/read">Open the Quran reader <span aria-hidden="true">→</span></Link>
          <Link className="secondary-link" href="/study">Explore study tools</Link>
        </div>
      </main>
    </>
  );
}
