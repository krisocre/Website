"""Reproduce reversal breakdown from the source extraction. Requires Matplotlib.
Original figure: ReviewRemoval, CC BY 4.0. Underlying counts: Trustpilot DSA report.
"""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parent
data = json.loads((root / 'trustpilot-appeals-2025.json').read_text(encoding='utf-8'))
output = root.parent / 'assets'
# A downloaded script beside the JSON also works outside the website tree.
if not output.is_dir():
    output = root
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'svg.fonttype':'none'})
categories = ['notice_no_action','content_restriction','service_restriction','unallocated_residual']
labels = ['No action on an Article 16 notice','Content removal / access / visibility','Service suspension / termination','Unallocated to reason rows (derived)']
counts = [next(r['reversed'] for r in data['rows'] if r['category']==c) for c in categories]
total = next(r['reversed'] for r in data['rows'] if r['category']=='all_complaints')
assert sum(counts)==total
fig, ax = plt.subplots(figsize=(12,7.2), dpi=100)
fig.patch.set_facecolor('#f7f3ec')
fig.subplots_adjust(left=.38,right=.93,top=.71,bottom=.27)
fig.text(.07,.94,'TRUSTPILOT / INTERNAL COMPLAINTS / 2025 REPORTING WINDOW',fontsize=11,color='#61736e')
fig.text(.07,.87,'What were the 890 reversed decisions about?',fontsize=23,color='#17353e',weight='bold')
fig.text(.07,.8,'816 of 890 (91.69%) challenged a decision not to act on a notice.',fontsize=14,color='#a75236')
ax.barh(range(4),counts,color=['#a75236','#17353e','#52786d','#a7a79b'],height=.55)
for i,count in enumerate(counts):
    ax.text(count+12,i,f'{count:,}  ({count/total*100:.2f}%)',va='center',fontsize=12,color='#17353e',weight='bold')
ax.set_yticks(range(4),labels)
ax.invert_yaxis()
ax.set_xlim(0,1020)
ax.set_xticks([0,200,400,600,800])
ax.set_xlabel('Reversed decisions (counts)',labelpad=12)
ax.set_facecolor('#f7f3ec')
ax.grid(axis='x',alpha=.15)
ax.set_axisbelow(True)
for side in ['top','right','left']:
    ax.spines[side].set_visible(False)
ax.tick_params(axis='y',length=0,pad=13)
fig.text(.07,.135,'Period: 17 February–31 December 2025. Scope: reviews involving EU users or EU businesses.',fontsize=10,color='#61736e')
fig.text(.07,.095,'Account and monetisation restrictions, and trusted-flagger no-action notices: zero reported reversals.',fontsize=9,color='#61736e')
fig.text(.07,.055,'Source: Trustpilot DSA report, published 28 February 2026. Original analysis: ReviewRemoval, 6 October 2026 / CC BY 4.0.',fontsize=9,color='#61736e')
for extension in ['svg','png']:
    fig.savefig(output / ('trustpilot-appeals-2025.'+extension),dpi=100,metadata={'Creator':'ReviewRemoval'} if extension=='svg' else {'Software':'ReviewRemoval / Matplotlib'})
plt.close(fig)
