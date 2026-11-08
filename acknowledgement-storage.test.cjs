const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const {workbookFixture} = require('./acknowledgement-sheet-fixture.cjs');
const root = fs.existsSync(path.join(__dirname, 'google-apps-script.gs')) ? __dirname : path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'google-apps-script.gs'), 'utf8');
const brand = source.includes('function reviewsBoostFormSettings(') ? 'ReviewsBoost' : 'ReviewRemoval';
const width = brand === 'ReviewsBoost' ? 12 : 13;
const domain = brand === 'ReviewsBoost' ? 'reviewsboost.ca' : 'reviewremoval.ca';
const record = ['[Submission acknowledgement]', 'Notice: Linked submission notice.',
  'Terms: https://' + domain + '/terms-of-service.html | version 2026-10-27',
  'Policy snapshot: https://' + domain + '/legal-versions/policies-2026-10-27.json',
  'Privacy: https://' + domain + '/privacy-policy.html | version 2026-10-27', 'Language: en-CA',
  'Method: submission after linked notice; not a claim of document reading',
  'Client-device time: 2026-10-28T03:32:44.853Z'].join('\n');
const notes = '[Traffic Source: Paid - Google Ads]\nKeep customer notes.\n\n' + record +
  '\nSubmission page: https://' + domain + '/\nKeep trailing notes.\nRequest reference: RB-00000000-0000-4000-8000-000000000001';
function lead(reason = notes) { const row = Array(width).fill('untouched'); row[11] = reason; return row; }
function fixture(options = {}) {
  const book = workbookFixture({brand, width, rows:options.rows || [], options});
  const props = {SPREADSHEET_ID:'LOCAL_SHEET', SHEET_NAME:'Leads', NOTIFICATION_EMAIL:'owner@example.invalid',
    TURNSTILE_SECRET:'LOCAL_SECRET', TURNSTILE_HOSTNAMES:domain};
  let locked = false, tokens = 0, opens = 0;
  const emails = [], errors = [];
  const api = {
    console:{error:value=>errors.push(value),log(){}},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k] || null,
      getProperties:()=>({...props}), setProperty:(k,v)=>{props[k]=v;}, deleteProperty:k=>{delete props[k];}})},
    SpreadsheetApp:{openById(id) {assert.equal(id, 'LOCAL_SHEET'); opens++; return book.spreadsheet;}, flush(){}},
    LockService:{getScriptLock:()=>({tryLock(){if(locked)return false;locked=true;return true;},
      waitLock(){assert.equal(locked,false);locked=true;},releaseLock(){assert.equal(locked,true);locked=false;}})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha'},Charset:{UTF_8:'utf8'},getUuid:()=>'00000000-0000-4000-8000-000000000001',
      computeDigest:(_,text)=>Array.from(crypto.createHash('sha256').update(text).digest())},
    UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({success:true,action:'quote_request',hostname:domain})})},
    MailApp:{sendEmail(...args){emails.push(args);}},
    Session:{getEffectiveUser:()=>({getEmail:()=>'owner@example.invalid'})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})}
  };
  vm.runInNewContext(source,api);
  const payload={full_name:'Local Test',business_name:'Local Shop',email_address:'local@example.invalid',
    selected_plan:'Google Review Removal',form_type:'remove_reviews',review_count:'1',reason:notes,traffic_source:'paid_google'};
  return {api,book,emails,errors,props,locked:()=>locked,opens:()=>opens,
    post:overrides=>JSON.parse(api.doPost({parameter:{...payload,'cf-turnstile-response':'LOCAL_TOKEN_'+tokens++,...overrides}}).text)};
}

test(brand + ': future lead archives the full block before cleaning email/main notes; original columns remain',()=>{
  const f=fixture(),result=f.post();assert.equal(result.result,'success');assert.equal(result.acknowledgement_archived,true);
  assert.equal(f.book.rows[0].length,width);assert.equal(f.book.audit().hidden,true);
  assert.match(f.book.audit().rows[0][5],/\[Submission acknowledgement\]/);
  assert.ok(f.book.actions.indexOf('append:'+brand+' Acknowledgements') < f.book.actions.indexOf('set:Leads'));
  for(const text of ['Keep customer notes.','Keep trailing notes.','Traffic Source: Paid - Google Ads','Request reference: RB-']){
    assert.ok(f.book.rows[0][11].includes(text));assert.ok(f.emails[0][2].includes(text));
  }
  assert.ok(!f.book.rows[0][11].includes(record));assert.ok(!f.emails[0][2].includes(record));
  assert.equal(f.emails.length,1);assert.equal(f.locked(),false);
});

