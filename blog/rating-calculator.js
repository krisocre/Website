(function () {
  'use strict';
  const form=document.querySelector('[data-rating-calculator]');
  if(!form || !window.ReviewRatingModel) return;
  const output=document.querySelector('[data-rating-result]');
  const fixed=value=>value.toFixed(4);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity()) return;
    const data=new FormData(form);
    const count=Number(data.get('rating_count')),rating=Number(data.get('rating_display')),
      removed=Number(data.get('rating_removed')),stars=Number(data.get('rating_stars'));
    try {
      const r=window.ReviewRatingModel.bounds(count,Math.round(rating*10),removed,stars);
      if(!r) {output.textContent='These inputs cannot coexist under this whole-star rounding model. Check the rating, review count and number of reviews at the chosen star rating.';return;}
      const low=(r.minDisplay/10).toFixed(1),high=(r.maxDisplay/10).toFixed(1);
      output.textContent=`Modelled displayed rating after removal: ${low===high?low:low+'–'+high}. Attainable average before: ${fixed(r.minBefore)}–${fixed(r.maxBefore)}; after: ${fixed(r.minAfter)}–${fixed(r.maxAfter)}. ${r.attainableTotals.toLocaleString('en-CA')} possible integer star totals fit these inputs. This is an arithmetic range, not a removal forecast.`;
    } catch(error) {output.textContent=error.message;}
  });
})();
