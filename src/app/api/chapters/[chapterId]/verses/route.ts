import { getChapterVerses } from "@/lib/quran";

type RouteContext = {
  params: Promise<{ chapterId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { chapterId } = await params;
  const chapterNumber = Number(chapterId);

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 114) {
    return Response.json({ error: "Choose a chapter number from 1 to 114." }, { status: 400 });
  }

  try {
    return Response.json({ verses: await getChapterVerses(chapterNumber) });
  } catch (error) {
    console.error(`Unable to load Quran chapter ${chapterNumber}.`, error);
    return Response.json(
      { error: "This chapter could not be loaded. Please try again." },
      { status: 502 },
    );
  }
}
