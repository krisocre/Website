"""Reproduce ReviewRemoval's Google rating/text-coverage aggregates (stdlib only).

Download the Alaska 10-core gzip from the source URL below, then run:
python google-text-coverage-analysis.py --source review-Alaska_10.json.gz --output replication

Only aggregate outputs are written. No names, user/place IDs, comments or image URLs
are exported. The original source data are not redistributed or relicensed.
"""
import argparse
import collections
import csv
import gzip
import hashlib
import json
from pathlib import Path

SOURCE = "https://mcauleylab.ucsd.edu/public_datasets/gdrive/googlelocal/review-Alaska_10.json.gz"
SHA256 = "c2dba3acd27e8d2d661fe4ee9a58bb8f392172af7261a0e42b072f5dfc86de31"
DATE = "2026-11-13"


def aggregate(records):
    ratings = collections.Counter()
    photos = collections.Counter()
    places = {}
    for place, rating, text, photo in records:
        ratings[(rating, text)] += 1
        photos[(text, photo)] += 1
        p = places.setdefault(place, [0, 0, 0, 0])
        p[0] += 1
        p[1] += rating
        p[2] += text
        p[3] += rating * text
    coverage = []
    for star in range(1, 6):
        with_text = ratings[(star, True)]
        without = ratings[(star, False)]
        coverage.append(dict(rating=star, with_text=with_text, without_text=without,
                             total=with_text + without,
                             without_text_pct=100 * without / (with_text + without)))
    frames = []
    for frame, selected in [('all_records', (True, False)), ('text_only', (True,)),
                            ('no_stored_text', (False,))]:
        n = sum(ratings[(s, t)] for s in range(1, 6) for t in selected)
        points = sum(s * ratings[(s, t)] for s in range(1, 6) for t in selected)
        one = sum(ratings[(1, t)] for t in selected)
        frames.append(dict(frame=frame, records=n, star_points=points, mean_rating=points / n,
                           one_star_count=one, one_star_pct=100 * one / n))
    # Exact integer products distinguish equal means; no floating-point tie rule.
    shifts = collections.Counter()
    threshold = 0
    for n, points, nt, pt in places.values():
        if not nt:
            shifts['no_text_records'] += 1
            continue
        delta_numerator = pt * n - points * nt
        shifts['higher' if delta_numerator > 0 else 'lower' if delta_numerator < 0 else 'equal'] += 1
        threshold += abs(delta_numerator) * 10 >= n * nt
    shift_rows = [dict(direction=d, place_count=shifts[d],
                       share_of_places_pct=100 * shifts[d] / len(places))
                  for d in ['higher', 'equal', 'lower', 'no_text_records']]
    photo_rows = [dict(stored_text='present' if t else 'absent',
                       photo_field='nonempty' if photo else 'empty', records=photos[(t, photo)])
                  for t in [True, False] for photo in [True, False]]
    return dict(records=sum(ratings.values()), places=len(places), coverage=coverage,
                frames=frames, shifts=shift_rows, photos=photo_rows,
                places_with_absolute_mean_shift_at_least_0_1=threshold)


