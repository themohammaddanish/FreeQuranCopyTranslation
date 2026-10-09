import { getChapterVerses, parseTranslationLanguages } from "@/lib/quran";

type RouteContext = {
  params: Promise<{ chapterId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { chapterId } = await params;
  const chapterNumber = Number(chapterId);
  const translations = parseTranslationLanguages(new URL(request.url).searchParams.get("translations"));

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 114) {
    return Response.json({ error: "Choose a chapter number from 1 to 114." }, { status: 400 });
  }
  if (translations === null) {
    return Response.json({ error: "Choose supported Quran translation languages." }, { status: 400 });
  }

  try {
    return Response.json({ verses: await getChapterVerses(chapterNumber, translations) });
  } catch (error) {
    console.error(`Unable to load Quran chapter ${chapterNumber}.`, error);
    return Response.json(
      { error: "This chapter could not be loaded. Please try again." },
      { status: 502 },
    );
  }
}
