import { getPageVerses } from "@/lib/quran";

type RouteContext = {
  params: Promise<{ pageNumber: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { pageNumber } = await params;
  const number = Number(pageNumber);

  if (!Number.isInteger(number) || number < 1 || number > 604) {
    return Response.json({ error: "Choose a Quran page number from 1 to 604." }, { status: 400 });
  }

  try {
    return Response.json({ page: number, verses: await getPageVerses(number) });
  } catch (error) {
    console.error(`Unable to load Quran page ${number}.`, error);
    return Response.json(
      { error: "This Quran page could not be loaded. Please try again." },
      { status: 502 },
    );
  }
}
