"""Build static, reproducible charts from the public aggregate JSON."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import PercentFormatter

ROOT = Path(__file__).resolve().parent
D = json.loads((ROOT / 'blog/data/google-text-coverage-study.json').read_text())
OUT = ROOT / 'blog/assets'
INK, TEAL, RUST, MUTED, CREAM = '#17353e', '#356c64', '#a94e32', '#596d69', '#f7f3ec'
plt.rcParams.update({'font.family': 'sans-serif', 'font.sans-serif': ['Arial', 'DejaVu Sans'], 'text.color': INK,
                     'axes.labelcolor': INK, 'xtick.color': MUTED, 'ytick.color': INK,
                     'svg.fonttype': 'none', 'svg.hashsalt': 'rr-text-coverage-v1'})


def chart(name, mobile=False):
    fig = plt.figure(figsize=(6.3, 8.5) if mobile else (12, 7.8), dpi=100, facecolor=CREAM)
    x = .08 if mobile else .07
    fig.text(x, .95, 'REVIEWREMOVAL  /  ORIGINAL DATA ANALYSIS', fontsize=10 if mobile else 11,
             weight='bold', color=RUST)
    title = {
        'ratings': 'Which ratings lack\nstored review text?' if mobile else 'Which ratings lack stored review text?',
        'frames': 'A text-only filter changes\nthe one-star share' if mobile else 'A text-only filter changes the one-star share',
        'places': 'The pooled average hides\nopposite directions' if mobile else 'The pooled average hides opposite directions',
    }[name]
    fig.text(x, .89, title, fontsize=22 if mobile else 27, weight='bold', va='top', linespacing=1.3)
    sub = {
        'ratings': 'Share without nonblank stored text within each star rating',
        'frames': 'One-star records / all records in each named group',
        'places': 'Text-only mean versus all-record mean, within each place',
    }[name]
    if mobile:
        sub = sub.replace(' within ', '\nwithin ').replace('versus all-record mean, ', 'versus all-record mean,\n')
    fig.text(x, .78 if mobile else .80, sub, fontsize=12 if mobile else 14, color=MUTED, va='top')
    ax = fig.add_axes([.23 if mobile else .20, .28, .57 if mobile else .64, .38 if mobile else .42])
    ax.set_facecolor(CREAM)
    if name == 'ratings':
        values = [r['without_text_pct'] for r in D['coverage']]
        labels = [f"{r['rating']} star" + ('s' if r['rating'] > 1 else '') for r in D['coverage']]
        detail = [f"{r['without_text']:,} / {r['total']:,}" for r in D['coverage']]
        colors = [RUST, TEAL, TEAL, TEAL, TEAL]
        maximum = 100
        ticks = [0, 25, 50, 75, 100]
    elif name == 'frames':
        values = [r['one_star_pct'] for r in D['frames']]
        labels = ['All records', 'Text only', 'No stored text']
        detail = [f"{r['one_star_count']:,} / {r['records']:,}" for r in D['frames']]
        colors = [TEAL, RUST, '#7f9288']
        maximum, ticks = 6, [0, 2, 4, 6]
    else:
        rows = D['shifts'][:3]
        values = [r['share_of_places_pct'] for r in rows]
        labels = ['Higher mean', 'Equal mean', 'Lower mean']
        detail = [f"{r['place_count']:,} of {D['places']:,} places" for r in rows]
        colors = [TEAL, '#87968e', RUST]
        maximum, ticks = 100, [0, 25, 50, 75, 100]
    ax.barh(range(len(values)), values, height=.48, color=colors, zorder=3)
    for i, (v, label) in enumerate(zip(values, detail)):
        ax.text(v + maximum * .025, i - .04, f'{v:.2f}%' if name == 'frames' else f'{v:.1f}%',
                fontsize=15 if mobile else 16, weight='bold', va='center')
        # Denominators sit below each bar rather than competing with its value.
        ax.text(0, i + .42, label, fontsize=11, color=MUTED, va='center')
    ax.set_yticks(range(len(labels)), labels, fontsize=12 if mobile else 13)
    ax.set_ylim(len(values) - .35, -.65)
    ax.set_xlim(0, maximum)
    ax.set_xticks(ticks)
    ax.xaxis.set_major_formatter(PercentFormatter(100, decimals=0))
    ax.tick_params(axis='both', length=0, pad=9)
    ax.grid(axis='x', color='#dce1d9', zorder=0)
    for spine in ax.spines.values():
        spine.set_visible(False)
    note = {
        'ratings': '223,154 of 516,281 cleaned records have no nonblank stored text.',
        'frames': '+1.03 percentage points; +27.6% relative one-star share.\nThis is a filter comparison, not a change in removal outcomes.',
        'places': 'Pooled means: 4.2842 (all) and 4.2890 (text only).\nPlace-level directions differ despite the similar pooled means.',
    }[name]
    if mobile:
        note = note.replace('cleaned records have ', 'cleaned records\nhave ').replace('relative one-star', 'relative\none-star').replace('despite the similar', 'despite\nthe similar')
    fig.text(x, .21 if mobile else .18, note, fontsize=10 if mobile else 13, va='top', linespacing=1.6)
    foot = ('Source: UCSD Google Local Data (2021), Alaska 10-core.\nHistorical US subset; not Canadian prevalence or removal odds.\nReviewRemoval analysis, 13 November 2026.' if mobile else
            'Source: UCSD Google Local Data (2021), Alaska 10-core. Historical US subset; not Canadian prevalence or removal odds.\nReviewRemoval aggregate analysis, 13 November 2026. Null text does not prove an originally wordless rating.')
    fig.text(x, .065 if mobile else .075, foot, fontsize=8 if mobile else 9, color=MUTED, linespacing=1.5)
    base = OUT / ('google-text-coverage-' + name + ('-mobile' if mobile else ''))
    fig.savefig(str(base) + '.svg', metadata={'Date': None, 'Creator': 'ReviewRemoval / Matplotlib'})
    fig.savefig(str(base) + '.png', dpi=100)
    plt.close(fig)


for chart_name in ['ratings', 'frames', 'places']:
    for mobile in [False, True]:
        chart(chart_name, mobile)

fig = plt.figure(figsize=(12, 6.3), dpi=100, facecolor=INK)
fig.text(.07, .86, 'REVIEWREMOVAL  /  RESEARCH NOTE  /  NOVEMBER 2026', color='#eab49b', fontsize=14, weight='bold')
fig.text(.07, .67, 'The text-only export gap', color='white', fontsize=40, weight='bold')
fig.text(.07, .39, '43.2%', color='#eab49b', fontsize=94, weight='bold')
fig.text(.53, .49, 'of cleaned archive records\nhad no nonblank stored text', color='white', fontsize=24, linespacing=1.5, va='center')
fig.text(.07, .14, '516,281 records  /  Alaska 10-core archive  /  Historical US data\nA new aggregate analysis; not Canadian prevalence or Google removal odds.', color='#c9dad3', fontsize=13, linespacing=1.7)
fig.savefig(OUT / 'google-text-coverage-cover.png', dpi=100)
plt.close(fig)
print('Built 3 charts in desktop/mobile SVG + PNG, and a 1200 x 630 sharing image.')
