"""Compile Google Maps notice timing from two official machine-readable reports.

Standard library only; no case-level reviews, secrets or customer data. Original
archives stay in the ignored task source folder. --fetch refreshes those files.
"""
from pathlib import Path
from fractions import Fraction
from statistics import median
from math import ceil
import argparse,csv,hashlib,io,json,urllib.request,zipfile

ROOT=Path(__file__).resolve().parent
SITE=ROOT.parent.parent
DATE='2026-11-05'
URL='https://reviewremoval.ca/blog/google-review-removal-time-data.html'
LICENSE='https://creativecommons.org/licenses/by/4.0/'
REPORTS=[
 {'id':'2025H2','period_start':'2025-07-01','period_end':'2025-12-31','report_published':'2026-02-27','url':'https://storage.googleapis.com/transparencyreport/report-downloads/Google%20Maps%20-%20DSA%20Feb%202026_2025-7-1_2025-12-31.zip'},
 {'id':'2026H1','period_start':'2026-01-01','period_end':'2026-06-30','report_published':'2026-08-28','url':'https://storage.googleapis.com/transparencyreport/report-downloads/Google%20Maps%20-%20DSA%20Aug%202026_2026-1-1_2026-6-30.zip'}]
METRICS=[('notices',5,'count'),('trusted_notices',6,'count'),('items',7,'count'),('trusted_items',8,'count'),('median_hours',9,'hours'),('trusted_median_hours',10,'hours'),('law_actions',11,'count'),('trusted_law_actions',12,'count'),('terms_actions',13,'count'),('trusted_terms_actions',14,'count')]
LABELS={'TOTAL':'All notices','CONSUMER_INFORMATION':'Consumer information','CYBER_VIOLENCE':'Cyber violence','DATA_PROTECTION_AND_PRIVACY_VIOLATIONS':'Data protection and privacy','ILLEGAL_OR_HARMFUL_SPEECH':'Illegal or harmful speech','INTELLECTUAL_PROPERTY_INFRINGEMENTS':'Intellectual property','NEGATIVE_EFFECTS_ON_CIVIC_DISCOURSE_OR_ELECTIONS':'Civic discourse or elections','PROTECTION_OF_MINORS':'Protection of minors','RISK_FOR_PUBLIC_SECURITY':'Public security','SCAMS_AND_FRAUD':'Scams and fraud','NOT_SPECIFIED_NOTICE':'Not specified'}
parser=argparse.ArgumentParser();parser.add_argument('--fetch',action='store_true');parser.add_argument('--source-dir',type=Path)
args=parser.parse_args()
source_dir=args.source_dir or SITE/'.seo-private/google-notice-timing-2026-11-05/sources'
source_dir.mkdir(parents=True,exist_ok=True)
cells=[];categories=[];periods=[];sources=[]

