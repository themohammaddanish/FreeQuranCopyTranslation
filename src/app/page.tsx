import Link from "next/link";
import SiteHeader from "@/components/site-header";

const destinations = [
  {
    href: "/read",
    number: "01",
    title: "Read the Quran",
    description: "Read Arabic alongside an English or Nepali translation, choose a chapter, and set a comfortable reading style.",
    action: "Open reader",
  },
  {
    href: "/study",
    number: "02",
    title: "Study tools",
    description: "Learn how chapters and verses are organized, and explore basic Arabic word meanings.",
    action: "Explore study tools",
  },
  {
    href: "/about",
    number: "03",
    title: "About this project",
    description: "Understand the purpose of the site, how the text and translations are sourced, and how attribution works.",
    action: "About the project",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader active="home" />
      <main className="site-shell landing-page">
        <section className="landing-hero">
          <p className="eyebrow">A WELCOMING PLACE TO LEARN</p>
          <h1>Curious about the Quran?</h1>
          <p>
            Explore the Quran at your own pace. Start with a clear English or Nepali translation,
            compare it with the Arabic text, and use simple study tools as you read.
          </p>
          <Link className="primary-link landing-cta" href="/myth">
            Explore Myth <span aria-hidden="true">→</span>
          </Link>
          <p className="landing-note">Questions, answers, and verse references for learning across backgrounds.</p>
        </section>

        <section className="myth-feature" aria-labelledby="myth-feature-heading">
          <div className="myth-feature-copy">
            <p className="eyebrow">FEATURED</p>
            <h2 id="myth-feature-heading">Myth</h2>
            <p>
              Explore common questions with related Quranic passages and context. This section supports
              respectful learning across religious and cultural backgrounds.
            </p>
          </div>
          <Link className="myth-feature-link" href="/myth">
            Read the answers <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className="destination-section" aria-labelledby="destination-heading">
          <div className="section-heading">
            <p className="eyebrow">EXPLORE</p>
            <h2 id="destination-heading">Explore the rest of the site</h2>
          </div>
          <div className="destination-grid">
            {destinations.map((destination) => (
              <Link className="destination-card" href={destination.href} key={destination.href}>
                <span className="destination-number">{destination.number}</span>
                <h3>{destination.title}</h3>
                <p>{destination.description}</p>
                <span className="destination-action">{destination.action} <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
