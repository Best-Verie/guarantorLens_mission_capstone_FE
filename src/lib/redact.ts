/**
 * Remove specific member/guarantor IDs (e.g. "Client107745") from report prose.
 *
 * The printable report can be saved as a PDF and circulated in offices, so it must never name an
 * individual guarantor as a past defaulter. Aggregate statements ("2 guarantors written off before")
 * are kept; only the identifying IDs are stripped, and any leftover ": , " punctuation is tidied.
 * The live, authenticated officer screens are unaffected — the officer still sees the IDs to act on.
 */
export function redactIds(text: string): string {
  if (!/\b(?:Client|Member|Guarantor)\s?\d+/i.test(text)) return text;
  return text
    .replace(/\b(?:Client|Member|Guarantor)\s?\d+\b/gi, "")   // drop the specific IDs
    .replace(/\s*:\s*(?:,\s*)*(?=[.;]|$)/g, "")                 // clean a now-empty ": , " list
    .replace(/,\s*(?=,|[.;]|$)/g, "")                          // drop dangling commas
    .replace(/\s{2,}/g, " ")                                    // collapse double spaces
    .replace(/\s+([.,;])/g, "$1")                               // no space before punctuation
    .trim();
}
