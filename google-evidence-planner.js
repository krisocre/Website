/* Original preparation worksheet. It does not score eligibility or predict removal. */
(function (root) {
  'use strict';
  const concerns = {
    fake: {label:'Suspected fake engagement', items:['Exact review URL and original wording, with the date you observed it.','What you checked in your records, the date range and the limits of that search.','Relevant repeated text, timing or first-hand evidence of coordination, if available.'], caution:'An unfamiliar display name or a missing purchase record does not, by itself, prove a fake review.'},
    conflict: {label:'A documented conflict of interest', items:['The specific relationship you can establish and why it concerns this review.','Relevant dates and a short, factual explanation.','Shareable evidence of that relationship, with unnecessary personal details omitted.'], caution:'State documented facts. Do not publicly identify someone as a competitor or employee on a guess.'},
    wrong: {label:'Wrong business or unrelated content', items:['The exact passage that describes another location, business or unrelated subject.','The correct public business details for your listing.','A concise comparison showing the mismatch without inventing a customer history.'], caution:'A different opinion about your service is not the same as a review of the wrong business.'},
    private: {label:'Private information in the review', items:['The exact passage containing the information of concern.','Explain what is private and how it relates to an identifiable person.','Keep the original securely; use a redacted working copy where possible.'], caution:'A publicly advertised professional name is not automatically prohibited. Check the applicable policy exception.'},
    threat: {label:'Threats or targeted harassment', items:['The exact threatening or harassing passage and the review URL.','The date observed and relevant context you can document.','Preserve messages associated with the incident separately.'], caution:'A critical description of service is different from a specific threat. A review report is not emergency assistance.'},
    extortion: {label:'A demand for payment or favours', items:['The demand, with visible sender details, date and time.','All directly related review URLs, with the date each appeared.','A short chronology connecting the communications to the reviews.'], caution:'Use Google’s dedicated merchant extortion route for a direct demand linked to review removal. Do not pay the person making the demand.'},
    negative: {label:'Negative feedback without a specific policy concern', items:['Keep a record of the review and any service issue you can address.','Prepare a calm response without private customer information.','If new facts establish a policy concern, record those facts before considering a report.'], caution:'A low rating or disagreement alone is not a removal case. This worksheet does not turn genuine criticism into a policy violation.'}
  };
  const stages = {
    new:{label:'Not reported yet', action:'Prepare one clear report against the relevant Google policy. Keep a dated copy of what you submit.'},
    pending:{label:'Report submitted; decision pending', action:'Check the existing report status in the Reviews Management Tool. Keep the submission date and avoid treating an unresolved report as a refusal.'},
    declined:{label:'Reviewed; no policy violation found', action:'Review the stated decision against your evidence. If an appeal is offered, prepare the one-time appeal with the specific issue and relevant documentation.'},
    appealed:{label:'Appeal already submitted', action:'Keep the appeal confirmation and follow the decision emails. Record the actual final outcome rather than starting the same one-time appeal again.'}
  };
  function planFor(concern, stage) {
    if (!Object.hasOwn(concerns, concern) || !Object.hasOwn(stages, stage)) throw new RangeError('Choose a listed concern and reporting stage.');
    const item=concerns[concern];
    const action=concern==='extortion'?'Preserve the demand and use Google’s dedicated merchant extortion reporting process. Keep its correspondence separate from an ordinary review report.':concern==='negative'?'Work on the customer concern and an appropriate public response. A removal request needs a specific policy basis.':stages[stage].action;
    return {concern:item.label,stage:stages[stage].label,items:[...item.items],caution:item.caution,action,route:concern==='extortion'?'https://support.google.com/business/answer/16404809':'https://support.google.com/business/answer/4596773?hl=en'};
  }
  const api={concerns,stages,planFor};
  if (typeof module==='object' && module.exports) module.exports=api;
  if (typeof document==='undefined') return;
  const form=document.querySelector('#google-evidence-form');
  if (!form) return;
  const result=document.querySelector('#google-evidence-result');
  let current;
  function render(announce) {
    current=planFor(form.elements.concern.value,form.elements.stage.value);
    result.replaceChildren();
    const title=document.createElement('h3');title.textContent=current.concern;result.append(title);
    const action=document.createElement('p');action.textContent=current.action;result.append(action);
    const list=document.createElement('ul');for (const text of current.items){const li=document.createElement('li');li.textContent=text;list.append(li);}result.append(list);
    const caution=document.createElement('p');caution.textContent=current.caution;result.append(caution);
    const link=document.createElement('a');link.href=current.route;link.textContent=current.concern===concerns.extortion.label?'Read Google’s extortion reporting guidance':'Read Google’s reporting and appeal guidance';result.append(link);
    const download=document.createElement('button');download.type='button';download.className='button button-dark tool-download';download.textContent='Download my worksheet ↓';
    download.addEventListener('click',()=>{
      const text=['ReviewRemoval / Google review case worksheet','Preparation aid; not an eligibility assessment or removal prediction.','',`Concern: ${current.concern}`,`Reporting stage: ${current.stage}`,'','Business name:','Canadian city / location:','Google Business Profile URL:','Specific review URL:','Review wording and date observed:','Report date / reference:','Decision date / wording:','Appeal reference / result:','','Suggested next step:',current.action,'','Evidence to prepare:',...current.items.map(item=>'- '+item),'','Limits:',current.caution,'','Official route: '+current.route,'','Service: https://reviewremoval.ca/','Source guidance checked: 2026-10-13'].join('\n');
      const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='google-review-case-worksheet.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });result.append(download);
    if(announce)document.querySelector('#google-evidence-status').textContent='Worksheet updated for '+current.concern.toLowerCase()+'.';
  }
  form.addEventListener('submit',event=>{event.preventDefault();render(true);});render(false);
})(typeof window==='undefined'?globalThis:window);
