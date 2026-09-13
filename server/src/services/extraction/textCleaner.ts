// Light-touch cleanup only — the spec explicitly warns against aggressive
// cleaning that could change meaning, so this normalizes whitespace/artifacts
// without touching punctuation, numbers, dates, or casing.
const CONTROL_CHARS_EXCEPT_TAB_NEWLINE = new RegExp(
  '[' + String.fromCharCode(0) + '-' + String.fromCharCode(8) +
  String.fromCharCode(11) + String.fromCharCode(12) +
  String.fromCharCode(14) + '-' + String.fromCharCode(31) +
  String.fromCharCode(127) + ']',
  'g'
);

export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(CONTROL_CHARS_EXCEPT_TAB_NEWLINE, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +\n/g, '\n')
    .trim();
}
