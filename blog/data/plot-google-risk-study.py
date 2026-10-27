from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
ROOT=Path(__file__).resolve().parent;OUT=ROOT.parent/'assets'
D=json.loads((ROOT/'google-risk-denominator-study.json').read_text(encoding='utf-8'))
plt.rcParams.update({'svg.fonttype':'none','svg.hashsalt':'reviewremoval-risk-1','font.family':'DejaVu Sans','font.size':12,'axes.spines.top':False,'axes.spines.right':False,'axes.spines.left':False})
INK='#17353e';ACCENT='#b65e40';GREEN='#77998b';PAPER='#faf8f2'
def start(title,subtitle):
 fig,ax=plt.subplots(figsize=(12,7.8),dpi=100);fig.patch.set_facecolor(PAPER);ax.set_facecolor(PAPER)
 fig.subplots_adjust(left=.19,right=.94,top=.76,bottom=.2)
 fig.text(.055,.93,title,color=INK,size=23,weight='bold');fig.text(.055,.865,subtitle,color=INK,size=12)
 ax.set_axisbelow(True);ax.grid(axis='x',color='#dfe5df',linewidth=.8)
 return fig,ax
def save(fig,name,note):
 fig.text(.055,.095,note,color=INK,size=10);fig.text(.055,.04,'ReviewRemoval · Original analysis and figures: CC BY 4.0 · Source aggregates: Localo (2026)',color='#526768',size=9)
 fig.savefig(OUT/(name+'.png'));fig.savefig(OUT/(name+'.svg'),metadata={'Date':'2026-10-27','Creator':'ReviewRemoval'})
 svg=OUT/(name+'.svg');text=svg.read_text(encoding='utf-8').replace("font-family: 'DejaVu Sans'","font-family: 'DejaVu Sans', Arial, sans-serif");svg.write_text('\n'.join(line.rstrip() for line in text.splitlines())+'\n',encoding='utf-8');plt.close(fig)
rows=D['velocity'];fig,ax=start('A percentage about the reviews that disappeared','Published five-star summaries use each profile’s deleted-review set, not its whole review base.')
y=np.arange(len(rows));vals=[r['five_star_deleted_share_percent'] for r in rows]
ax.barh(y,vals,color=INK,height=.62);ax.set_yticks(y,[r['velocity_label']+' / week' for r in rows]);ax.invert_yaxis();ax.set_xlim(0,105);ax.set_xlabel('Published five-star share of deleted-review set (%)')
for yy,value in zip(y,vals):ax.text(value+1,yy,f'{value:.1f}%',va='center',color=INK)
save(fig,'google-risk-deleted-share','Seven selected velocity rows. “Per week” is maximum observed rolling 7-day count; not an official threshold.')
rows=D['bounds'];fig,ax=start('One deleted-set share, many possible whole profiles','Constructed fixed-set model: 93.4% of deleted reviews are five-star; surviving stars are unknown.')
for i,r in enumerate(rows):
 lo=r['original_five_star_share_min_percent'];hi=r['original_five_star_share_max_percent']
 ax.plot([lo,hi],[i,i],color=GREEN,linewidth=14,solid_capstyle='round');ax.plot([lo,hi],[i,i],'o',color=INK,markersize=6)
 ax.text((lo+hi)/2,i-.17,f'{lo:.2f}%–{hi:.2f}%',ha='center',color=INK,size=11)
ax.set_yticks(range(4),[f"{r['deletion_fraction_percent']:g}% deleted" for r in rows]);ax.invert_yaxis();ax.set_xlim(0,103);ax.set_ylim(3.6,-.6);ax.set_xlabel('Possible five-star share of original 10,000-review set (%)')
save(fig,'google-risk-identification-bounds','Mathematical identification intervals, not confidence intervals, measured businesses or Google/client outcomes.')
rows=D['examples'];fig,ax=start('One deleted subset, two different original profiles','Constructed examples only: each starts with 2,000 reviews and loses 467 five-star + 33 other reviews.')
x=np.arange(2);w=.23
for offset,key,label,color in [(-w,'original_five_star_share_percent','Original full set',INK),(0,'deleted_five_star_share_percent','Deleted subset',ACCENT),(w,'surviving_five_star_share_percent','Still-visible subset',GREEN)]:
 values=[r[key] for r in rows];ax.bar(x+offset,values,width=w,color=color,label=label)
 for xx,v in zip(x+offset,values):ax.text(xx,v+1.4,f'{v:.2f}%',ha='center',size=10,color=INK)
ax.set_xticks(x,['Constructed profile A','Constructed profile B']);ax.set_ylim(0,112);ax.set_ylabel('Five-star share of the labelled population (%)');ax.grid(False)
handles,labels=ax.get_legend_handles_labels();fig.legend(handles,labels,loc='upper center',bbox_to_anchor=(.56,.815),ncol=3,frameon=False,fontsize=10)
save(fig,'google-risk-same-subset','The two original full-set shares differ by 47.5 percentage points. Neither profile was observed in the source data.')
print('Built three ReviewRemoval research figures, SVG plus 1200×780 PNG.')
