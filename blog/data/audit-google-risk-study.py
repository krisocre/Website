"""Independent numerical, source-capture and CSV checks for the risk-denominator audit."""
from pathlib import Path
from fractions import Fraction
import csv,json,hashlib,math
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-risk-denominator-study.json').read_text(encoding='utf-8'))
I=json.loads((ROOT/'google-risk-source-values.json').read_text(encoding='utf-8'))
assert [r['profiles'] for r in D['velocity']]==[773,1472,1557,1155,639,137,71]
assert [r['five_star_deleted_share_percent'] for r in D['velocity']]==[72.6,86.6,90.2,91.4,91.9,91.9,93.4]
assert sum(r['profiles'] for r in D['velocity'])==5804==I['correlation_profiles']
assert I['correlation_inclusion']=='Profiles with more than 10 deleted reviews'
assert D['summary']['source_rows']==11 and D['summary']['constructed_rows']==6
for row in D['bounds']:
 assert row['record_type'].startswith('constructed_')
 N=row['original_reviews'];removed=row['deleted_reviews'];five=row['deleted_five_star']
 assert Fraction(five,removed)==Fraction(467,500)
 possibilities=[Fraction(five+kept,N) for kept in range(N-removed+1)]
 assert math.isclose(float(min(possibilities))*100,row['original_five_star_share_min_percent'],abs_tol=1e-10)
 assert math.isclose(float(max(possibilities))*100,row['original_five_star_share_max_percent'],abs_tol=1e-10)
for row in D['examples']:
 assert row['record_type'].startswith('synthetic_')
 assert row['deleted_five_star']+row['deleted_other_stars']==row['deleted_reviews']==500
 assert row['surviving_five_star']+row['surviving_other_stars']==row['surviving_reviews']==1500
 assert row['original_five_star']==row['deleted_five_star']+row['surviving_five_star']
 assert math.isclose(100*row['original_five_star']/2000,row['original_five_star_share_percent'])
assert math.isclose(D['examples'][1]['original_five_star_share_percent']-D['examples'][0]['original_five_star_share_percent'],47.5)
for filename,key in [('google-risk-velocity.csv','velocity'),('google-risk-quintiles.csv','quintiles'),('google-risk-bounds.csv','bounds'),('google-risk-examples.csv','examples')]:
 with (ROOT/filename).open(encoding='utf-8',newline='') as f:rows=list(csv.DictReader(f))
 assert len(rows)==len(D[key])
 for actual,expected in zip(rows,D[key]):
  assert actual=={k:'' if v is None else str(v) for k,v in expected.items()}
 meta=json.loads((ROOT/(filename+'-metadata.json')).read_text(encoding='utf-8'))
 assert [c['name'] for c in meta['tableSchema']['columns']]==list(D[key][0])
 assert all(c['dc:description'] for c in meta['tableSchema']['columns'])
capture=ROOT.parents[1]/'.seo-private/risk-study'
if (capture/'localo-body.txt').exists():
 body=(capture/'localo-body.txt').read_text(encoding='utf-8')
 assert hashlib.sha256(body.encode()).hexdigest()==I['capture_sha256']
 tables=json.loads((capture/'localo-tables.json').read_text(encoding='utf-8'))
 source=next(t for t in tables if t[0][0]=='Max reviews/week')
 assert len(source[1:])==7
 for actual,expected in zip(source[1:],I['velocity_rows']):
  parsed=[actual[0],int(actual[1].replace(',','')),int(actual[2].split()[0]),int(actual[3]),float(actual[4].rstrip('%'))]
  assert parsed==expected
 quintile_table=next(t for t in tables if t[0][0]=='Factor')
 assert len(quintile_table[1:])==4
 for actual,expected in zip(quintile_table[1:],I['quintile_rows']):assert [float(x.rstrip('%')) for x in actual[1:3]]==expected[2:4]
 assert 'share of each profile' in body and 'not its full review base' in body
print('PASS: 11 source rows, six constructed models, exact feasible bounds, integer examples, four CSVs and local source provenance when available.')
