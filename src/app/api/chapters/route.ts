import { getChapters } from "@/lib/quran";

export async function GET() {
  try {
    return Response.json({ chapters: await getChapters() });
  } catch (error) {
    console.error("Unable to load Quran chapters.", error);
    return Response.json(
      { error: "Quran chapters could not be loaded. Please try again." },
      { status: 502 },
    );
  }
}
