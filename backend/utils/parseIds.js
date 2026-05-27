/** Parse chapter_ids / story_ids stored as JSON arrays or legacy bracket strings. */
export function parseIds(idsString) {
  if (!idsString) return [];
  if (Array.isArray(idsString)) return idsString;
  if (typeof idsString !== 'string') return [];

  const trimmed = idsString.trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed.replace(/'/g, '"'));
  } catch {
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    return [];
  }
}
