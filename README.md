# Free Quran Copy Translation

A responsive Quran reader built with Next.js. Read in one language, pair Arabic with a translation, or display Arabic, English, Nepali, and Urdu together. In addition to those four core languages, choose translations in Spanish, French, Indonesian, Bengali, Turkish, Persian, Russian, German, Portuguese, and Simplified Chinese.

On first visit, choose a preferred language, verse display, text style, and navigation style. **Quran pages** provide previous/next controls below the verses and direct page-number entry above them, across 604 numbered pages; **Chapter view** keeps the full chapter available for continuous scrolling. Use the separate **Chapter** and **Verse** number fields under **Go to verse** to open and highlight a specific verse (for example, Chapter 2 and Verse 10). Both navigation styles support **Ayah by ayah** or **Book page** text layouts. English uses the same font in both layouts, and the book page has high-contrast paper colors and added spacing around verse markers. In Quran page view, a back-to-top control appears while scrolling. The reader also offers text-size, line-spacing, and paper/sepia/night color controls, plus chapter-name and Quran-wide word or phrase search in the currently displayed languages. These preferences are stored only in the current browser and can be changed from the reader controls.

Use **Download Quran PDF** to prepare the complete Quran in one language, Arabic plus one translation, or all four core languages. The print-ready page opens the browser print dialog; choose **Save as PDF** to download. Each PDF identifies the Quran.com API and the selected translation sources. Check the API provider’s and translation publishers’ current terms before redistributing a saved copy.

The optional reading guide explains chapter/verse labels and how to distinguish the Arabic text from translations. It is informational rather than religious commentary; translations are labeled with their respective sources below the reader. Search requests are sent to the Quran.com API and are not stored by this application.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Content and attribution

Quran text and translations are retrieved on demand from the [Quran.com API](https://api.quran.com/). The reader uses these translation resources:

- English: Saheeh International (resource 20)
- Nepali: Ahl Al-Hadith Central Society of Nepal (resource 108)
- Urdu: Muhammad Junagarhi (resource 54)
- Spanish: Sheikh Isa Garcia (resource 83)
- French: Muhammad Hamidullah (resource 31)
- Indonesian: Indonesian Islamic Affairs Ministry (resource 33)
- Bengali: Taisirul Quran (resource 161)
- Turkish: Diyanet (resource 77)
- Persian: Hussein Taji Kal Dari (resource 29)
- Russian: Elmir Kuliev (resource 45)
- German: Frank Bubenheim and Nadeem (resource 27)
- Portuguese: Samir El-Hayek (resource 43)
- Simplified Chinese: Ma Jian (resource 56)

Translations remain the work of their respective authors and publishers. This project attributes those sources and does not bundle translation text. Review the API provider's and each translation's current terms before redistributing, caching for republication, or otherwise reusing text outside the live reader. See the [Quran.com API documentation](https://api-docs.quran.com/) for API details.

## Checks

```bash
npm run typecheck
npm run build
```
