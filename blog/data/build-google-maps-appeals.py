"""Reproduce the Google Maps appeals direction audit from attributed source cells.

Python standard library only. Run from any directory; writes alongside this file.
No source blanks are imputed and no case-level observations are manufactured.
"""
from pathlib import Path
from fractions import Fraction
import csv
import json

ROOT = Path(__file__).resolve().parent
SOURCE = json.loads((ROOT / 'google-maps-appeals-source-values.json').read_text(encoding='utf-8'))
LICENSE = 'https://creativecommons.org/licenses/by/4.0/'
GROUPS = {
    'overall': ('Number of complaints submitted to the internal-complaints mechanism', 'All internal complaints'),
    'content_restriction': ('Complaint regarding a decision to remove or disable access to or restrict visibility of information', 'Challenge to a content restriction'),
    'service_restriction': ('Complaint regarding a decision to suspend or terminate the provision of the service', 'Challenge to a service restriction'),
    'article16_nonaction': ('Complaint regarding a decision not to take action on a notice submitted in accordance with Article 16', 'Challenge to Article 16 non-action'),
}

def percent(numerator, denominator):
    return round(float(Fraction(numerator * 100, denominator)), 9)

categories = []
for source in SOURCE['sources']:
    rows = [r for r in SOURCE['source_indicators'] if r['source_id'] == source['id']]
    overall_received = next(r['value'] for r in rows if r['indicator'] == GROUPS['overall'][0] and r['scope'] == 'Total number')
    for key, (indicator, label) in GROUPS.items():
        selected = {r['scope']: r for r in rows if r['indicator'] == indicator}
        get = lambda scope: selected.get(scope, {}).get('value')
        received, upheld, reversed_count = get('Total number'), get('Decisions upheld'), get('Decisions reversed')
        denominator = upheld + reversed_count
        categories.append({
            'record_id': source['id'] + '-' + key,
            'record_type': 'source_counts_with_derived_descriptive_ratios',
            'source_id': source['id'], 'period_start': source['period_start'], 'period_end': source['period_end'],
            'group': key, 'label': label, 'received_complaints': received,
            'upheld_outcomes': upheld, 'reversed_outcomes': reversed_count,
            'partially_reversed_outcomes': get('Decisions partially reversed'),
            'omitted_outcomes': get('Decision omitted'),
            'upheld_plus_reversed_outcomes': denominator,
            'reversal_share_among_upheld_and_reversed_percent': percent(reversed_count, denominator),
            'reported_median_hours': get('Median time'),
            'share_of_overall_received_percent': percent(received, overall_received),
            'source_indicator': indicator,
            'source_csv_rows': ','.join(str(r['source_csv_row']) for r in selected.values()),
            'source_url': source['url'],
        })

contrasts = []
for source in SOURCE['sources']:
    overall = next(r for r in categories if r['source_id'] == source['id'] and r['group'] == 'overall')
    narrow = next(r for r in categories if r['source_id'] == source['id'] and r['group'] == 'article16_nonaction')
    contrasts.append({
        'source_id': source['id'], 'record_type': 'derived_difference_between_distinct_complaint_groups',
        'overall_reversal_share_percent': overall['reversal_share_among_upheld_and_reversed_percent'],
        'article16_nonaction_reversal_share_percent': narrow['reversal_share_among_upheld_and_reversed_percent'],
        'difference_percentage_points': round(overall['reversal_share_among_upheld_and_reversed_percent'] - narrow['reversal_share_among_upheld_and_reversed_percent'], 9),
        'interpretation': 'Descriptive category contrast, not a causal effect, individual removal chance or matched-case comparison.'
    })

