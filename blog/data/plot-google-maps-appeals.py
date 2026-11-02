"""Three deterministic, original SVG/PNG figures; Matplotlib is a local build tool only."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import PercentFormatter

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / 'assets'
D = json.loads((ROOT / 'google-maps-appeals-study.json').read_text(encoding='utf-8'))
INK, RUST, GREEN, GRID = '#17353e', '#a94e31', '#357461', '#d7dfd9'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 11, 'text.color': INK,
                     'axes.labelcolor': INK, 'xtick.color': INK, 'ytick.color': INK,
                     'svg.fonttype': 'path', 'svg.hashsalt': 'reviewremoval-maps-appeals-v1'})
ORDER = ['overall', 'content_restriction', 'service_restriction', 'article16_nonaction']
LABELS = ['All internal complaints', 'Content restriction challenged', 'Service restriction challenged', 'Article 16 non-action challenged']
PERIODS = ['2025H2', '2026H1']
PERIOD_LABEL = {'2025H2': 'Jul–Dec 2025', '2026H1': 'Jan–Jun 2026'}

def row(period, group):
    return next(r for r in D['categories'] if r['source_id'] == period and r['group'] == group)

def start(title, subtitle):
    fig, ax = plt.subplots(figsize=(12, 7.8), dpi=100)
    fig.patch.set_facecolor('#f7f3ec'); ax.set_facecolor('#f7f3ec')
    fig.subplots_adjust(left=.28, right=.94, top=.76, bottom=.22)
    fig.text(.055, .952, 'REVIEWREMOVAL  /  ORIGINAL SOURCE AUDIT', size=10, weight='bold', color=RUST)
    fig.text(.055, .895, title, size=23, weight='bold', color=INK)
    fig.text(.055, .842, subtitle, size=11, color=INK)
    ax.spines[['top', 'right', 'left']].set_visible(False)
    ax.spines['bottom'].set_color(GRID)
    ax.grid(axis='x', color=GRID, linewidth=.7); ax.set_axisbelow(True)
    ax.tick_params(axis='y', length=0, pad=12)
    return fig, ax

def finish(fig, ax, name, note):
    ax.legend(loc='lower left', bbox_to_anchor=(0, 1.02), ncol=2, frameon=False, fontsize=10, borderaxespad=0)
    fig.text(.055, .12, note, size=10, linespacing=1.6, color=INK)
    fig.text(.055, .045, 'Source: Google Maps DSA ZIPs published Feb/Aug 2026 · Calculations: ReviewRemoval · CC BY 4.0', size=9, color=INK)
    for ext in ['svg', 'png']:
        metadata = {'Date': D['published'], 'Creator': 'ReviewRemoval'} if ext == 'svg' else {'Software': 'ReviewRemoval / Matplotlib'}
        fig.savefig(OUT / (name + '.' + ext), dpi=100, metadata=metadata)
    plt.close(fig)

fig, ax = start('One appeal label, different decisions', 'EU-focused Maps data; all content types. Descriptive reversal shares, not Canadian review-removal odds.')
for period, offset, color in [('2025H2', -.18, INK), ('2026H1', .18, RUST)]:
    ys = [i + offset for i in range(4)]
    values = [row(period, key)['reversal_share_among_upheld_and_reversed_percent'] for key in ORDER]
    ax.barh(ys, values, height=.31, color=color, label=PERIOD_LABEL[period])
    for y, value in zip(ys, values):
        ax.text(value + .8, y, f'{value:.1f}%', va='center', size=11)
ax.set_yticks(range(4), LABELS); ax.invert_yaxis(); ax.set_xlim(0, 73)
ax.xaxis.set_major_formatter(PercentFormatter()); ax.set_xlabel('Reversed ÷ (upheld + fully reversed outcomes) × 100')
finish(fig, ax, 'google-maps-appeals-direction', 'Omitted outcomes and unpublished partial reversals are outside this denominator.\nThe overall row overlaps its categories; these bars are not additive or matched-case probabilities.')

fig, ax = start('The non-action category is a small slice', 'Complaints challenging Article 16 non-action, divided by all internal complaints received in that report.')
fig.subplots_adjust(left=.19)
for i, period in enumerate(PERIODS):
    narrow, overall = row(period, 'article16_nonaction'), row(period, 'overall')
    value = narrow['share_of_overall_received_percent']
    ax.barh(i, value, height=.42, color=[INK, RUST][i], label=PERIOD_LABEL[period])
    ax.text(value+.025, i, f'{value:.2f}%\n{narrow["received_complaints"]:,} / {overall["received_complaints"]:,}', va='center', size=11)
ax.set_yticks(range(2), [PERIOD_LABEL[p] for p in PERIODS]); ax.invert_yaxis(); ax.set_xlim(0, 1.28)
ax.xaxis.set_major_formatter(PercentFormatter()); ax.set_xlabel('Share of overall complaint receipts (%)')
finish(fig, ax, 'google-maps-appeals-receipt-share', 'This graph uses receipts only. It does not divide reversals by newly submitted complaints.\nA complaint can concern Maps content other than a review; the reports do not identify Canadian businesses.')

fig, ax = start('Read the unit: these medians are hours', 'Published category medians for two six-month periods. They are not end-to-end Canadian review-removal times.')
for period, offset, color in [('2025H2', -.18, INK), ('2026H1', .18, RUST)]:
    ys = [i + offset for i in range(4)]
    values = [row(period, key)['reported_median_hours'] for key in ORDER]
    ax.barh(ys, values, height=.31, color=color, label=PERIOD_LABEL[period])
    for y, value in zip(ys, values):
        ax.text(value + .6, y, f'{value} h', va='center', size=11)
ax.set_yticks(range(4), LABELS); ax.invert_yaxis(); ax.set_xlim(0, 46); ax.set_xlabel('Published median time (hours)')
finish(fig, ax, 'google-maps-appeals-median-hours', 'Google’s qualitative CSV specifies hours. A median is not a deadline or a limit on the longest wait.\nPeriod-to-period differences do not establish a change in service quality or an individual case timeline.')
print('Generated three original 1200 × 780 SVG/PNG chart pairs.')
