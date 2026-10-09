export const readingGuideItems = [
  {
    term: "Surah",
    description: "A chapter of the Quran. Use the chapter finder to move between chapters.",
  },
  {
    term: "Ayah",
    description: "A verse within a chapter. A reference such as 2:255 means chapter 2, verse 255.",
  },
  {
    term: "Translation",
    description:
      "A translator's rendering of the Arabic text's meaning. Wording can differ between translators, so this reader names the translation source.",
  },
] as const;

export const readingGuideSource = {
  label: "Quran.com API documentation",
  href: "https://api-docs.quran.com/",
};
