"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GuideLanguage } from "@/lib/reading-guide";
import {
  readingGuideGlossary,
  readingGuideGlossarySource,
  readingGuideItems,
  readingGuideSource,
} from "@/lib/reading-guide";

const PREFERENCES_KEY = "free-quran-reader-preferences-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getGuideLanguages(value: unknown): GuideLanguage[] {
  if (!isRecord(value)) return ["en", "ne"];
  if (value.mode === "single" && (value.singleLanguage === "en" || value.singleLanguage === "ne")) {
    return [value.singleLanguage];
  }
  if (value.mode === "paired" && (value.translationLanguage === "en" || value.translationLanguage === "ne")) {
    return [value.translationLanguage];
  }
  return ["en", "ne"];
}

export default function StudyGuide() {
  const [languages, setLanguages] = useState<GuideLanguage[]>(["en", "ne"]);
  const [usesFallback, setUsesFallback] = useState(false);

  useEffect(() => {
    try {
      const storedPreferences = window.localStorage.getItem(PREFERENCES_KEY);
      if (!storedPreferences) return;
      const saved: unknown = JSON.parse(storedPreferences);
      const preferredLanguages = getGuideLanguages(saved);
      setLanguages(preferredLanguages);
      setUsesFallback(preferredLanguages.length > 1 && isRecord(saved) && saved.mode !== "all");
    } catch (error) {
      console.error("Unable to load language preferences for the study guide.", error);
    }
  }, []);

  return (
    <>
      <div className="page-intro study-page-intro">
        <p className="eyebrow">STUDY TOOLS</p>
        <h1>Start with the basics</h1>
        <p className="intro-copy">
          A plain-language guide to reading the Quran, with short Arabic word meanings in English and Nepali.
          Meanings are learning aids; context matters.
        </p>
      </div>

      <section className="study-guide-panel">
        {usesFallback && (
          <p className="reading-guide-fallback">
            This guide is available in English and Nepali, so both are shown for your selected language.
          </p>
        )}
        <div className="reading-guide-content study-guide-content">
          {readingGuideItems.map((item) => (
            <section key={item.term.en}>
              <h2>
                {languages.map((language, index) => (
                  <span key={language} lang={language}>
                    {index > 0 && " / "}
                    {item.term[language]}
                  </span>
                ))}
              </h2>
              {languages.map((language) => (
                <p key={language} lang={language}>
                  {languages.length > 1 && <strong>{language === "en" ? "English: " : "नेपाली: "}</strong>}
                  {item.description[language]}
                </p>
              ))}
            </section>
          ))}
          <section className="reading-guide-glossary">
            <h2>
              {languages.map((language) =>
                language === "en" ? "Basic Arabic word meanings" : "अरबी शब्दका सामान्य अर्थहरू",
              ).join(" / ")}
            </h2>
            {languages.map((language) => (
              <p className="glossary-context" key={language} lang={language}>
                {language === "en"
                  ? "These are short learning aids, not complete explanations. A word’s meaning can change with its verse context."
                  : "यी छोटा सिकाइ सहयोगी अर्थ हुन्, पूर्ण व्याख्या होइनन्। आयतको सन्दर्भअनुसार शब्दको अर्थ फरक हुन सक्छ।"}
              </p>
            ))}
            <dl className="glossary-list">
              {readingGuideGlossary.map((item) => (
                <div className="glossary-entry" key={item.word}>
                  <dt>
                    <span lang="ar" dir="rtl">{item.arabic}</span>
                    <span>{item.word}</span>
                  </dt>
                  <dd>
                    {languages.map((language) => (
                      <span className="glossary-meaning" key={language} lang={language}>
                        {languages.length > 1 && <strong>{language === "en" ? "English: " : "नेपाली: "}</strong>}
                        {language === "en" ? item.english : item.nepali}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="reading-guide-source">
            Chapter and verse labels follow the{" "}
            <a href={readingGuideSource.href} target="_blank" rel="noreferrer">
              {readingGuideSource.label}
            </a>
            . For word-level Arabic references, see the{" "}
            <a href={readingGuideGlossarySource.href} target="_blank" rel="noreferrer">
              {readingGuideGlossarySource.label}
            </a>
            .
          </p>
        </div>
      </section>
      <div className="page-actions">
        <Link className="primary-link" href="/read">Open the Quran reader <span aria-hidden="true">→</span></Link>
      </div>
    </>
  );
}
