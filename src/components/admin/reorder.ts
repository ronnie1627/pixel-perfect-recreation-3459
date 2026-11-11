/** Move item i up (-1) or down (+1) and return the rows whose sort_order must change. */
export function reorderUpdates<T extends { id: string; sort_order: number }>(
  list: T[],
  index: number,
  dir: -1 | 1,
): { id: string; sort_order: number }[] {
  const target = index + dir;
  if (target < 0 || target >= list.length) return [];
  const next = [...list];
  const [moved] = next.splice(index, 1);
  if (!moved) return [];
  next.splice(target, 0, moved);
  return next
    .map((row, i) => ({ id: row.id, sort_order: (i + 1) * 10, before: row.sort_order }))
    .filter((r) => r.sort_order !== r.before)
    .map(({ id, sort_order }) => ({ id, sort_order }));
}
