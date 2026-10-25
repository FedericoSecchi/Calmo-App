import { describe, it, expect } from "vitest";
import { es } from "./es";
import { SEO_CONTENT } from "@/pages/seo/content";

// Spanish neutro: tú-form. These voseo / regional markers must not appear in
// user-facing Spanish strings. The regex patterns only match the voseo forms
// (accented final vowel on 2nd-person-indicative/imperative) so that regular
// tú-form words ("mira", "rota", "respira", "trabajas") are not false positives.
const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  // voseo 2nd-person indicatives: -ás / -és / -ís with acute accent
  { pattern: /\bquerés\b/i, description: "voseo: querés" },
  { pattern: /\bpodés\b/i, description: "voseo: podés" },
  { pattern: /\btenés\b/i, description: "voseo: tenés" },
  { pattern: /\bsabés\b/i, description: "voseo: sabés" },
  { pattern: /\bsentís\b/i, description: "voseo: sentís" },
  { pattern: /\bvenís\b/i, description: "voseo: venís" },
  { pattern: /\bsalís\b/i, description: "voseo: salís" },
  { pattern: /\bdecís\b/i, description: "voseo: decís" },
  { pattern: /\bvivís\b/i, description: "voseo: vivís" },
  { pattern: /\busás\b/i, description: "voseo: usás" },
  { pattern: /\bllevás\b/i, description: "voseo: llevás" },
  { pattern: /\btrabajás\b/i, description: "voseo: trabajás" },
  { pattern: /\bcerrás\b/i, description: "voseo: cerrás" },
  { pattern: /\baceptás\b/i, description: "voseo: aceptás" },
  { pattern: /\balcanzás\b/i, description: "voseo: alcanzás" },
  { pattern: /\bnecesitás\b/i, description: "voseo: necesitás" },
  { pattern: /\bempezás\b/i, description: "voseo: empezás" },
  { pattern: /\bqueda tuyo\b/i, description: "regional phrasing" },
  // voseo imperatives (tilde on final syllable). Tú-imperatives are identical
  // without the accent, so these only match the voseo forms.
  { pattern: /\bhacé\b/i, description: "voseo imperative: hacé" },
  { pattern: /\bcreá\b/i, description: "voseo imperative: creá" },
  { pattern: /\bregistrate\b/i, description: "voseo imperative: registrate" },
  { pattern: /\bminimizala\b/i, description: "voseo imperative: minimizala" },
  { pattern: /\bminimizalo\b/i, description: "voseo imperative: minimizalo" },
  { pattern: /\bunite\b/i, description: "voseo imperative: unite" },
  { pattern: /\bpará\b/i, description: "voseo imperative: pará" },
  { pattern: /\bparate\b/i, description: "voseo imperative: parate" },
  { pattern: /\bempezá\b/i, description: "voseo imperative: empezá" },
  { pattern: /\bentrá\b/i, description: "voseo imperative: entrá" },
  { pattern: /\btomá\b/i, description: "voseo imperative: tomá" },
  { pattern: /\bmirá\b/i, description: "voseo imperative: mirá" },
  { pattern: /\bsentate\b/i, description: "voseo imperative: sentate" },
  { pattern: /\bextendé\b/i, description: "voseo imperative: extendé" },
  { pattern: /\bgirá\b/i, description: "voseo imperative: girá" },
  { pattern: /\bvolvé\b/i, description: "voseo imperative: volvé" },
  { pattern: /\brodá\b/i, description: "voseo imperative: rodá" },
  { pattern: /\brotá\b/i, description: "voseo imperative: rotá" },
  { pattern: /\bflexioná\b/i, description: "voseo imperative: flexioná" },
  { pattern: /\bincliná\b/i, description: "voseo imperative: incliná" },
  { pattern: /\bsumá\b/i, description: "voseo imperative: sumá" },
  { pattern: /\bagregá\b/i, description: "voseo imperative: agregá" },
  { pattern: /\brepetí\b/i, description: "voseo imperative: repetí" },
  { pattern: /\brespirá\b/i, description: "voseo imperative: respirá" },
  { pattern: /\brelajá\b/i, description: "voseo imperative: relajá" },
  { pattern: /\bprobá\b/i, description: "voseo imperative: probá" },
  { pattern: /\bactivá\b/i, description: "voseo imperative: activá" },
  { pattern: /\bguardá\b/i, description: "voseo imperative: guardá" },
  { pattern: /\bconstruí\b/i, description: "voseo imperative: construí" },
  { pattern: /\bdescansá\b/i, description: "voseo imperative: descansá" },
  { pattern: /\bmoveté\b/i, description: "voseo imperative: moveté" },
  { pattern: /\bmové\b/i, description: "voseo imperative: mové" },
  { pattern: /\binstalá\b/i, description: "voseo imperative: instalá" },
  { pattern: /\bconsultá\b/i, description: "voseo imperative: consultá" },
  { pattern: /\bactualizá\b/i, description: "voseo imperative: actualizá" },
  { pattern: /\bingresá\b/i, description: "voseo imperative: ingresá" },
  { pattern: /\bdetené\b/i, description: "voseo imperative: detené" },
  { pattern: /\bdetenete\b/i, description: "voseo imperative: detenete" },
  { pattern: /\bdetenela\b/i, description: "voseo imperative: detenela" },
  { pattern: /\bdetenelo\b/i, description: "voseo imperative: detenelo" },
  { pattern: /\bavisame\b/i, description: "voseo imperative: avisame" },
  { pattern: /\belegí\b/i, description: "voseo imperative: elegí" },
  { pattern: /\bseguí\b/i, description: "voseo imperative: seguí" },
  { pattern: /\bcaminá\b/i, description: "voseo imperative: caminá" },
  { pattern: /\bparpadeá\b/i, description: "voseo imperative: parpadeá" },
  { pattern: /\bmantené\b/i, description: "voseo imperative: mantené" },
  { pattern: /\bajustá\b/i, description: "voseo imperative: ajustá" },
  { pattern: /\bsacudí\b/i, description: "voseo imperative: sacudí" },
  { pattern: /\bcambiá\b/i, description: "voseo imperative: cambiá" },
  { pattern: /\bcombinalo\b/i, description: "voseo imperative: combinalo" },
  { pattern: /\bestirá\b/i, description: "voseo imperative: estirá" },
  { pattern: /\bprepará\b/i, description: "voseo imperative: prepará" },
  { pattern: /\bbajá\b/i, description: "voseo imperative: bajá" },
  // common regionalisms
  { pattern: /\bacá\b/i, description: "regional: acá (prefer aquí)" },
  { pattern: /\bvos\b/i, description: "regional pronoun: vos" },
];

