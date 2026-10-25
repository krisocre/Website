"""Three original figures for ReviewRemoval's Google denominator audit.
Requires Matplotlib. Compilation and figures CC BY 4.0; underlying disclosures Google.
"""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

HERE=Path(__file__).resolve().parent
OUT=HERE.parent/'assets'
D=json.loads((HERE/'google-removal-denominator-audit-2026.json').read_text(encoding='utf-8'))
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'svg.fonttype':'none','svg.hashsalt':'reviewremoval-denominator-v1'})
INK,CLAY,GREY,MUTED='#19323a','#b75939','#8aaca4','#56656a'
def frame(title,subtitle):
    fig,ax=plt.subplots(figsize=(12,7.2),dpi=100)
    fig.patch.set_facecolor('white')
    fig.text(.065,.945,'REVIEWREMOVAL / GOOGLE DATA AUDIT / VERSION 1.0',color=CLAY,fontsize=11)
    fig.text(.065,.868,title,color=INK,fontsize=23,weight='bold')
    fig.text(.065,.812,subtitle,color=MUTED,fontsize=11.5)
    fig.text(.065,.062,'Sources: Google Maps transparency report and correction notice; checked October 24, 2026. Global, not a Canadian sample.',color=MUTED,fontsize=9)
    fig.text(.065,.031,'Original compilation and calculations: ReviewRemoval / CC BY 4.0. Display precision and inequalities are preserved in the dataset.',color=MUTED,fontsize=9)
    return fig,ax
def style(ax):
    ax.set_axisbelow(True);ax.grid(axis='x',alpha=.15)
    ax.tick_params(axis='y',length=0,pad=10)
    for side in ['top','right','left']:ax.spines[side].set_visible(False)
    ax.spines['bottom'].set_color('#cad8d1')
def save(fig,name):
    OUT.mkdir(exist_ok=True)
    for ext in ['png','svg']:
        p=OUT/(name+'.'+ext)
        fig.savefig(p,dpi=100,metadata={'Creator':'ReviewRemoval','Date':None} if ext=='svg' else {'Software':'ReviewRemoval / Matplotlib'})
        if ext=='svg':
            s=p.read_text(encoding='utf-8').replace("font-family: 'DejaVu Sans'","font-family: 'DejaVu Sans', Arial, sans-serif")
            p.write_text('\n'.join(line.rstrip() for line in s.splitlines())+'\n',encoding='utf-8')
    plt.close(fig)
def row(year,metric):return next(r for r in D['rows'] if r['year']==year and r['metric']==metric and r['source_kind']=='current_snapshot')

fig,ax=frame('The removal-reason chart uses all contributed reviews.','The denominator is all reviews contributed, not removed reviews and not business-owner reports.')
fig.subplots_adjust(left=.285,right=.91,top=.70,bottom=.28)
keys=['fake_or_misleading','vandalism_or_off_topic','account_restriction_reviews','other']
labels=['Fake or misleading','Vandalism or off-topic','Account restriction reviews','Other']
for offset,year,color in [(-.17,2024,GREY),(.17,2025,CLAY)]:
    values=[row(year,'reason_'+key)['value'] for key in keys]
    ax.barh([i+offset for i in range(4)],values,height=.28,color=color,label=str(year))
    for i,v in enumerate(values):ax.text(v+.14,i+offset,f'{v:.1f}%',va='center',fontsize=11,color=INK)
ax.set_yticks(range(4),labels);ax.invert_yaxis();ax.set_xlim(0,18)
ax.xaxis.set_major_formatter(FuncFormatter(lambda x,pos:f'{x:g}%'))
ax.set_xlabel('Share of all reviews contributed (displayed rates)',labelpad=10)
ax.legend(loc='lower right',frameon=False,ncol=2);style(ax)
fig.text(.065,.15,'Harm is not drawn as a point: both years report <0.1%. An unchanged bound does not establish an unchanged rate.',color=MUTED,fontsize=10)
save(fig,'google-removal-reasons-denominators')

fig,ax=frame('More review removals; fewer restricted accounts.','2024 to 2025 changes calculated from Google’s current snapshot magnitudes; rounded, not exact counts.')
fig.subplots_adjust(left=.30,right=.87,top=.72,bottom=.25)
keys=['reviews_removed','reviews_published','media_published','profiles_removed','edits_published','edits_removed','media_removed','accounts_restricted']
labels=['Reviews removed','Reviews published','Photos / videos published','Business Profiles removed','Place edits published','Place edits removed','Photos / videos removed','Accounts restricted']
comparisons=[next(c for c in D['comparisons'] if c['metric']==key) for key in keys]
values=[c['nominal_relative_change_percent'] for c in comparisons]
ax.barh(range(len(values)),values,color=[CLAY if v>=0 else GREY for v in values],height=.62)
for i,(v,c) in enumerate(zip(values,comparisons)):
    ax.text(v+(.45 if v>=0 else -.45),i,f'{v:+.1f}%',ha='left' if v>=0 else 'right',va='center',fontsize=11,color=INK)
ax.set_yticks(range(len(values)),labels);ax.invert_yaxis();ax.set_xlim(-24,25)
ax.axvline(0,color=INK,linewidth=.8);ax.xaxis.set_major_formatter(FuncFormatter(lambda x,pos:f'{x:g}%'))
ax.set_xlabel('Nominal change within each metric; units are not added',labelpad=10);style(ax)
fig.text(.065,.14,'Review removals: 245M → 292M. Restricted accounts: 949K → 782K. These changes do not prove why enforcement changed.',color=MUTED,fontsize=10)
save(fig,'google-removal-metric-changes')

fig,ax=frame('Google corrected its 2024 reporting inputs.','The March 2026 notice changed both place-edit counts; use one source version consistently.')
fig.subplots_adjust(left=.30,right=.91,top=.67,bottom=.36)
old=[94,70];new=[83,82];labels=['Place edits published','Place edits removed']
for i,(a,b) in enumerate(zip(old,new)):
    ax.plot([a,b],[i,i],color='#bacbc3',linewidth=5,zorder=1)
    ax.scatter([a],[i],s=130,color=GREY,label='Superseded' if i==0 else None,zorder=2)
    ax.scatter([b],[i],s=130,color=CLAY,label='Revised' if i==0 else None,zorder=2)
    ax.text(a,i-.14,f'{a}M',ha='center',fontsize=13,color=INK)
    ax.text(b,i+.23,f'{b}M',ha='center',fontsize=13,color=CLAY)
ax.set_yticks([0,1],labels);ax.set_ylim(1.6,-.7);ax.set_xlim(60,101)
ax.set_xticks([60,70,80,90,100]);ax.set_xlabel('Place-edit count, in millions',labelpad=10);style(ax)
ax.legend(loc='lower right',frameon=False,ncol=2,bbox_to_anchor=(1,1.02))
fig.text(.065,.20,'A separate correction changes the harm bound: <0.01% → <0.1% of all contributed reviews.',color=INK,fontsize=11)
fig.text(.065,.155,'That is a less restrictive upper bound, not evidence of a tenfold increase in actual harmful reviews.',color=MUTED,fontsize=10.5)
save(fig,'google-removal-source-corrections')
print('Built three SVG and 1200×720 PNG figures.')
