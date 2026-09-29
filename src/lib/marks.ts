/**
 * Light emphasis for short copy kept in data (the landing statement, card
 * summaries, case-study sections): `**words**` for a core statement,
 * `==words==` for a marked phrase, `[words](href)` for a link. Marked.astro
 * renders it; `plain` strips it wherever the text leaves the page's own
 * markup (meta descriptions, structured data).
 */
export type Run = { text: string; kind?: 'strong' | 'mark' | 'link'; href?: string };

const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

export const runs = (text: string): Run[] =>
  text
    .split(/(\*\*[^*]+\*\*|==[^=]+==|\[[^\]]+\]\([^)\s]+\))/)
    .filter(Boolean)
    .map((part): Run => {
      const link = LINK.exec(part);
      if (link) return { text: link[1], kind: 'link', href: link[2] };
      if (part.startsWith('**')) return { text: part.slice(2, -2), kind: 'strong' };
      if (part.startsWith('==')) return { text: part.slice(2, -2), kind: 'mark' };
      return { text: part };
    });

export const plain = (text: string): string =>
  runs(text)
    .map((run) => run.text)
    .join('');