def analyse(source):
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != SHA256:
        raise ValueError('Source SHA-256 does not match the pinned release; stop and investigate.')
    seen = {}
    ambiguous = set()
    raw = []
    text_types = collections.Counter()
    duplicate_occurrences = 0
    differing_occurrences = 0
    with gzip.open(source, 'rt', encoding='utf-8') as stream:
        for line in stream:
            r = json.loads(line)
            assert type(r['rating']) is int and 1 <= r['rating'] <= 5
            assert r.get('user_id') and r.get('gmap_id') and type(r.get('time')) is int
            assert r.get('text') is None or isinstance(r['text'], str)
            assert r.get('pics') is None or isinstance(r['pics'], list)
            text_types[type(r.get('text')).__name__] += 1
            text = isinstance(r.get('text'), str) and bool(r['text'].strip())
            minimal = (r['gmap_id'], r['rating'], text, bool(r.get('pics')))
            raw.append(minimal)
            key = (r['user_id'], r['gmap_id'], r['time'])
            fingerprint = hashlib.sha256(json.dumps(r, sort_keys=True, ensure_ascii=False,
                                                     separators=(',', ':')).encode()).digest()
            if key in seen:
                duplicate_occurrences += 1
                if seen[key][0] != fingerprint:
                    ambiguous.add(key)
                    differing_occurrences += 1
            else:
                seen[key] = (fingerprint, minimal)
    assert len(raw) == 521515, 'Unexpected source row count'
    clean = [value[1] for key, value in seen.items() if key not in ambiguous]
    result = aggregate(clean)
    raw_result = aggregate(raw)
    all_frame, text_frame, no_text_frame = result['frames']
    result.update(dict(
        title='Google rating text-coverage audit: Alaska 10-core archive',
        version='1.0.0', analysis_date=DATE,
        source=dict(url=SOURCE, page='https://mcauleylab.ucsd.edu/public_datasets/gdrive/googlelocal/',
                    sha256=SHA256, compressed_bytes=source.stat().st_size,
                    source_label='Google Local Data (2021), Alaska 10-core',
                    publisher='UC San Diego McAuley Lab', accessed=DATE,
                    scope='Historical United States archive; source collection up to September 2021'),
        cleaning=dict(source_rows=len(raw), distinct_user_place_time_keys=len(seen),
                      repeated_key_occurrences=duplicate_occurrences,
                      differing_repeated_occurrences=differing_occurrences,
                      ambiguous_keys_excluded=len(ambiguous),
                      text_value_types_in_source=dict(text_types),
                      rule='Keep one copy of identical user/place/time records. Exclude every key with differing JSON objects; compare canonical full JSON SHA-256, not just stars/text.'),
        findings=dict(no_text_pct=100 * no_text_frame['records'] / all_frame['records'],
                      one_star_share_change_pp=text_frame['one_star_pct'] - all_frame['one_star_pct'],
                      one_star_share_relative_change_pct=100 * (text_frame['one_star_pct'] / all_frame['one_star_pct'] - 1)),
        raw_sensitivity=dict(records=raw_result['records'], frames=raw_result['frames'],
                             no_text_pct=100 * raw_result['frames'][2]['records'] / raw_result['records']),
        method=dict(text='A nonempty Python string after str.strip(); null or blank is no nonblank stored text.',
                    mean='Sum of archived star values divided by included record count.',
                    one_star_share='One-star record count divided by all included records in the same frame.',
                    profile_direction='Compare text_star_points * all_count against all_star_points * text_count exactly.',
                    photo='Nonempty pics list; no files fetched, counted or inspected.',
                    weighting='Record-weighted pooled rating summaries; each distinct place contributes once to direction counts.'),
        limitations=[
            'The 10-core selects dense user/place histories, not a random or representative sample.',
            'US historical archive, not Canadian prevalence or current Google behaviour.',
            'Null stored text may reflect original absence or collection missingness; these cannot be separated.',
            'Place IDs describe archived places, not verified active business accounts.',
            'No removal decisions, authenticity labels, complete live profiles or causal effects are observed.',
            'No reviewer names, user/place IDs, text, image URLs or raw records are republished.'
        ],
        attribution='Original aggregate calculations: ReviewRemoval. Underlying Google Local Data (2021): Tianyang Zhang and Jiacheng Li, UCSD. Cite the two requested source papers alongside the dataset.',
        source_citations=[
            'https://aclanthology.org/2022.acl-long.426/',
            'https://arxiv.org/abs/2207.00422'
        ],
        rights='Original aggregate tables and figures may be cited with attribution and a link to the article. No licence to the underlying Google content is granted or implied.'
    ))
    return result


def write_outputs(result, output):
    output.mkdir(parents=True, exist_ok=True)
    distributions = []
    for name, key in [('ratings', 'coverage'), ('frames', 'frames'), ('places', 'shifts'), ('photos', 'photos')]:
        filename = f'google-text-coverage-{name}.csv'
        rows = result[key]
        with (output / filename).open('w', newline='', encoding='utf-8') as stream:
            writer = csv.DictWriter(stream, fieldnames=list(rows[0]), lineterminator='\n')
            writer.writeheader()
            writer.writerows(rows)
        distributions.append(dict(file=filename, rows=len(rows)))
    result['distributions'] = distributions
    (output / 'google-text-coverage-study.json').write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    data = analyse(args.source)
    write_outputs(data, args.output)
    print(json.dumps({k: data[k] for k in ['records', 'places', 'cleaning', 'findings', 'frames', 'shifts', 'photos']}, indent=2))