test(brand + ': invalid verification cannot open sheets, create an audit tab or send mail',()=>{
  const f=fixture(),result=f.post({'cf-turnstile-response':''});assert.equal(result.code,'verification_failed');
  assert.equal(f.opens(),0);assert.equal(f.book.audit(),undefined);assert.equal(f.emails.length,0);
});

test(brand + ': a concurrently appended different row cannot be archived or cleared for this request',()=>{
  const f=fixture({rows:[lead('Another enquiry\n'+record)]}),before=JSON.stringify(f.book.rows);
  assert.equal(f.api.archiveAcknowledgementRow(f.book.spreadsheet,f.book.leadSheet,2,brand,notes),false);
  assert.equal(JSON.stringify(f.book.rows),before);assert.equal(f.book.audit(),undefined);
});

test(brand + ': preview counts matching existing rows without writing or mailing',()=>{
  const rows=[lead(),lead('Keep literal [Submission acknowledgement] without generated metadata')],f=fixture({rows});
  const before=JSON.stringify(rows),result=f.api.previewAcknowledgementCleanup();
  assert.equal(result.dry_run,true);assert.equal(result.scanned,2);assert.equal(result.matching,1);
  assert.equal(JSON.stringify(rows),before);assert.equal(f.book.audit(),undefined);assert.equal(f.emails.length,0);
});

test(brand + ': existing-row cleanup preserves every other cell, handles legacy/CRLF, and is repeatable',()=>{
  const rows=[lead(),lead('before\r\n'+record.replace(/\n/g,'\r\n')+'\r\nafter'),lead('Literal [Submission acknowledgement] stays')];
  const before=rows.map(r=>r.slice()),f=fixture({rows}),result=f.api.cleanExistingAcknowledgements();
  assert.equal(result.cleaned,2);assert.equal(result.remaining,0);assert.equal(f.book.audit().rows.length,2);
  for(let i=0;i<rows.length;i++) for(let c=0;c<width;c++) if(c!==11) assert.equal(rows[i][c],before[i][c]);
  assert.equal(rows[1][11],'before\r\n\r\nafter');assert.equal(rows[2][11],before[2][11]);
  assert.equal(f.api.cleanExistingAcknowledgements().cleaned,0);assert.equal(f.book.audit().rows.length,2);
  assert.equal(f.emails.length,0);assert.equal(f.locked(),false);
});

test(brand + ': cleanup is limited to 50 matches per run and can finish the remainder',()=>{
  const f=fixture({rows:Array.from({length:52},()=>lead())});
  assert.equal(f.api.cleanExistingAcknowledgements().remaining,2);assert.equal(f.book.audit().rows.length,50);
  assert.equal(f.api.cleanExistingAcknowledgements().remaining,0);assert.equal(f.book.audit().rows.length,52);
});

test(brand + ': archive failure or conflicting audit tab leaves main notes intact; future saved leads still succeed',()=>{
  for(const option of ['auditFailure','badAuditHeaders','parentFailure']){
    if(option==='parentFailure' && brand!=='ReviewsBoost')continue;
    const f=fixture({[option]:true}),result=f.post();
    assert.equal(result.result,'success',option);assert.equal(result.acknowledgement_archived,false,option);
    assert.ok(f.book.rows[0][11].includes(record));assert.ok(!f.emails[0][2].includes(record));
    assert.equal(f.emails.length,1);assert.equal(f.locked(),false);
  }
});

test(brand + ': failed cell cleanup retries without duplicate audit; concurrent manual notes are preserved',()=>{
  const options={rows:[lead()],cellFailure:true},f=fixture(options);
  assert.equal(f.api.cleanExistingAcknowledgements().failed,1);assert.ok(f.book.rows[0][11].includes(record));
  assert.equal(f.book.audit().rows.length,1);options.cellFailure=false;
  assert.equal(f.api.cleanExistingAcknowledgements().cleaned,1);assert.equal(f.book.audit().rows.length,1);
  const concurrent=fixture({rows:[lead()],onAuditAppend:rows=>{rows[0][11]='Manually edited notes';}});
  assert.equal(concurrent.api.cleanExistingAcknowledgements().failed,1);
  assert.equal(concurrent.book.rows[0][11],'Manually edited notes');assert.equal(concurrent.book.audit().rows.length,1);
});

test(brand + ': cleanup refuses wrong Reason header and formula-escapes newly exposed text',()=>{
  const f=fixture({rows:[lead(record+'\n=not a formula')]}),before=JSON.stringify(f.book.rows);
  f.book.leadSheet.headers[11]='Unrelated column';
  assert.throws(()=>f.api.cleanExistingAcknowledgements(),/Reason in L1/);assert.equal(JSON.stringify(f.book.rows),before);
  f.book.leadSheet.headers[11]='Reason';f.api.cleanExistingAcknowledgements();
  assert.equal(f.book.rows[0][11],"'=not a formula");assert.equal(f.emails.length,0);
});
