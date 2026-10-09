export default function PrintLoading() {
  return (
    <main className="print-loading" role="status">
      <span className="print-loading-spinner" aria-hidden="true" />
      <h1>Preparing the complete Quran</h1>
      <p>Loading chapter text and translations for your PDF. This may take a little while.</p>
    </main>
  );
}
