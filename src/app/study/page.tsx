import SiteHeader from "@/components/site-header";
import StudyGuide from "@/components/study-guide";

export default function StudyPage() {
  return (
    <>
      <SiteHeader active="study" />
      <main className="site-shell page-container">
        <StudyGuide />
      </main>
    </>
  );
}
