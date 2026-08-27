export function formatYear(dateStr) {
  if (!dateStr) return 'present';
  return dateStr.slice(0, 4);
}

export function formatRange(from, to) {
  return `${formatYear(from)}–${formatYear(to)}`;
}
