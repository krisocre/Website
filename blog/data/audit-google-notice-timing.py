"""Independent audit of every source cell against Google CSV and companion XLSX.
No builder imports. --fetch checks the current official archives instead of local
captures; --source-dir accepts independently downloaded period-ID ZIP files.
"""
from pathlib import Path
from fractions import Fraction
from decimal import Decimal
from statistics import median
from math import ceil,isclose
import argparse,csv,hashlib,io,json,posixpath,urllib.request,xml.etree.ElementTree as ET,zipfile
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-notice-timing-study.json').read_text(encoding='utf-8'))
parser=argparse.ArgumentParser();parser.add_argument('--fetch',action='store_true');parser.add_argument('--source-dir',type=Path)
args=parser.parse_args()
source_dir=args.source_dir or ROOT.parent.parent/'.seo-private/google-notice-timing-2026-11-05/sources'
assert D['summary']=={'source_cells':2800,'reported_numeric_cells':251,'empty_cells':1291,'omitted_trailing_cells':1258,'category_and_total_rows':32,'period_summaries':2,'constructed_examples':4,'individually_observed_reviews':0}
assert len({r['record_id'] for r in D['source_cells']})==2800
def sheet_values(outer):
 with zipfile.ZipFile(io.BytesIO(outer.read(next(n for n in outer.namelist() if n.endswith('.xlsx'))))) as book:
  ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
  workbook=ET.fromstring(book.read('xl/workbook.xml'))
  sheet=next(s for s in workbook.findall('s:sheets/s:sheet',ns) if s.attrib['name']=='4_notices')
  rid=sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
  target=next(r.attrib['Target'] for r in ET.fromstring(book.read('xl/_rels/workbook.xml.rels')) if r.attrib['Id']==rid)
  member=target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join('xl',target))
  strings=[''.join(n.text or '' for n in s.findall('.//s:t',ns)) for s in ET.fromstring(book.read('xl/sharedStrings.xml')).findall('s:si',ns)]
  values={}
  for cell in ET.fromstring(book.read(member)).findall('s:sheetData/s:row/s:c',ns):
   value=cell.find('s:v',ns)
   if value is not None:values[cell.attrib['r']]=strings[int(value.text)] if cell.attrib.get('t')=='s' else value.text
  return values

for source in D['sources']:
 if args.fetch:
  request=urllib.request.Request(source['url'],headers={'User-Agent':'ReviewRemoval independent data audit/1.0'})
  with urllib.request.urlopen(request,timeout=45) as response:raw=response.read()
 else:raw=(source_dir/(source['id']+'.zip')).read_bytes()
 assert hashlib.sha256(raw).hexdigest()==source['zip_sha256']
 with zipfile.ZipFile(io.BytesIO(raw)) as archive:
  for member,key in [('4_notices.csv','csv_sha256'),('11_qualitative.csv','qualitative_sha256'),('1_report_identification.csv','identification_sha256'),(source['xlsx_file'],'xlsx_sha256')]:
   assert hashlib.sha256(archive.read(member)).hexdigest()==source[key]
  rows=list(csv.reader(io.StringIO(archive.read('4_notices.csv').decode('utf-8-sig'))))
  worksheet=sheet_values(archive)
  assert rows[0][9]=='Median time to take action'
  for cell in D['source_cells']:
   if cell['source_id']!=source['id']:continue
   r=cell['source_csv_row']-1;c=cell['source_csv_column']-1
   raw_value=rows[r][c] if c<len(rows[r]) else ''
   assert cell['value']==(int(raw_value) if raw_value else None)
   assert cell['value_status']==('reported_integer' if raw_value else 'empty_field' if c<len(rows[r]) else 'omitted_trailing_field')
   companion=worksheet.get(chr(65+c)+str(r+1),'')
   assert cell['value']==(Decimal(companion) if companion else None),(source['id'],r,c,companion)
   assert cell['unit']==('hours' if cell['metric'].endswith('hours') else 'count')

expected={'2025H2':(975841,1315323,0,968816),'2026H1':(964380,1338970,1,951869)}
for period in D['periods']:
 sid=period['source_id'];assert (period['notices'],period['items'],period['overall_reported_median_hours'],period['speech_category_notices'])==expected[sid]
 assert isclose(period['speech_category_receipt_share_pct'],100*expected[sid][3]/expected[sid][0],abs_tol=1e-12)
 rows=[r for r in D['categories'] if r['source_id']==sid]
 assert len(rows)==16
 assert sum(r['notices'] for r in rows if r['hierarchy_level']=='category' and r['notices'] is not None)==expected[sid][0]
 for row in rows:
  source_cells={c['metric']:c['value'] for c in D['source_cells'] if c['source_id']==sid and c['source_csv_row']==row['source_csv_row']}
  assert row['reported_median_hours']==source_cells['median_hours'] and row['notices']==source_cells['notices']
  if row['notices'] is None:assert row['receipt_share_pct'] is None
  else:assert isclose(row['receipt_share_pct'],100*row['notices']/expected[sid][0],abs_tol=1e-12)
for example in D['constructed_examples']:
 values=sorted([1]*example['one_hour_cases']+[example['slower_group_hours']]*example['slower_cases'])
 assert len(values)==1001 and median(values)==example['median_hours']==1
 assert example['p95_nearest_rank_hours']==values[ceil(Fraction(95*len(values),100))-1]
 assert isclose(example['mean_hours'],sum(values)/len(values),abs_tol=1e-12)
 assert example['record_type']=='constructed_teaching_example_not_google_observations'
for filename,key in [('google-notice-source-cells.csv','source_cells'),('google-notice-category-summary.csv','categories'),('google-notice-period-summary.csv','periods'),('google-notice-median-examples.csv','constructed_examples')]:
 with (ROOT/filename).open(encoding='utf-8',newline='') as stream:rows=list(csv.DictReader(stream))
 assert rows==[{k:'' if v is None else str(v) for k,v in row.items()} for row in D[key]]
 meta=json.loads((ROOT/(filename+'-metadata.json')).read_text(encoding='utf-8'))
 assert [c['name'] for c in meta['tableSchema']['columns']]==list(rows[0])
 assert all(c['null']==[''] for c in meta['tableSchema']['columns'])
print('PASS: all 2800 cells cross-checked with official CSV/XLSX, 251 numbers and 2549 missing cells preserved; category arithmetic, four constructed median examples and CSV/JSON/CSVW parity verified.')
