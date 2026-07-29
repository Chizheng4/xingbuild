export function countCompleteBriefs(entries, budget, { moreHeight = 0, railGap = 0 } = {}) {
  let count = 0;
  for (const entry of entries) {
    if (entry.top + entry.height + railGap + moreHeight <= budget) count += 1;
    else break;
  }
  return count;
}
