export function titleCase(value = '') {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getValue(item, keys) {
  const key = keys.find((candidate) => item?.[candidate] !== undefined);
  return key ? item[key] : '';
}
