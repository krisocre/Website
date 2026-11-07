"""Read-only independent numeric checks for the ranking data release.

Uses cached public aggregate sources fetched by build-google-ranking.py.
Does not import that builder, modify data, contact customers or submit forms.
"""
from pathlib import Path
from decimal import Decimal
import csv
import hashlib
import json

HERE=Path(__file__).resolve().parent
CACHE=HERE.parents[1]/'.seo-private/google-review-evidence-study-2026-11-07'
release=json.loads((HERE/'google-review-ranking-study.json').read_text())
source={}
for item in release['source']['files']:
    name=item['url'].rsplit('/',1)[1]
    content=(CACHE/('source-'+name)).read_bytes()
    assert hashlib.sha256(content).hexdigest()==item['sha256']
    source[name]=json.loads(content,parse_float=Decimal)
rating=source['listings_by_rating.json']; appearances=source['curve_rank_by_rating.json']
listing=source['listings.json']
assert rating['snapshot']==listing['snapshot']=='2026-10-18'
assert rating['review_source']=='listing' and appearances['unit']=='appearance'

def verify(rows):
    for row in rows:
        src=next(x for x in rating['cells'] if x['category']==row['category'] and x['rating_band']==row['rating_band'])
        assert not src['suppressed'] and src['n']==row['listings']>=10
        for tier in ['top3','top10','top20','not_seen']:
            value=src['metrics']['share_'+tier]['value']*src['n']
            assert abs(value-Decimal(row[tier+'_count']))<Decimal('.00001')
            percent=Decimal(row[tier+'_count'])/src['n']*100
            assert abs(percent-Decimal(str(row[tier+'_percent'])))<Decimal('.0000000051')
        assert sum(row[t+'_count'] for t in ['top3','top10','top20','not_seen'])==row['listings']

verify(release['rating_bands']);verify(release['high_rating_categories'])
assert sum(r['listings'] for r in release['rating_bands'])==1571
assert sum(r['listings'] for r in release['high_rating_categories'])==852
assert sum(r['not_seen_count'] for r in release['high_rating_categories'])==538
assert len({r['category'] for r in release['high_rating_categories']})==9
for tier,expected in [('top3',128),('top10',211),('top20',196),('not_seen',1036)]:
    assert sum(r[tier+'_count'] for r in release['rating_bands'])==expected
    original=next(c for c in listing['cells'] if c['category']==c['metro']=='all' and c['tier']==tier)
    assert original['n']==expected
for row in release['frame_comparison']:
    src=next(r for r in appearances['rows'] if r['rating_band']==row['rating_band'])
    assert not src['suppressed'] and src['n']==row['appearance_frame_n']>=10
    original=src['share_rank_1-3']*src['n']
    assert abs(original-Decimal(row['appearance_rank1_3_count']))<Decimal('.00001')
    pct=100*Decimal(row['appearance_rank1_3_count'])/row['appearance_frame_n']
    assert abs(pct-Decimal(str(row['appearance_rank1_3_percent'])))<Decimal('.0000000051')
    r=next(r for r in release['rating_bands'] if r['rating_band']==row['rating_band'])
    assert row['listing_frame_n']==r['listings'] and row['listing_best_top3_count']==r['top3_count']
    assert row['appearance_median_rank']==src['median_rank']
assert sum(r['appearance_frame_n'] for r in release['frame_comparison'])==2025
summary=release['summary']
for key,value in [('listings',1571),('high_rating_listings',852),('high_rating_not_seen',538),
                  ('high_rating_top3',89),('high_rating_appearance_n',1214),
                  ('high_rating_appearance_top3',232),('appearance_total',2025)]:
    assert summary[key]==value
mapping=['rating_bands','high_rating_categories','frame_comparison','frame_audit']
for file,key in zip(release['distributions'],mapping):
    content=(HERE/file['file']).read_bytes()
    assert hashlib.sha256(content).hexdigest()==file['sha256']
    rows=list(csv.DictReader(content.decode().splitlines()))
    assert len(rows)==len(release[key])==file['rows']
    for a,b in zip(rows,release[key]):assert a=={k:str(v) for k,v in b.items()}
assert sum(f['rows'] for f in release['distributions'])==27
assert len(list(csv.DictReader((HERE/'google-ranking-observation-template.csv').open())))==0
print('PASS: independent Decimal checks against three pinned source cubes; all rating/category counts, frame comparisons, separate tier totals, CSV/JSON hashes and blank template verified. No suppressed cells reconstructed.')
