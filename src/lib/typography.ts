/**
 * Keeps short units with their numbers and hyphenated names in one piece at
 * a line end: a no-break space between a number and a unit ("10 m", "4.4 kB")
 * and a no-break hyphen in "U-Net". Applied where copy from data renders
 * (Marked.astro, figure captions); the stored text keeps plain characters.
 */
const UNIT = /(\d) (mm|cm|m|km|kB|MB|GB|ms|s|ha|px)(?![\p{L}\d])/gu;

export const glue = (text: string): string => text.replace(UNIT, '$1 $2').replace(/\bU-Net\b/g, 'U‑Net');
