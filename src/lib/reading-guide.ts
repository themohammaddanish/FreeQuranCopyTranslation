export type GuideLanguage = "en" | "ne";

export const readingGuideItems = [
  {
    term: {
      en: "Chapter (Surah)",
      ne: "अध्याय (सूरह)",
    },
    description: {
      en: "The Quran is organized into 114 chapters. Choose a chapter by its name or number.",
      ne: "कुरआन ११४ अध्यायमा विभाजित छ। नाम वा नम्बरबाट अध्याय छान्न सकिन्छ।",
    },
  },
  {
    term: {
      en: "Verse (Ayah)",
      ne: "पद (आयत)",
    },
    description: {
      en: "A verse is one numbered part of a chapter. For example, 2:255 means chapter 2, verse 255.",
      ne: "आयत अध्यायको नम्बर दिइएको एउटा अंश हो। उदाहरणका लागि, २:२५५ भनेको अध्याय २, आयत २५५ हो।",
    },
  },
  {
    term: {
      en: "Arabic text",
      ne: "अरबी पाठ",
    },
    description: {
      en: "The Quran's text is in Arabic. The reader keeps it visually separate from translations.",
      ne: "कुरआनको मूल पाठ अरबीमा छ। यस पाठकमा यसलाई अनुवादबाट छुट्टै देखाइएको छ।",
    },
  },
  {
    term: {
      en: "Translation",
      ne: "अनुवाद",
    },
    description: {
      en: "A translation conveys meaning in another language. Word choices can differ by translator and context, so each source is named.",
      ne: "अनुवादले अर्को भाषामा अर्थ बुझाउँछ। अनुवादक र सन्दर्भअनुसार शब्द फरक हुन सक्छन्, त्यसैले स्रोतको नाम दिइएको छ।",
    },
  },
] as const;

export const readingGuideGlossary = [
  {
    arabic: "اللَّه",
    word: "Allah",
    english: "God; the Arabic name used for God in the Quran.",
    nepali: "परमेश्वर; कुरआनमा परमेश्वरका लागि प्रयोग भएको अरबी नाम।",
  },
  {
    arabic: "رَبّ",
    word: "Rabb",
    english: "Lord; also rendered as Sustainer in some translations.",
    nepali: "प्रभु; केही अनुवादमा पालनकर्ता पनि भनिन्छ।",
  },
  {
    arabic: "رَحْمَة",
    word: "Rahmah",
    english: "Mercy or compassion.",
    nepali: "दया वा करुणा।",
  },
  {
    arabic: "كِتَاب",
    word: "Kitab",
    english: "Book or scripture.",
    nepali: "पुस्तक वा धर्मग्रन्थ।",
  },
  {
    arabic: "نُور",
    word: "Nur",
    english: "Light.",
    nepali: "प्रकाश।",
  },
] as const;

export const readingGuideSource = {
  label: "Quran.com API documentation",
  href: "https://api-docs.quran.com/",
};

export const readingGuideGlossarySource = {
  label: "Quranic Arabic Corpus",
  href: "https://corpus.quran.com/",
};
