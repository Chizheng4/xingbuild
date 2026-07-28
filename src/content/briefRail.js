export function countCompleteBriefs(entries, budget) {
  let count = 0;
  for (const entry of entries) {
    if (entry.top + entry.height <= budget) count += 1;
    else break;
  }
  return count;
}