limitations = [
    SOURCE['scope'], SOURCE['blank_policy'],
    'The denominator is upheld plus fully reversed outcomes, not submitted complaints. Omitted outcomes and unpublished partial reversals are not counted as either.',
    'Receipts and decisions need not refer to the same cases. Their difference is not a measured backlog, failure count or pending queue.',
    'All Maps content and service restrictions are in scope; the tables do not isolate Google reviews or businesses requesting removal.',
    'Article 16 is an EU reporting category. It is not identical to every Canadian Business Profile review appeal.',
    'Median times are hours, not days, and are not promises or end-to-end removal times for a Canadian business.',
    'Blank subgroup totals prevent a complete disjoint partition of overall complaints; categories must not be summed with the overall row.',
    'Different periods can reflect reporting or service changes. No causal, representative-sample or significance claim is made.',
    'This is a secondary compilation and descriptive analysis of Google disclosures, not independently observed review or ReviewRemoval client outcomes.'
]
D = {
    'title': SOURCE['title'], 'version': SOURCE['version'], 'published': SOURCE['published'],
    'article_url': SOURCE['article_url'], 'license': LICENSE, 'sources': SOURCE['sources'],
    'summary': {'source_indicator_cells': len(SOURCE['source_indicators']),
                'reported_numeric_cells': sum(r['value'] is not None for r in SOURCE['source_indicators']),
                'blank_cells_preserved': sum(r['value'] is None for r in SOURCE['source_indicators']),
                'category_summaries': len(categories), 'category_contrasts': len(contrasts),
                'individually_observed_reviews': 0},
    'source_indicators': SOURCE['source_indicators'], 'categories': categories,
    'contrasts': contrasts, 'limitations': limitations,
}
(ROOT / 'google-maps-appeals-study.json').write_text(json.dumps(D, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

definitions = {
    'value': 'Publisher-reported integer; a blank is null/empty, never an imputed zero.',
    'source_csv_row': 'One-based physical CSV record number including the header, in the named Google ZIP member.',
    'unit': 'Hours for Median time; counts for other indicators. Units verified against qualitative CSV row 18.',
    'received_complaints': 'Period receipts; not necessarily the same cohort as the period outcomes.',
    'upheld_plus_reversed_outcomes': 'Derived denominator: upheld outcomes plus fully reversed outcomes.',
    'reversal_share_among_upheld_and_reversed_percent': '100 * reversed / (upheld + reversed). Descriptive share of these two outcome classes; not a review-removal success probability.',
    'reported_median_hours': 'Published median processing time, in hours. No conversion to days or guarantee for an individual case.',
    'share_of_overall_received_percent': '100 * category receipts / overall receipts in the same report; overall summary must not be added to its categories.',
    'partially_reversed_outcomes': 'Blank in the source; preserved as null, not assumed zero.',
    'omitted_outcomes': 'Only published for the overall group. Missing subgroup fields remain null.',
    'difference_percentage_points': 'Overall descriptive reversal share minus Article 16 non-action share, using distinct reported groups.',
}
for filename, rows in [('google-maps-appeals-indicators.csv', D['source_indicators']),
                       ('google-maps-appeals-categories.csv', categories),
                       ('google-maps-appeals-contrasts.csv', contrasts)]:
    with (ROOT / filename).open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]), lineterminator='\n')
        writer.writeheader(); writer.writerows(rows)
    columns = []
    for key in rows[0]:
        numeric = [r[key] for r in rows if r[key] is not None]
        datatype = 'integer' if numeric and all(isinstance(v, int) for v in numeric) else 'number' if numeric and all(isinstance(v, (int, float)) for v in numeric) else 'string'
        columns.append({'name': key, 'datatype': datatype, 'null': [''], 'dc:description': definitions.get(key, key.replace('_', ' '))})
    metadata = {'@context': 'http://www.w3.org/ns/csvw', 'url': 'https://reviewremoval.ca/blog/data/' + filename,
                'dc:title': D['title'] + ' — ' + filename, 'dc:license': LICENSE,
                'tableSchema': {'columns': columns, 'primaryKey': 'record_id' if 'record_id' in rows[0] else 'source_id'}}
    (ROOT / (filename + '-metadata.json')).write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

(ROOT / 'google-maps-appeals-study.bib').write_text('''@misc{reviewremoval2026mapsappeals,
  author = {{ReviewRemoval}},
  title = {Google Maps Appeals Direction Audit, July 2025--June 2026},
  year = {2026},
  month = nov,
  version = {1.0.0},
  url = {https://reviewremoval.ca/blog/google-review-removal-appeals-data.html},
  note = {Original compilation and descriptive calculations; underlying indicators published by Google. EU-focused Maps data, not Canadian review-removal odds.}
}
''', encoding='utf-8')
(ROOT / 'google-maps-appeals-study.cff').write_text('''cff-version: 1.2.0
message: "Cite this compilation and Google as the publisher of the underlying indicators."
type: dataset
title: "Google Maps Appeals Direction Audit, July 2025–June 2026"
authors:
  - name: "ReviewRemoval"
version: 1.0.0
date-released: 2026-11-02
license: CC-BY-4.0
url: "https://reviewremoval.ca/blog/google-review-removal-appeals-data.html"
''', encoding='utf-8')
print(json.dumps(D['summary']))
