"""Draw ReviewRemoval's original aggregate charts; CC BY 4.0.

Research dependency: matplotlib==3.10.7. Run after build-google-ranking.py.
All inputs are aggregate JSON; no customer data or remote fonts are used.
"""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick

HERE=Path(__file__).resolve().parent
OUT=HERE.parent/'assets'
D=json.loads((HERE/'google-review-ranking-study.json').read_text())
NAVY='#17353e'; TEAL='#3c7771'; CORAL='#ad593a'; PALE='#c8d8cf'; GREY='#e4e9e4'; MUTED='#526b70'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'text.color':NAVY,
                     'axes.labelcolor':NAVY,'xtick.color':NAVY,'ytick.color':NAVY,
                     'svg.hashsalt':'reviewremoval-ranking-2026-11-07', 'axes.spines.top':False,
                     'axes.spines.right':False, 'axes.spines.left':False})

def canvas(title,subtitle):
    fig=plt.figure(figsize=(12,7.8),dpi=100,facecolor='white')
    fig.text(.065,.936,title,fontfamily='DejaVu Serif',fontsize=23,fontweight='normal')
    fig.text(.065,.886,subtitle,fontsize=12,color=MUTED)
    return fig

def foot(fig,text):
    fig.text(.065,.061,text,fontsize=10,color=MUTED)
    fig.text(.065,.031,'ReviewRemoval reanalysis · Source: datanephew, Google Maps Visibility Study v1.2 · Snapshot: 18 Oct 2026',fontsize=9,color=MUTED)

def save(fig,name):
    OUT.mkdir(exist_ok=True)
    fig.savefig(OUT/(name+'.svg'),metadata={'Date':None,'Creator':'ReviewRemoval; original aggregate source: datanephew, CC BY 4.0'})
    fig.savefig(OUT/(name+'.png'),dpi=100,pil_kwargs={'optimize':True},metadata={'Software':'ReviewRemoval'})
    plt.close(fig)