function collectStrings(node: unknown, path: string, out: Array<{ path: string; value: string }>) {
  if (typeof node === "string") {
    out.push({ path, value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      collectStrings(v, path ? `${path}.${k}` : k, out);
    }
  }
}

function scan(strings: Array<{ path: string; value: string }>): string[] {
  const hits: string[] = [];
  for (const { path, value } of strings) {
    for (const { pattern, description } of FORBIDDEN_PATTERNS) {
      if (pattern.test(value)) {
        hits.push(`${description} at ${path}: "${value}"`);
      }
    }
  }
  return hits;
}

describe("es dictionary — Spanish neutro (tú), no voseo or regionalisms", () => {
  it("dictionary strings use neutral Spanish", () => {
    const strings: Array<{ path: string; value: string }> = [];
    collectStrings(es, "", strings);
    const hits = scan(strings);
    expect(hits, hits.join("\n")).toEqual([]);
  });

  it("SEO content in Spanish uses neutral Spanish", () => {
    const strings: Array<{ path: string; value: string }> = [];
    for (const [key, pair] of Object.entries(SEO_CONTENT)) {
      collectStrings(pair.es, `${key}.es`, strings);
    }
    const hits = scan(strings);
    expect(hits, hits.join("\n")).toEqual([]);
  });
});
