/** Split story body into readable pages (paragraphs, then sentence-aware chunks). */
export function splitStoryIntoPages(body, maxChars = 700) {
  const trimmed = String(body ?? '').trim();
  if (!trimmed) return [''];

  const paragraphs = trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;

  const single = paragraphs[0] || trimmed;
  if (single.length <= maxChars) return [single];

  const pages = [];
  let rest = single;
  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf('. ', maxChars);
    if (cut < maxChars * 0.35) cut = rest.lastIndexOf(' ', maxChars);
    if (cut < 1) cut = maxChars;
    pages.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) pages.push(rest);
  return pages.length ? pages : [single];
}
