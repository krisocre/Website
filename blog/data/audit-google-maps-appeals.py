"""Independent numerical audit; optional official ZIP/CSV/XLSX cross-check.

Usage: python audit-google-maps-appeals.py [--fetch | --source-dir PATH]
No builder imports, no account data, and no archive extraction to the filesystem.
"""
from pathlib import Path, PurePosixPath
from fractions import Fraction
from decimal import Decimal
import argparse
import csv
import hashlib
import io
import json
import math
import posixpath
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--fetch', action='store_true')
parser.add_argument('--source-dir', type=Path)
args = parser.parse_args()
D = json.loads((ROOT / 'google-maps-appeals-study.json').read_text(encoding='utf-8'))
I = json.loads((ROOT / 'google-maps-appeals-source-values.json').read_text(encoding='utf-8'))
assert D['source_indicators'] == I['source_indicators']
assert D['summary'] == {'source_indicator_cells':74, 'reported_numeric_cells':36, 'blank_cells_preserved':38,
                         'category_summaries':8, 'category_contrasts':2, 'individually_observed_reviews':0}
assert len({r['record_id'] for r in D['source_indicators']}) == 74
assert sum(r['value'] is None for r in D['source_indicators']) == 38
assert all(r['value_status'] == ('blank_not_zero' if r['value'] is None else 'reported_integer') for r in D['source_indicators'])
assert all(r['unit'] == ('hours' if r['scope']=='Median time' else 'count') for r in D['source_indicators'])

# Independently transcribed checks: received, upheld, reversed, reported median hours.
expected = {
    ('2025H2','overall'):(1931210,702993,1145031,20),
    ('2025H2','content_restriction'):(1779358,624527,1073230,21),
    ('2025H2','service_restriction'):(123596,53318,69496,20),
    ('2025H2','article16_nonaction'):(11461,10163,573,8),
    ('2026H1','overall'):(1613771,688781,877807,19),
    ('2026H1','content_restriction'):(1465656,615042,805209,20),
    ('2026H1','service_restriction'):(110259,39510,69796,40),
    ('2026H1','article16_nonaction'):(14715,13381,626,15),
}
assert len(D['categories']) == len(expected)
for row in D['categories']:
    key=(row['source_id'],row['group'])
    assert (row['received_complaints'],row['upheld_outcomes'],row['reversed_outcomes'],row['reported_median_hours']) == expected[key]
    assert row['partially_reversed_outcomes'] is None
    denominator = row['upheld_outcomes'] + row['reversed_outcomes']
    assert row['upheld_plus_reversed_outcomes'] == denominator
    assert math.isclose(row['reversal_share_among_upheld_and_reversed_percent'],float(Fraction(row['reversed_outcomes']*100,denominator)),abs_tol=1e-8)
    total = expected[(row['source_id'],'overall')][0]
    assert math.isclose(row['share_of_overall_received_percent'],float(Fraction(row['received_complaints']*100,total)),abs_tol=1e-8)
    if row['group'] != 'overall': assert row['omitted_outcomes'] is None
for row in D['contrasts']:
    overall=expected[(row['source_id'],'overall')]
    narrow=expected[(row['source_id'],'article16_nonaction')]
    difference=100*(Fraction(overall[2],overall[1]+overall[2])-Fraction(narrow[2],narrow[1]+narrow[2]))
    assert math.isclose(row['difference_percentage_points'],float(difference),abs_tol=1e-8)

for filename, rows in [('google-maps-appeals-indicators.csv',D['source_indicators']),
                       ('google-maps-appeals-categories.csv',D['categories']),
                       ('google-maps-appeals-contrasts.csv',D['contrasts'])]:
    with (ROOT/filename).open(encoding='utf-8',newline='') as handle:
        parsed=list(csv.DictReader(handle))
    assert len(parsed)==len(rows)
    for actual, expected_row in zip(parsed,rows):
        assert actual == {key:'' if value is None else str(value) for key,value in expected_row.items()}
    metadata=json.loads((ROOT/(filename+'-metadata.json')).read_text(encoding='utf-8'))
    assert [column['name'] for column in metadata['tableSchema']['columns']] == list(rows[0])
    assert metadata['url'].endswith('/'+filename)
    assert all(column['null']==[''] for column in metadata['tableSchema']['columns'])

def worksheet_values(raw_zip):
    ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    relns='{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
    with zipfile.ZipFile(io.BytesIO(raw_zip)) as archive:
        name=next(n for n in archive.namelist() if n.endswith('.xlsx'))
        with zipfile.ZipFile(io.BytesIO(archive.read(name))) as book:
            workbook=ET.fromstring(book.read('xl/workbook.xml'))
            sheet=next(s for s in workbook.findall('s:sheets/s:sheet',ns) if s.attrib['name']=='7_appeals_and_recidivism')
            relationship=next(r for r in ET.fromstring(book.read('xl/_rels/workbook.xml.rels')) if r.attrib['Id']==sheet.attrib[relns])
            target=relationship.attrib['Target']
            member=target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join('xl',target))
            strings=[''.join(x.text or '' for x in node.findall('.//s:t',ns)) for node in ET.fromstring(book.read('xl/sharedStrings.xml')).findall('s:si',ns)]
            values={}
            for cell in ET.fromstring(book.read(member)).findall('s:sheetData/s:row/s:c',ns):
                value=cell.find('s:v',ns)
                if value is not None:
                    values[cell.attrib['r']]=strings[int(value.text)] if cell.attrib.get('t')=='s' else value.text
            return values

verified=0
for source in I['sources']:
    raw=None
    if args.fetch:
        request=urllib.request.Request(source['url'],headers={'User-Agent':'ReviewRemoval-public-research-audit/1.0'})
        raw=urllib.request.urlopen(request,timeout=45).read()
    elif args.source_dir:
        raw=(args.source_dir/(source['id']+'.zip')).read_bytes()
    if raw is None: continue
    assert hashlib.sha256(raw).hexdigest()==source['zip_sha256'], 'Source archive changed: '+source['id']
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        for member, fingerprint in source['member_sha256'].items():
            assert hashlib.sha256(archive.read(member)).hexdigest()==fingerprint
        rows=list(csv.DictReader(io.StringIO(archive.read(source['source_file']).decode('utf-8-sig'))))
        xlsx=worksheet_values(raw)
        for cell in I['source_indicators']:
            if cell['source_id']!=source['id']:continue
            index=cell['source_csv_row']; original=rows[index-2]
            assert original['Indicator']==cell['indicator'] and original['Scope']==cell['scope']
            value=original.get('Value') or ''
            assert (int(value) if value else None)==cell['value']
            assert xlsx['E'+str(index)]==cell['indicator'] and xlsx['F'+str(index)]==cell['scope']
            excel_value=xlsx.get('G'+str(index))
            assert (int(Decimal(excel_value)) if excel_value else None)==cell['value']
        notes=list(csv.DictReader(io.StringIO(archive.read('11_qualitative.csv').decode('utf-8-sig'))))
        assert 'all median times are reported in hours' in notes[16]['Value']
        assert 'some resolved complaints may have been received prior' in notes[13]['Value']
        identification=list(csv.DictReader(io.StringIO(archive.read('1_report_identification.csv').decode('utf-8-sig'))))
        assert identification[1]['Value']==source['report_published']
        assert identification[3]['Value']==source['period_start'] and identification[4]['Value']==source['period_end']
    verified+=1
print(f'PASS: 74 source cells, 38 preserved blanks, 8 summaries, 2 contrasts, three CSV/CSVW exports; {verified}/2 ZIP/CSV/XLSX source checks.')
