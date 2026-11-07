"""Reproduce ReviewRemoval's aggregate rating/visibility audit (CC BY 4.0).

Standard-library Python only. --download fetches three checksum-pinned public
datanephew aggregate files into an ignored private cache. No business records,
accounts, review text, identifiers, scraping or customer integrations are used.
"""
from pathlib import Path
import argparse
import csv
import hashlib
import json
import math
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
CACHE = ROOT / '.seo-private/google-review-evidence-study-2026-11-07'
PAGE = 'https://reviewremoval.ca/blog/google-review-removal-local-ranking-study.html'
BASE = 'https://datanephew.com/data/gbp-study/v1.2/cubes/'
SOURCES = {
    'listings_by_rating.json': '9c4a6fffffec011566a5accc4f1b80739ea0a5ec637326dd373da24800b4234a',
    'curve_rank_by_rating.json': '3b18b6c14fc5301c99c8d32f2ba9abc75d32ecd7186b1c3838b23b26a809ed0a',
    'listings.json': '825c2321a26c5dbfe2c5f7f81141c5f6b1806c87965fcafaa252b280669fbc48',
}
BANDS = ['<4.0', '4.0-4.4', '4.5-4.7', '4.8-5.0', 'no rating']
TIERS = ['top3', 'top10', 'top20', 'not_seen']
LABELS = {'accountant':'Accountants', 'estate_attorney':'Estate-planning attorneys',
          'handyman':'Handymen', 'home_health':'Home health', 'house_cleaning':'House cleaners',
          'landscaper':'Landscapers', 'massage':'Massage', 'personal_trainer':'Personal trainers',
          'plumber':'Plumbers'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load(name, download):
    path = CACHE / ('source-' + name)
    if not path.exists():
        if not download:
            raise SystemExit('Missing cached source; run with --download: ' + name)
        content = urllib.request.urlopen(BASE + name, timeout=30).read()
        if sha(content) != SOURCES[name]:
            raise SystemExit('Public source changed; audit the new version first: ' + name)
        CACHE.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
    content = path.read_bytes()
    assert sha(content) == SOURCES[name], 'Source checksum mismatch: ' + name
    source = json.loads(content)
    assert source['version'] == 'v1.2'
    return source


def exact_count(n, share):
    """Recover a unique integer from a published share and known denominator."""
    value = n * share
    assert n >= 10 and 0 <= share <= 1 and math.isfinite(value)
    count = round(value)
    assert abs(value - count) < 0.00001, 'Published fraction does not identify an integer count'
    return count


def listing_row(cell):
    # Never reconstruct source-suppressed cells or their missing metrics.
    assert not cell['suppressed'] and cell['n'] >= 10
    row = {'category': cell['category'], 'rating_band': cell['rating_band'], 'listings': cell['n']}
    for tier in TIERS:
        metric = cell['metrics']['share_' + tier]
        assert not metric['suppressed'] and metric['n'] == cell['n']
        count = exact_count(cell['n'], metric['value'])
        row[tier + '_count'] = count
        row[tier + '_percent'] = round(100 * count / cell['n'], 8)
    assert sum(row[tier + '_count'] for tier in TIERS) == cell['n']
    row.update(source=BASE+'listings_by_rating.json', source_version='v1.2', snapshot='2026-10-18')
    return row


def build(download=False):
    rating = load('listings_by_rating.json', download)
    appearances = load('curve_rank_by_rating.json', download)
    listings = load('listings.json', download)
    all_cell = next(c for c in rating['cells'] if c['category'] == c['rating_band'] == 'all')
    all_row = listing_row(all_cell)
    assert all_row['listings'] == 1571
    pooled = [listing_row(next(c for c in rating['cells'] if c['category']=='all' and c['rating_band']==band)) for band in BANDS]
    assert sum(r['listings'] for r in pooled) == all_row['listings']
    for tier in TIERS:
        assert sum(r[tier+'_count'] for r in pooled) == all_row[tier+'_count']
        independent = next(c for c in listings['cells'] if c['category']==c['metro']=='all' and c['tier']==tier)
        assert independent['n'] == all_row[tier+'_count']
    categories = [listing_row(c) for c in rating['cells'] if c['category']!='all' and c['rating_band']=='4.8-5.0']
    assert len(categories) == 9 and set(r['category'] for r in categories) == set(LABELS)
    high = next(r for r in pooled if r['rating_band']=='4.8-5.0')
    assert sum(r['listings'] for r in categories) == high['listings']
    for tier in TIERS:
        assert sum(r[tier+'_count'] for r in categories) == high[tier+'_count']
    comparisons = []
    for band in BANDS:
        listing = next(r for r in pooled if r['rating_band']==band)
        observed = next(r for r in appearances['rows'] if r['rating_band']==band)
        assert not observed['suppressed']
        counts = [exact_count(observed['n'], observed[field]) for field in ('share_rank_1-3','share_rank_4-10','share_rank_11-20')]
        assert sum(counts) == observed['n']
        comparisons.append({'rating_band':band,
            'listing_frame_n':listing['listings'], 'listing_best_top3_count':listing['top3_count'],
            'listing_best_top3_percent':listing['top3_percent'],
            'appearance_frame_n':observed['n'], 'appearance_rank1_3_count':counts[0],
            'appearance_rank1_3_percent':round(100*counts[0]/observed['n'],8),
            'appearance_median_rank':observed['median_rank'],
            'listing_source':BASE+'listings_by_rating.json',
            'appearance_source':BASE+'curve_rank_by_rating.json',
            'comparison_note':'Different frames, units and rating sources; not paired effects or removal outcomes.'})
    frame_audit = [
        {'measure':'listing_frame', 'count':all_row['listings'], 'unit':'business listings', 'definition':'Matched visible plus not-seen enriched owner-operated listings; not all businesses in the six metros.'},
        {'measure':'listing_best_top3', 'count':all_row['top3_count'], 'unit':'business listings', 'definition':'Best observed rank 1-3 at any of eight search points for its market.'},
        {'measure':'listing_rank4_10', 'count':all_row['top10_count'], 'unit':'business listings', 'definition':'Best observed rank 4-10; excludes top3.'},
        {'measure':'listing_rank11_20', 'count':all_row['top20_count'], 'unit':'business listings', 'definition':'Best observed rank 11-20; excludes higher tiers.'},
        {'measure':'listing_not_seen', 'count':all_row['not_seen_count'], 'unit':'business listings', 'definition':'No top-20 result at the study search points in this one snapshot; not proof of general invisibility.'},
        {'measure':'appearance_frame', 'count':sum(r['appearance_frame_n'] for r in comparisons), 'unit':'business-by-search-point appearances', 'definition':'Visible results; businesses can recur; a different frame from listings.'},
        {'measure':'high_rating_listings', 'count':high['listings'], 'unit':'business listings', 'definition':'Listing rating 4.8-5.0 inclusive; this is not a perfect-5.0-only group.'},
        {'measure':'high_rating_not_seen', 'count':high['not_seen_count'], 'unit':'business listings', 'definition':'High-rating listings absent from sampled top-20 results.'},
    ]
    tables = {'google-ranking-rating-bands.csv':pooled,
              'google-ranking-high-rating-categories.csv':categories,
              'google-ranking-frame-comparison.csv':comparisons,
              'google-ranking-frame-audit.csv':frame_audit}
    for name,rows in tables.items():
        with (OUT/name).open('w',encoding='utf-8',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');writer.writeheader();writer.writerows(rows)
    report = {
        'title':'Google review removal and local ranking: rating-band and sampling-frame audit',
        'creator':'ReviewRemoval', 'version':'1.0.0', 'date':'2026-11-07', 'article':PAGE,
        'license':'https://creativecommons.org/licenses/by/4.0/',
        'source':{'creator':'datanephew', 'study':'https://datanephew.com/research/local-pack-study/',
                  'methods':'https://datanephew.com/research/local-pack-study/methods/',
                  'version':'v1.2', 'snapshot':'2026-10-18',
                  'geography':'Six US metros; no Canadian sample', 'license':'CC BY 4.0',
                  'files':[{'url':BASE+name,'sha256':digest} for name,digest in SOURCES.items()]},
        'method':{'count_recovery':'For unsuppressed cells with n >= 10, round(n * published_share); require integer residual < 0.00001 and tier totals equal n.',
                  'suppression':'Never reconstruct omitted source cells or publish business identities.',
                  'scope':'Descriptive aggregate reanalysis, not a new Maps crawl, experiment, forecast or causal estimate.',
                  'tiers':'top3=best 1-3; top10=best 4-10; top20=best 11-20; not_seen=no sampled top-20 appearance.',
                  'comparability':'Listings use the listing rating source; appearances use Maps-result ratings. Frames cannot be joined at business level from these aggregates.'},
        'summary':{'listings':1571, 'high_rating_listings':high['listings'],
                   'high_rating_not_seen':high['not_seen_count'], 'high_rating_not_seen_percent':high['not_seen_percent'],
                   'high_rating_top3':high['top3_count'], 'high_rating_top3_percent':high['top3_percent'],
                   'high_rating_appearance_n':next(r['appearance_frame_n'] for r in comparisons if r['rating_band']=='4.8-5.0'),
                   'high_rating_appearance_top3':next(r['appearance_rank1_3_count'] for r in comparisons if r['rating_band']=='4.8-5.0'),
                   'high_rating_appearance_top3_percent':next(r['appearance_rank1_3_percent'] for r in comparisons if r['rating_band']=='4.8-5.0'),
                   'high_rated_share_of_not_seen_percent':100*high['not_seen_count']/all_row['not_seen_count'],
                   'appearance_total':sum(r['appearance_frame_n'] for r in comparisons)},
        'rating_bands':pooled, 'high_rating_categories':categories, 'frame_comparison':comparisons, 'frame_audit':frame_audit,
        'limitations':['One snapshot, non-random six-US-metro sample; not a Canada-wide prevalence estimate.',
                       'No review removals, before/after rank changes, authenticity labels or customer outcomes measured.',
                       'Best rank across eight widely spaced search points is not a single-point rank or universal visibility.',
                       'Enrichment under-matches service-area businesses; original frame is selected.',
                       'Rating bands mix review counts, sectors, distances and business characteristics; no causal adjustment attempted.',
                       'Appearance and listing sources/frames differ; their percentages are not paired estimates.',
                       'No new confidence intervals, significance tests or independence assumptions added.'],
        'distributions':[{'file':name,'rows':len(rows),'sha256':sha((OUT/name).read_bytes())} for name,rows in tables.items()]}
    (OUT/'google-review-ranking-study.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report['summary']))
    return report


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download',action='store_true',help='Fetch pinned public aggregate inputs if absent.')
    build(parser.parse_args().download)