for report in REPORTS:
 path=source_dir/(report['id']+'.zip')
 if args.fetch or not path.exists():
  request=urllib.request.Request(report['url'],headers={'User-Agent':'ReviewRemoval public research/1.0'})
  with urllib.request.urlopen(request,timeout=45) as response:raw=response.read()
  path.write_bytes(raw)
 else:raw=path.read_bytes()
 with zipfile.ZipFile(io.BytesIO(raw)) as archive:
  raw_csv=archive.read('4_notices.csv');qual=archive.read('11_qualitative.csv');identification=archive.read('1_report_identification.csv')
  rows=list(csv.reader(io.StringIO(raw_csv.decode('utf-8-sig'))))
  assert len(rows)==141 and len(rows[0])==25
  qrows=list(csv.reader(io.StringIO(qual.decode('utf-8-sig'))))
  qnotice=qrows[13][4];qgeneral=qrows[17][4]
  assert 'notices where it was decided not to take action' in qnotice
  assert 'all median times are reported in hours' in qgeneral
  xlsx_name=next(name for name in archive.namelist() if name.endswith('.xlsx'))
  source={**report,'accessed':DATE,'zip_sha256':hashlib.sha256(raw).hexdigest(),'csv_file':'4_notices.csv','csv_sha256':hashlib.sha256(raw_csv).hexdigest(),'xlsx_file':xlsx_name,'xlsx_sha256':hashlib.sha256(archive.read(xlsx_name)).hexdigest(),'qualitative_sha256':hashlib.sha256(qual).hexdigest(),'identification_sha256':hashlib.sha256(identification).hexdigest(),'qualitative_notice_row':14,'qualitative_units_row':18,'scope':'EU-focused Google Maps legal-notice disclosure, all relevant content; not Canadian review-removal cases'}
  sources.append(source)
  parent='';local=[]
  for row_number,row in enumerate(rows[1:],2):
   assert row[1]=='Google Maps' and row[2]==report['period_start']+'/'+report['period_end']
   category=row[3];other=row[4] if len(row)>4 else '';is_parent=category.startswith('STATEMENT_CATEGORY_')
   if is_parent:parent=category
   level='total' if category=='TOTAL' else 'category' if is_parent else 'subcategory'
   numbers={}
   for metric,index,unit in METRICS:
    raw_value=row[index] if index<len(row) else ''
    assert not raw_value or raw_value.isdigit()
    value=int(raw_value) if raw_value else None;numbers[metric]=value
    status='reported_integer' if raw_value else 'empty_field' if index<len(row) else 'omitted_trailing_field'
    cells.append({'record_id':f"{report['id']}-R{row_number}-C{index+1}",'source_id':report['id'],'hierarchy_level':level,'parent_category':parent if level=='subcategory' else '', 'category_id':category,'other_label':other,'metric':metric,'value':value,'value_status':status,'unit':unit,'source_csv_row':row_number,'source_csv_column':index+1,'source_url':report['url']})
   if level in ['total','category']:
    label=LABELS.get(category.replace('STATEMENT_CATEGORY_',''),category.replace('STATEMENT_CATEGORY_','').replace('_',' ').title())
    local.append({'record_id':report['id']+'-'+category,'source_id':report['id'],'period_start':report['period_start'],'period_end':report['period_end'],'hierarchy_level':level,'category_id':category,'label':label,'notices':numbers['notices'],'items':numbers['items'],'reported_median_hours':numbers['median_hours'],'trusted_notices':numbers['trusted_notices'],'trusted_reported_median_hours':numbers['trusted_median_hours'],'source_csv_row':row_number,'source_url':report['url']})
  total=next(r for r in local if r['hierarchy_level']=='total')
  for r in local:r['receipt_share_pct']=None if r['notices'] is None else float(Fraction(100*r['notices'],total['notices']))
  assert sum(r['notices'] for r in local if r['hierarchy_level']=='category' and r['notices'] is not None)==total['notices']
  speech=next(r for r in local if r['category_id']=='STATEMENT_CATEGORY_ILLEGAL_OR_HARMFUL_SPEECH')
  periods.append({'source_id':report['id'],'notices':total['notices'],'items':total['items'],'overall_reported_median_hours':total['reported_median_hours'],'speech_category_notices':speech['notices'],'speech_category_receipt_share_pct':speech['receipt_share_pct'],'speech_category_reported_median_hours':speech['reported_median_hours'],'published_parent_categories':sum(r['hierarchy_level']=='category' and r['notices'] is not None for r in local),'interpretation':'Descriptive period composition. Receipt counts are not the unpublished denominator of the median; no causal attribution or individual-case prediction.'})
  categories.extend(local)

examples=[]
for name,fast,slow,slow_hours in [('All at one hour',1001,0,1),('Day-long tail',501,500,24),('Week-long tail',501,500,168),('Month-long tail',501,500,720)]:
 values=[1]*fast+[slow_hours]*slow
 examples.append({'scenario':name,'record_type':'constructed_teaching_example_not_google_observations','total_cases':len(values),'one_hour_cases':fast,'slower_cases':slow,'slower_group_hours':slow_hours,'median_hours':median(values),'mean_hours':float(Fraction(sum(values),len(values))),'p95_nearest_rank_hours':sorted(values)[ceil(.95*len(values))-1],'slower_share_pct':float(Fraction(100*slow,len(values))),'assumptions':'Constructed fixed durations, 1001 cases; nearest-rank p95. These cases do not estimate actual Google delays, distribution or removal probability.'})

