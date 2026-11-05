"""Original notice-timing figures from the checked release; Matplotlib required."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=Path(__file__).resolve().parent
ASSETS=ROOT.parent/'assets';ASSETS.mkdir(exist_ok=True)
D=json.loads((ROOT/'google-notice-timing-study.json').read_text(encoding='utf-8'))
NAVY='#19323a';GREEN='#396e61';COPPER='#a94e31';MUTED='#596b6d';LINE='#dde5e0'
plt.rcParams.update({'font.family':['DejaVu Sans','Arial','sans-serif'],'font.size':13,'svg.fonttype':'none','svg.hashsalt':'reviewremoval-notice-timing-v1','axes.spines.top':False,'axes.spines.right':False,'axes.spines.left':False,'axes.spines.bottom':False,'text.color':NAVY,'axes.labelcolor':NAVY,'xtick.color':MUTED,'ytick.color':NAVY})
def canvas(title,subtitle,left=.25):
 fig,ax=plt.subplots(figsize=(12,7.8),dpi=100);fig.subplots_adjust(left=left,right=.85,top=.76,bottom=.28)
 fig.text(.055,.94,'REVIEWREMOVAL  /  SOURCE DATA & METHODS',fontsize=10,color=GREEN,weight='bold')
 fig.text(.055,.87,title,fontsize=21,weight='bold');fig.text(.055,.815,subtitle,fontsize=12,color=MUTED)
 ax.tick_params(axis='both',length=0,pad=10)
 return fig,ax
def save(fig,name,note):
 fig.text(.055,.105,note,fontsize=10.5,color=MUTED,linespacing=1.55)
 fig.text(.055,.035,'ReviewRemoval compilation · Sources checked 5 Nov 2026 · CC BY 4.0',fontsize=10,color=MUTED)
 for ext in ['svg','png']:fig.savefig(ASSETS/(name+'.'+ext),facecolor='white',metadata={'Date':None} if ext=='svg' else None)
 plt.close(fig)

fig,ax=canvas('One overall median, different category clocks','Google Maps legal notices, Jan–Jun 2026 — selected published category medians',left=.29)
keys=['TOTAL','STATEMENT_CATEGORY_ILLEGAL_OR_HARMFUL_SPEECH','STATEMENT_CATEGORY_PROTECTION_OF_MINORS','STATEMENT_CATEGORY_CYBER_VIOLENCE','STATEMENT_CATEGORY_INTELLECTUAL_PROPERTY_INFRINGEMENTS','STATEMENT_CATEGORY_NEGATIVE_EFFECTS_ON_CIVIC_DISCOURSE_OR_ELECTIONS','STATEMENT_CATEGORY_DATA_PROTECTION_AND_PRIVACY_VIOLATIONS','STATEMENT_CATEGORY_RISK_FOR_PUBLIC_SECURITY']
rows=[next(r for r in D['categories'] if r['source_id']=='2026H1' and r['category_id']==key) for key in keys]
labels=['All notices','Illegal/harmful speech','Protection of minors','Cyber violence','Intellectual property','Civic discourse/elections','Data protection/privacy','Public security']
for i,row in enumerate(rows):
 value=row['reported_median_hours'];ax.scatter(value,i,s=110,color=COPPER if i==0 else GREEN,zorder=3)
 ax.annotate(str(value)+' h',(value,i),xytext=(10,0),textcoords='offset points',va='center',fontsize=13,weight='bold')
ax.set_yticks(range(len(rows)),labels);ax.invert_yaxis();ax.set_xlim(0,82);ax.set_xticks([0,20,40,60,80]);ax.grid(axis='x',color=LINE,lw=.7)
ax.set_xlabel('Published median processing time, hours',labelpad=15)
save(fig,'google-notice-category-medians','Source: Google 4_notices.csv, August 2026 release. Median includes non-action decisions.\nMaps content broadly; EU-focused legal notices, not Canadian review-removal deadlines.')

fig,ax=canvas('The speech category dominates reported notice receipts','The receipt mix is not the unpublished case mix behind each median',left=.19)
rows=D['periods'];y=list(range(len(rows)))
values=[r['speech_category_receipt_share_pct'] for r in rows]
ax.barh(y,values,height=.35,color=GREEN)
for i,row in enumerate(rows):
 ax.text(3,i,f"{row['speech_category_receipt_share_pct']:.2f}%",va='center',color='white',fontsize=22,weight='bold')
 ax.text(3,i+.27,f"{row['speech_category_notices']:,} of {row['notices']:,} reported notices",fontsize=12,color=MUTED)
ax.set_yticks(y,['Jul–Dec 2025','Jan–Jun 2026']);ax.invert_yaxis();ax.set_xlim(0,103);ax.set_ylim(1.6,-.5)
ax.set_xticks([0,25,50,75,100],['0%','25%','50%','75%','100%']);ax.set_xlabel('Illegal or harmful speech receipts / all notice receipts',labelpad=15)
save(fig,'google-notice-receipt-mix','Source: Google 4_notices.csv; original ReviewRemoval receipt-share calculations.\nDo not infer a review-specific rate, median sample size or cause of processing speed.')

fig,ax=canvas('A one-hour median does not bound the tail','Constructed examples only — not observed Google processing times',left=.23)
rows=D['constructed_examples'];y=list(range(len(rows)))
for i,row in enumerate(rows):
 p95=row['p95_nearest_rank_hours'];ax.plot([1,p95],[i,i],color=LINE,lw=3,zorder=0)
 ax.scatter([1],[i],s=110,color=GREEN,zorder=3)
 ax.scatter([p95],[i],s=95,marker='D',facecolors='none',edgecolors=COPPER,lw=2,zorder=4)
 ax.annotate(str(p95)+' h',(p95,i),xytext=(12,0),textcoords='offset points',va='center',fontsize=13,weight='bold')
ax.set_xscale('log');ax.set_xlim(.75,1200);ax.set_xticks([1,24,168,720],['1 h','24 h','168 h','720 h'])
ax.set_yticks(y,[r['scenario'] for r in rows]);ax.invert_yaxis();ax.grid(axis='x',color=LINE,lw=.7)
ax.set_xlabel('Hours — logarithmic scale',labelpad=15)
fig.text(.23,.785,'● Median: 1 h in every example',fontsize=10,color=GREEN)
fig.text(.54,.785,'◇ 95th percentile (nearest rank)',fontsize=10,color=COPPER)
save(fig,'google-notice-median-tail-examples','Each teaching example contains 1,001 constructed cases. Tail examples put 501 at 1 h.\nThey illustrate missing information in a median; they do not estimate Google’s tail or your wait.')
print('Rendered three original SVG/PNG figures at 1200 × 780.')
