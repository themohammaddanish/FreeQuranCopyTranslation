import { mythAnswers, mythAnswerSource } from "@/lib/myth-answers";

function quranLink(reference: string) {
  return `${mythAnswerSource.href}${reference.replace(":", "/").replace(/[–—]/g, "-")}`;
}

function tafsirLink(reference: string, resourceId: number) {
  const [chapter, verses] = reference.split(":");
  const firstVerse = verses.split(/[–—-]/)[0];
  return `https://quran.com/${chapter}/${firstVerse}/tafsirs/${resourceId}`;
}

export default function MythAnswerList() {
  return (
    <section className="myth-answer-list" aria-label="Questions and answers">
      {mythAnswers.map((item) => (
        <article className="myth-answer-card" key={item.title}>
          <p className="myth-answer-number">MYTH {item.number}</p>
          <h2>{item.title}</h2>
          <div className="myth-answer-block">
            <h3>The question</h3>
            <p>{item.question}</p>
          </div>
          <div className="myth-answer-block">
            <h3>Verse text supplied with this question</h3>
            <p className="myth-translation-credit">
              This text is copied from the submitted material, not fetched from an API. Ellipses are kept where
              an excerpt was supplied. Use the verse link to compare it with the full Quran text.
            </p>
            {item.passages.map((passage) => (
              <section className="myth-full-passage" key={passage.reference}>
                <div className="myth-full-passage-heading">
                  <a href={quranLink(passage.reference)} target="_blank" rel="noreferrer">
                    Surah {passage.reference}
                  </a>
                  <span>{passage.context}</span>
                </div>
                {"label" in passage && <p className="myth-passage-label">{passage.label}</p>}
                <blockquote className="myth-english-text" lang="en">
                  {passage.quote}
                </blockquote>
                <div className="myth-tafsir-links" aria-label={`Tafsir sources for ${passage.reference}`}>
                  <span>Scholarly commentary (external links):</span>
                  <a
                    href={tafsirLink(passage.reference, 169)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ibn Kathir (Abridged)
                  </a>
                  <a
                    href={tafsirLink(passage.reference, 168)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ma&apos;arif al-Qur&apos;an
                  </a>
                </div>
              </section>
            ))}
          </div>
          <div className="myth-answer-block">
            <h3>Explanation and context</h3>
            <p>{item.answer}</p>
          </div>
          <p className="myth-interpretation-note">
            <strong>Interpretive note:</strong> {item.interpretation}
          </p>
        </article>
      ))}
    </section>
  );
}
