"""Reproduce ReviewRemoval's three rating-sensitivity figures (CC BY 4.0).
Requires Matplotlib. Inputs are mathematical scenarios, not observed businesses.
"""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
from matplotlib.patches import Patch

root = Path(__file__).resolve().parent
D = json.loads((root / 'rating-removal-sensitivity-2026.json').read_text(encoding='utf-8'))
out = root.parent / 'assets'
if not out.is_dir():
    out = root
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'svg.fonttype':'none','svg.hashsalt':'reviewremoval-rating-v1'})
ink, accent, muted, bg = '#17353e', '#b56142', '#61736e', '#f7f3ec'

def frame(title, subtitle):
    fig, ax = plt.subplots(figsize=(12,6.72),dpi=100)
    fig.patch.set_facecolor(bg)
    ax.set_facecolor(bg)
    fig.text(.07,.945,'REVIEWREMOVAL / ORIGINAL MATHEMATICAL ANALYSIS',fontsize=10,color=accent)
    fig.text(.07,.872,title,fontsize=23,color=ink,weight='bold')
    fig.text(.07,.813,subtitle,fontsize=12,color=muted)
    fig.text(.07,.072,'Assumes equally weighted whole-star ratings and nearest-tenth, half-up rounding; Google does not confirm the tie rule.',fontsize=9,color=muted)
    fig.text(.07,.032,'Calculated scenarios, not observed outcomes. ReviewRemoval, 8 October 2026 / CC BY 4.0. Download data and methods in the article.',fontsize=9,color=muted)
    return fig, ax

def save(fig, name):
    for ext in ['svg','png']:
        target=out / f'{name}.{ext}'
        fig.savefig(target,dpi=100,metadata={'Creator':'ReviewRemoval','Date':None} if ext=='svg' else {'Software':'ReviewRemoval / Matplotlib'})
        if ext=='svg':
            target.write_text('\n'.join(line.rstrip() for line in target.read_text(encoding='utf-8').splitlines())+'\n',encoding='utf-8')
    plt.close(fig)

counts = [20,25,50,100,200,500,1000]
rows = [next(r for r in D['rows'] if r['reviews']==n and r['displayed_rating']==4.4 and r['one_star_removals']==1) for n in counts]
fig, ax = frame('Same displayed 4.4. Different possible results.','Range of attainable averages after one 1-star review is removed; review count changes the size of the effect.')
fig.subplots_adjust(left=.18,right=.87,top=.72,bottom=.21)
for i,r in enumerate(rows):
    ax.plot([r['min_average_after'],r['max_average_after']],[i,i],color=ink,linewidth=6,solid_capstyle='round')
    ax.plot([r['min_average_after'],r['max_average_after']],[i,i],'o',color=accent,markersize=6)
    lo,hi=r['min_display_after'],r['max_display_after']
    label=f'{lo:.1f}' if lo==hi else f'{lo:.1f}–{hi:.1f}'
    ax.text(4.63,i,f'display {label}',va='center',fontsize=10,color=ink)
ax.set_yticks(range(len(counts)),[f'{n:,} reviews' for n in counts])
ax.invert_yaxis()
ax.set_xlim(4.34,4.73)
ax.set_xticks([4.35,4.40,4.45,4.50,4.55,4.60])
ax.set_xlabel('Attainable average after removal (before display rounding)',color=ink,labelpad=10)
for boundary in [4.35,4.45,4.55]:
    ax.axvline(boundary,linestyle='--',color=muted,alpha=.45)
ax.grid(axis='x',alpha=.1)
for spine in ax.spines.values():
    spine.set_visible(False)
save(fig,'rating-removal-uncertainty')

fig, ax = frame('When does a displayed 4.4 move upward?','All = every feasible star total moves up. Some = only part of the feasible range moves up. Neither means a probability.')
fig.subplots_adjust(left=.12,right=.97,top=.70,bottom=.30)
matrix=[]
for k in D['grid']['one_star_removals']:
    row=[]
    for n in D['grid']['review_counts']:
        r=next(r for r in D['rows'] if r['reviews']==n and r['displayed_rating']==4.4 and r['one_star_removals']==k)
        row.append({'infeasible':0,'some':1,'all':2,'none':3}[r['higher_display']])
    matrix.append(row)
ax.imshow(matrix,cmap=ListedColormap(['#d8ddd5','#cf987f',ink,'#edf1ed']),vmin=0,vmax=3,aspect='auto')
for i,row in enumerate(matrix):
    for j,value in enumerate(row):
        ax.text(j,i,['—','Some','All','None'][value],ha='center',va='center',fontsize=9,color='white' if value==2 else ink)
ax.set_xticks(range(13),[f'{n:,}' for n in D['grid']['review_counts']],fontsize=10)
ax.set_yticks(range(5),[f'{k} removed' for k in D['grid']['one_star_removals']])
ax.set_xlabel('Starting review count',labelpad=12,color=ink)
ax.tick_params(length=0,pad=10)
for spine in ax.spines.values():
    spine.set_visible(False)
fig.legend(handles=[Patch(facecolor=ink,label='All feasible totals'),Patch(facecolor='#cf987f',label='Some feasible totals'),Patch(facecolor='#d8ddd5',label='Infeasible inputs')],loc='lower center',bbox_to_anchor=(.5,.13),ncol=3,frameon=False,fontsize=10)
save(fig,'rating-removal-threshold-map')

fig, ax = frame('A rounded 4.4 leaves a wide recovery range','New genuine 5-star ratings needed for an unrounded 4.5 average, using every attainable starting total.')
fig.text(.07,.757,'Dark bar: smallest feasible number. Pale extension: up to the largest feasible number.',fontsize=10,color=muted)
fig.subplots_adjust(left=.18,right=.90,top=.72,bottom=.21)
for i,r in enumerate(rows):
    n=r['reviews']
    # ceil((4.5*n - S)/(5 - 4.5)) = 9*n - 2*S.
    low=max(0,9*n-2*r['max_star_total'])
    high=max(0,9*n-2*r['min_star_total'])
    ax.barh(i,high,color='#e0d8cc',height=.55)
    ax.barh(i,low,color=ink,height=.55)
    ax.text(high+5,i,f'{low:,}–{high:,}',va='center',fontsize=11,color=ink,weight='bold')
ax.set_yticks(range(len(counts)),[f'{n:,} reviews' for n in counts])
ax.invert_yaxis()
ax.set_xlim(0,355)
ax.set_xlabel('Additional 5-star ratings; all existing ratings remain',color=ink,labelpad=10)
ax.grid(axis='x',alpha=.15)
ax.set_axisbelow(True)
for spine in ax.spines.values():
    spine.set_visible(False)
save(fig,'rating-recovery-range')
print('Built three reproducible SVG and 1200×672 PNG figures')
