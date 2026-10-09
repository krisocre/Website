/* ReviewRemoval rating sensitivity model, v1.0 / CC BY 4.0.
   Whole-star arithmetic with assumed nearest-tenth, half-up display rounding.
   This convention is a model assumption, not a documented Google tie rule. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ReviewRatingModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function displayedTenths(total, count) {
    return Math.floor((20 * total + count) / (2 * count));
  }
  function bounds(count, ratingTenths, removedCount, removedStars) {
    if (![count, ratingTenths, removedCount, removedStars].every(Number.isSafeInteger) ||
        count < 2 || count > 1000000 || ratingTenths < 10 || ratingTenths > 50 ||
        removedCount < 1 || removedCount >= count || removedStars < 1 || removedStars > 5) {
      throw new RangeError('Use 2–1,000,000 reviews, a 1.0–5.0 rating, and fewer removals than total reviews.');
    }
    // Each remaining rating is an integer from 1 to 5. Every integer total
    // between these limits is attainable by at least one star distribution.
    const minTotal = Math.max(count, Math.ceil((2 * ratingTenths - 1) * count / 20), removedCount * removedStars + count - removedCount);
    const maxTotal = Math.min(5 * count, Math.ceil((2 * ratingTenths + 1) * count / 20) - 1, removedCount * removedStars + 5 * (count - removedCount));
    if (minTotal > maxTotal) return null;
    const remaining = count - removedCount;
    const minAfter = (minTotal - removedCount * removedStars) / remaining;
    const maxAfter = (maxTotal - removedCount * removedStars) / remaining;
    const minDisplay = displayedTenths(minTotal - removedCount * removedStars, remaining);
    const maxDisplay = displayedTenths(maxTotal - removedCount * removedStars, remaining);
    return {
      count, ratingTenths, removedCount, removedStars, minTotal, maxTotal,
      attainableTotals: maxTotal - minTotal + 1, minBefore: minTotal / count, maxBefore: maxTotal / count,
      minAfter, maxAfter, minDisplay, maxDisplay,
      higherDisplay: minDisplay > ratingTenths ? 'all' : maxDisplay > ratingTenths ? 'some' : 'none'
    };
  }
  return {displayedTenths, bounds};
});
