/**
 * Normalize principle rows from API (handles id/name aliases and wrapped payloads).
 */
export function normalizePrinciple(row) {
  if (row == null || typeof row !== 'object') return null;

  const principleId = String(
    row.principleId
      ?? row.principle_id
      ?? row.id
      ?? row.principleid
      ?? '',
  ).trim();

  const name = String(
    row.name
      ?? row.principleName
      ?? row.principle_name
      ?? row.principlename
      ?? '',
  ).trim();

  if (!principleId) return null;

  return {
    id: principleId,
    principleId,
    name: name || principleId,
  };
}

export function normalizePrinciplesList(data) {
  if (data == null) return [];

  let list = data;
  if (!Array.isArray(list)) {
    list = data.principles ?? data.items ?? data.rows ?? data.data ?? [];
  }
  if (!Array.isArray(list)) {
    console.warn('[principles] Expected array, got:', typeof data, data);
    return [];
  }

  return list.map(normalizePrinciple).filter(Boolean);
}

export function formatPrincipleOptionLabel(principle) {
  const id = principle?.principleId ?? principle?.id ?? '';
  const name = principle?.name ?? '';
  if (id && name && id !== name) return `${id} - ${name}`;
  return id || name || 'Unnamed principle';
}
