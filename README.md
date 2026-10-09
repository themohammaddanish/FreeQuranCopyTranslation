# Free Quran Copy Translation

A responsive Quran reader built with Next.js. Read in one language, pair Arabic with a translation, or display Arabic, English, Nepali, and Urdu together.

On first visit, choose a preferred language, verse display, and text style. Use **Ayah by ayah** for the separated verse view or **Book page** for continuous prose with visible verse markers. The reader remembers these preferences in the current browser; they can also be changed from the reader controls.

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

Translations remain the work of their respective authors and publishers. This project attributes those sources and does not bundle translation text. Review the API provider's and each translation's current terms before redistributing, caching for republication, or otherwise reusing text outside the live reader. See the [Quran.com API documentation](https://api-docs.quran.com/) for API details.

## Checks

```bash
npm run typecheck
npm run build
```