D={'title':'Google Maps notice timing: source-cell audit and median-composition analysis','version':'1.0.0','published':DATE,'article_url':URL,'license':LICENSE,'sources':sources,'summary':{'source_cells':len(cells),'reported_numeric_cells':sum(r['value'] is not None for r in cells),'empty_cells':sum(r['value_status']=='empty_field' for r in cells),'omitted_trailing_cells':sum(r['value_status']=='omitted_trailing_field' for r in cells),'category_and_total_rows':len(categories),'period_summaries':len(periods),'constructed_examples':len(examples),'individually_observed_reviews':0},'source_cells':cells,'categories':categories,'periods':periods,'constructed_examples':examples,'limitations':['Published notice processing includes decisions not to act, not only removals.','Google Maps content is broader than reviews; EU-focused legal notices differ from Canadian merchant policy reports.','Overall rows overlap their categories; categories overlap their subcategories. Never sum these levels together.','Empty and omitted cells are not zero. Published numeric zeros are preserved.','Receipt shares describe receipts, not the unpublished case mix underlying each median. A dominant receipt category does not identify the cause of an overall median.','Medians cannot reveal the maximum wait, the tail, the mean or a review-removal probability.','Printed whole-hour medians do not identify an unreported rounding rule or prove instantaneous decisions.','Constructed examples are separate teaching models, not 4004 observed Google cases.']}
definitions={'value':'Published integer or empty/null, never an imputed zero.','value_status':'reported_integer, empty_field or omitted_trailing_field in the original CSV record.','notices':'Published legal-notice receipts; not business owners, reviews, or the denominator of the median.','reported_median_hours':'Publisher-reported median processing duration including decisions not to act; hours, not days or a Canadian removal SLA.','receipt_share_pct':'100 × category receipts / total receipts. This is not the distribution of cases used to compute the reported median.','hierarchy_level':'total, category or subcategory; these levels overlap and must not be added together.','p95_nearest_rank_hours':'Constructed-example 95th percentile at sorted rank ceil(0.95 × N), not an observed Google percentile.'}
for filename,records in [('google-notice-source-cells.csv',cells),('google-notice-category-summary.csv',categories),('google-notice-period-summary.csv',periods),('google-notice-median-examples.csv',examples)]:
 with (ROOT/filename).open('w',encoding='utf-8',newline='') as stream:
  writer=csv.DictWriter(stream,fieldnames=list(records[0]),lineterminator='\n');writer.writeheader();writer.writerows(records)
 columns=[]
 for key in records[0]:
  values=[r[key] for r in records if r[key] is not None]
  dtype='integer' if values and all(isinstance(v,int) for v in values) else 'number' if values and all(isinstance(v,(int,float)) for v in values) else 'string'
  columns.append({'name':key,'datatype':dtype,'null':[''],'dc:description':definitions.get(key,key.replace('_',' '))})
 (ROOT/(filename+'-metadata.json')).write_text(json.dumps({'@context':'http://www.w3.org/ns/csvw','url':'https://reviewremoval.ca/blog/data/'+filename,'dc:title':D['title']+' — '+filename,'dc:license':LICENSE,'tableSchema':{'columns':columns}},indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(ROOT/'google-notice-timing-study.json').write_text(json.dumps(D,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(ROOT/'google-notice-timing-study.bib').write_text('@misc{reviewremoval2026noticetiming,\n  author = {{ReviewRemoval}},\n  title = {Google Maps Notice Timing: Source-Cell Audit and Median-Composition Analysis},\n  year = {2026},\n  month = nov,\n  version = {1.0.0},\n  url = {'+URL+'},\n  note = {2800 source cells; constructed median examples are separate from Google disclosures. CC BY 4.0.}\n}\n',encoding='utf-8')
(ROOT/'google-notice-timing-study.cff').write_text('cff-version: 1.2.0\nmessage: "Cite Google for source counts and ReviewRemoval for this compilation and derived analysis."\ntype: dataset\ntitle: "Google Maps notice timing: source-cell audit and median-composition analysis"\nauthors:\n  - name: "ReviewRemoval"\nversion: 1.0.0\ndate-released: 2026-11-05\nurl: '+URL+'\nlicense: CC-BY-4.0\n',encoding='utf-8')
print(json.dumps(D['summary']))
