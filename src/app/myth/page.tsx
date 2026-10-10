import Link from "next/link";
import SiteHeader from "@/components/site-header";
import MythAnswerList from "@/components/myth-answer-list";

export default function MythPage() {
  return (
    <>
      <SiteHeader active="myth" />
      <main className="site-shell page-container myth-page">
        <header className="page-intro myth-intro">
          <p className="eyebrow">QUESTIONS & ANSWERS</p>
          <h1>Myth</h1>
          <p className="intro-copy">
            Read questions people ask about the Quran alongside relevant verse references and context.
            The aim is respectful learning across religious and cultural backgrounds.
          </p>
        </header>

        <section className="myth-context-note" aria-label="About these answers">
          <h2>How to read this section</h2>
          <p>
            The English Quran quotations and context here come from the material submitted for these questions;
            they are written into the page and are not fetched from an API. Ellipses mark excerpts where they
            appeared in that material. Links open the cited verse and named tafsir sources for readers who want
            to compare the full text and scholarly explanations. Tafsir is commentary, not the Quran itself,
            and scholarly interpretations can differ.
          </p>
        </section>

        <MythAnswerList />

        <div className="page-actions">
          <Link className="primary-link" href="/read">Read the Quran <span aria-hidden="true">→</span></Link>
          <Link className="secondary-link" href="/study">Explore study tools</Link>
        </div>
      </main>
    </>
  );
}
