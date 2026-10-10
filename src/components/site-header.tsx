import Link from "next/link";

type SiteSection = "home" | "read" | "study" | "myth" | "about";

const navigation: { href: string; label: string; section: SiteSection }[] = [
  { href: "/", label: "Home", section: "home" },
  { href: "/read", label: "Read Quran", section: "read" },
  { href: "/study", label: "Study tools", section: "study" },
  { href: "/myth", label: "Myth", section: "myth" },
  { href: "/about", label: "About", section: "about" },
];

export default function SiteHeader({ active }: { active: SiteSection }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" href="/" aria-label="Free Quran Copy Translation home">
          <span className="brand-mark" aria-hidden="true">۞</span>
          <span>
            <strong>Quran</strong>
            <span className="brand-subtitle">READ & REFLECT</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              aria-current={active === item.section ? "page" : undefined}
              className={active === item.section ? "site-nav-link active" : "site-nav-link"}
              href={item.href}
              key={item.section}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