def plot():
    rows=D['rating_bands']
    fig=canvas('High ratings do not identify a guaranteed ranking tier','1,571 business listings · Best observed tier across eight search points per market · Six US metros')
    ax=fig.add_axes([.18,.30,.75,.48]); cumulative=[0]*len(rows)
    for key,label,color in [('top3','Best rank 1–3',NAVY),('top10','Best rank 4–10',TEAL),('top20','Best rank 11–20',PALE),('not_seen','Not seen in top 20',GREY)]:
        vals=[r[key+'_percent'] for r in rows]
        ax.barh(range(len(rows)),vals,left=cumulative,color=color,height=.64,label=label,edgecolor='white')
        for i,(v,r) in enumerate(zip(vals,rows)):
            if key=='not_seen': ax.text(cumulative[i]+v/2,i,f'{v:.1f}% not seen',va='center',ha='center',fontsize=11)
        cumulative=[x+y for x,y in zip(cumulative,vals)]
    ax.set_yticks(range(len(rows)),[f'{r["rating_band"]}\nn = {r["listings"]:,}' for r in rows]);ax.invert_yaxis()
    ax.set_xlim(0,100);ax.xaxis.set_major_formatter(mtick.PercentFormatter());ax.set_xlabel('Share within each listing-rating band')
    ax.spines['bottom'].set_visible(False);ax.tick_params(axis='both',length=0,pad=10)
    fig.legend(loc='lower center',bbox_to_anchor=(.51,.12),ncol=2,frameon=False,fontsize=11)
    foot(fig,'“Not seen” is limited to the sampled queries, points and date. No removals or before/after rank effects were measured.')
    save(fig,'google-ranking-rating-bands')

    cats=sorted(D['high_rating_categories'],key=lambda r:r['not_seen_percent'])
    names={'accountant':'Accountants','estate_attorney':'Estate-planning attorneys','handyman':'Handymen',
           'home_health':'Home health','house_cleaning':'House cleaners','landscaper':'Landscapers',
           'massage':'Massage','personal_trainer':'Personal trainers','plumber':'Plumbers'}
    fig=canvas('The same high-rating band spans very different outcomes','Only listings rated 4.8–5.0 · Descriptive category breakdown, not a sector ranking or causal comparison')
    ax=fig.add_axes([.265,.22,.63,.58]); vals=[r['not_seen_percent'] for r in cats]
    ax.barh(range(9),vals,color=TEAL,height=.62)
    ax.set_yticks(range(9),[names[r['category']] for r in cats]);ax.invert_yaxis();ax.set_xlim(0,100)
    ax.xaxis.set_major_formatter(mtick.PercentFormatter());ax.set_xlabel('High-rating listings not seen in sampled top-20 results')
    ax.tick_params(axis='y',length=0,pad=10);ax.set_axisbelow(True);ax.grid(axis='x',alpha=.12)
    for i,r in enumerate(cats):ax.text(vals[i]+1.3,i,f'{vals[i]:.1f}%  ({r["not_seen_count"]}/{r["listings"]})',va='center',fontsize=10)
    foot(fig,'Each category pools two metros. Composition, distance, review count and sampling differ; no Canadian rates are estimated.')
    save(fig,'google-ranking-high-rating-categories')

    comp=D['frame_comparison'];fig=canvas('“Top three” changes meaning when the unit changes','Different frames and rating sources · A business can recur across search points · Not paired effects')
    ax=fig.add_axes([.10,.31,.82,.45]);x=list(range(5));offset=.18
    ax.bar([v-offset for v in x],[r['listing_best_top3_percent'] for r in comp],width=.34,color=NAVY,label='Listings: best rank 1–3 at any point')
    ax.bar([v+offset for v in x],[r['appearance_rank1_3_percent'] for r in comp],width=.34,color=CORAL,label='Appearances: this result ranked 1–3')
    for i,r in enumerate(comp):
        for off,key in [(-offset,'listing_best_top3_percent'),(offset,'appearance_rank1_3_percent')]:
            ax.text(i+off,r[key]+.7,f'{r[key]:.1f}%',ha='center',fontsize=11)
    ax.set_ylim(0,28);ax.set_xticks(x,[r['rating_band'] for r in comp]);ax.yaxis.set_major_formatter(mtick.PercentFormatter());ax.set_ylabel('Top-three share within the specified frame');ax.set_xlabel('Rating band in each source frame')
    ax.grid(axis='y',alpha=.13);ax.set_axisbelow(True);ax.tick_params(axis='y',length=0)
    fig.legend(loc='lower center',bbox_to_anchor=(.50,.123),ncol=1,frameon=False,fontsize=11)
    foot(fig,'4.8–5.0: listings 89/852 = 10.4%; appearances 232/1,214 = 19.1%. These do not track the same businesses before and after.')
    save(fig,'google-ranking-frames')

    fig=plt.figure(figsize=(12,6.3),dpi=100,facecolor=NAVY)
    fig.text(.065,.87,'REVIEWREMOVAL  /  ORIGINAL DATA AUDIT',color=PALE,fontsize=16)
    fig.text(.065,.68,'Can review removal',fontfamily='DejaVu Serif',fontsize=40,color='white')
    fig.text(.065,.57,'promise better rankings?',fontfamily='DejaVu Serif',fontsize=40,color='white')
    fig.text(.065,.28,'63.1%',fontsize=78,color='#e6ad94',fontweight='bold')
    fig.text(.43,.35,'538 of 852 high-rating listings',fontsize=23,color='white')
    fig.text(.43,.27,'not seen in sampled top-20 results',fontsize=20,color=PALE)
    fig.text(.065,.10,'Six US metros · Ratings 4.8–5.0 · Not a removal-outcome or Canadian prevalence study',fontsize=12,color=PALE)
    save(fig,'google-ranking-study-cover')
    print('Created three 1200x780 chart pairs and one 1200x630 social cover pair.')

if __name__=='__main__':plot()
