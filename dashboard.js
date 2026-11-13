/* Measured flight analytics. Reading this page never changes training data. */
'use strict';
let dashPeriod='all',dashProfile=null,dashTrack='',dashSort='recent';
const dashNumber=n=>Number(n).toLocaleString('tr-TR',{maximumFractionDigits:1});
const dashPercent=n=>n==null?'—':`%${dashNumber(n)}`;
function dashStats(logs){
 const attempts=logs.flatMap(l=>l.attempts),clean=attempts.filter(n=>n!==null);
 return {attempts:attempts.length,clean:clean.length,rate:attempts.length?clean.length/attempts.length*100:null,median:median(clean),best:clean.length?clean.reduce((best,n)=>Math.min(best,n),Infinity):null};
}
function dashData(now=Date.now()){
 const profile=dashProfile??state.profile,cutoff=dashPeriod==='all'?-Infinity:now-Number(dashPeriod)*86400000;
 const logs=state.logs.filter(l=>l.attempts.length&&l.profile===profile&&l.time>=cutoff&&l.time<=now).slice().sort((a,b)=>a.time-b.time);
 const groups=new Map();for(const l of logs){if(!groups.has(l.track))groups.set(l.track,[]);groups.get(l.track).push(l);}
 const rows=[...groups].map(([id,items])=>{
  const measured=items.filter(l=>l.attempts.filter(n=>n!==null).length>=3),first=measured[0],last=measured.at(-1),a=first?dashStats([first]):null,b=last?dashStats([last]):null;
  return {id,logs:items,...dashStats(items),lastTime:items.at(-1).time,first:a,last:b,change:measured.length>=2?(a.median-b.median)/a.median*100:null};
 });
 rows.sort((a,b)=>dashSort==='name'?byId[a.id].name.localeCompare(byId[b.id].name,'tr'):dashSort==='attempts'?b.attempts-a.attempts:b.lastTime-a.lastTime);
 return {profile,logs,rows,...dashStats(logs)};
}
function dashEmpty(text){return `<div class="dash-empty"><strong>Ölçüm bekleniyor</strong><p>${text}</p><a href="#today">Bugünün çalışmasını aç</a></div>`;}
function dashSvg(label,body,view='0 0 600 240'){return `<svg viewBox="${view}" class="dash-chart" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${body}</svg>`;}
function dashBars(logs){
 const groups=new Map();for(const l of logs){const key=new Date(l.time).toLocaleDateString('sv-SE');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(l);}
 const days=[...groups].slice(-14).map(([date,items])=>({date,...dashStats(items)}));
 if(!days.length)return dashEmpty('Saniye veya X girerek tur denemelerini kaydet. Temiz ve hatalı turlar burada gün gün ayrılacak.');
 const max=Math.max(...days.map(d=>d.attempts)),slot=520/days.length,w=Math.min(32,slot*.6);
 let body=[0,.5,1].map(r=>`<line class="dash-gridline" x1="45" x2="580" y1="${190-r*150}" y2="${190-r*150}"/><text x="32" y="${195-r*150}" text-anchor="end">${dashNumber(max*r)}</text>`).join('');
 body+=days.map((d,i)=>{const x=48+i*slot+slot/2,h=d.clean/max*150,f=(d.attempts-d.clean)/max*150;return `<g><title>${d.date}: ${d.clean} temiz, ${d.attempts-d.clean} hatalı tur</title><rect class="dash-bar-clean" x="${x-w/2}" y="${190-h}" width="${w}" height="${h}"/><rect class="dash-bar-fail" x="${x-w/2}" y="${190-h-f}" width="${w}" height="${f}"/><text x="${x}" y="${180-h-f}" text-anchor="middle">${d.attempts}</text>${days.length<=4||i%Math.ceil(days.length/4)===0?`<text x="${x}" y="216" text-anchor="middle">${d.date.slice(8)}.${d.date.slice(5,7)}</text>`:''}</g>`;}).join('');
 return dashSvg('Son 14 kayıt gününde temiz ve hatalı tur sayıları. Kesin değerler aşağıdaki tabloda.',body)+`<div class="dash-legend"><span class="clean">Temiz tur</span><span class="fail">Hatalı tur (X)</span></div><details class="dash-disclosure"><summary>Günlük sayıları göster</summary><div class="dash-scroll" tabindex="0" role="region" aria-label="Günlük tur sayıları"><table><thead><tr><th scope="col">Tarih</th><th scope="col">Temiz</th><th scope="col">Hatalı</th><th scope="col">Temiz oranı</th></tr></thead><tbody>${days.map(d=>`<tr><th scope="row">${d.date}</th><td>${d.clean}</td><td>${d.attempts-d.clean}</td><td>${dashPercent(d.rate)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
function dashLine(row){
 if(!row)return dashEmpty('Bu profil ve dönemde kayıt bulunmuyor. Başka bir dönem veya profil seçebilirsin.');
 const points=row.logs.map((l,i)=>({i,day:l.day,...dashStats([l])})),valid=points.filter(p=>p.median!==null);
 if(!valid.length)return dashEmpty('Bu pistte henüz temiz tur süresi yok. Temiz bir uçan turun saniyesini kaydet.');
 const vals=valid.map(p=>p.median),min=Math.max(0,Math.min(...vals)*.9),max=Math.max(...vals)*1.1,range=max-min||1;
 const xy=p=>[55+(points.length===1?.5:p.i/(points.length-1))*500,185-(p.median-min)/range*140];
 let body=[0,.5,1].map(r=>`<line class="dash-gridline" x1="55" x2="555" y1="${185-r*140}" y2="${185-r*140}"/><text x="44" y="${189-r*140}" text-anchor="end">${fmt(min+r*range)}</text>`).join('');
 for(let i=1;i<points.length;i++)if(points[i-1].median!==null&&points[i].median!==null){const a=xy(points[i-1]),b=xy(points[i]);body+=`<line class="dash-trend" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;}
 body+=valid.map(p=>{const [x,y]=xy(p);return `<circle class="dash-point" cx="${x}" cy="${y}" r="5"><title>Gün ${p.day}: ortanca ${fmt(p.median)} sn, ${p.clean}/${p.attempts} temiz</title></circle>`;}).join('');
 body+=`<text x="55" y="217">İlk kayıt · Gün ${points[0].day}</text><text x="555" y="217" text-anchor="end">Son kayıt · Gün ${points.at(-1).day}</text>`;
 return dashSvg(`${byId[row.id].name}: her kaydın temiz tur ortancası, saniye. Daha düşük daha hızlıdır.`,body)+`<p class="dash-caption">Her nokta bir kayıt; dikey eksen saniye. Hatalı tur X olarak kalır, süre ortancasına girmez. Kesintiler temiz tur olmayan kayıtlardır.</p><details class="dash-disclosure"><summary>Süre kayıtlarını tablo olarak gör</summary><div class="dash-scroll" tabindex="0" role="region" aria-label="Seçili pistin tur süresi kayıtları"><table><thead><tr><th scope="col">Kayıt tarihi</th><th scope="col">Program günü</th><th scope="col">Temiz / deneme</th><th scope="col">Ortanca</th><th scope="col">En iyi tur</th></tr></thead><tbody>${points.map((p,i)=>`<tr><th scope="row">${new Date(row.logs[i].time).toLocaleDateString('tr-TR')}</th><td>${p.day}</td><td>${p.clean} / ${p.attempts}</td><td>${fmt(p.median)} sn</td><td>${fmt(p.best)} sn</td></tr>`).join('')}</tbody></table></div></details>`;
}
function dashRadarValues(log,id,profile){
 const s=dashStats([log]),clean=log.attempts.filter(n=>n!==null),b=state.baselines[id+'|'+profile];
 if(clean.length<3||!b)return null;
 const windows=log.attempts.length-2;
 let triples=0;for(let i=0;i<windows;i++)if(log.attempts.slice(i,i+3).every(n=>n!==null))triples++;
 return [s.rate,clean.filter(n=>n<=b).length/log.attempts.length*100,triples/windows*100,Math.min(...clean)/Math.max(...clean)*100];
}
function dashRadar(row,profile){
 const entries=row?.logs.map(l=>({log:l,values:dashRadarValues(l,row.id,profile)})).filter(x=>x.values)||[];
 const labels=['Temiz tur','B hedefine uyum','Temiz üçlü seri','Süre tutarlılığı'];
 if(!entries.length)return dashEmpty('Örümcek grafik için bu pistte en az 3 temiz tur içeren bir kayıt ve kayıtlı B süresi gerekli. B, ilk 3 temiz turun ortancasıdır.');
 const current=entries.at(-1),first=entries.length>1?entries[0]:null,center=[180,150],radius=95;
 const pt=(i,value)=>{const a=-Math.PI/2+i*Math.PI/2;return [center[0]+Math.cos(a)*radius*value/100,center[1]+Math.sin(a)*radius*value/100];};
 const poly=values=>values.map((v,i)=>pt(i,v).join(',')).join(' ');
 let body=[25,50,75,100].map(r=>`<polygon class="dash-gridline" points="${poly([r,r,r,r])}"/>`).join('');
 body+=labels.map((label,i)=>{const p=pt(i,100),t=pt(i,130);return `<line class="dash-gridline" x1="180" y1="150" x2="${p[0]}" y2="${p[1]}"/><text x="${t[0]}" y="${t[1]+4}" text-anchor="middle">${label}</text>`;}).join('');
 if(first)body+=`<polygon class="dash-radar-first" points="${poly(first.values)}"/>`;
 body+=`<polygon class="dash-radar-last" points="${poly(current.values)}"/>`;
 return dashSvg('Uçuş ölçümleri, yüzde 0–100. Dış kenara yakın değer daha yüksek oranı gösterir. Sayısal değerler altta.',body,'-55 0 470 300')+`<div class="dash-legend"><span class="clean">Son uygun kayıt</span>${first?'<span class="first">İlk uygun kayıt</span>':''}</div><dl class="dash-radar-values">${labels.map((label,i)=>`<div><dt>${label}</dt><dd>${first?`<span>${dashPercent(first.values[i])} → </span>`:''}${dashPercent(current.values[i])}</dd></div>`).join('')}</dl><details class="dash-disclosure"><summary>Bu dört ölçüm ne demek?</summary><p>Her eksen %0–100. Bunlar kumanda becerisi puanı değildir.</p><ul><li>Temiz tur: temiz / bütün denemeler.</li><li>B hedefine uyum: B süresini aşmayan temiz tur / bütün denemeler.</li><li>Temiz üçlü seri: art arda üç temiz tur içeren üçlü pencereler / bütün üçlü pencereler.</li><li>Süre tutarlılığı: en hızlı temiz / en yavaş temiz tur. Yüksek oran sürelerin birbirine yakın olduğunu gösterir; tek başına hızlı uçtuğun anlamına gelmez.</li></ul><p>İlk ve son uygun kayıt aynı pist ve profilden alınır. Bugünkü kayıtlı B: ${fmt(state.baselines[row.id+'|'+profile])} sn. ${first?`Gün ${first.log.day} ile gün ${current.log.day} karşılaştırılıyor.`:'İkinci uygun kayıtla karşılaştırma açılacak.'}</p></details>`;
}
function dashDonut(){
 const completed=new Set(state.completed),initial=D.initial.filter(id=>completed.has(id)).length,added=completed.size-initial,left=D.tracks.length-completed.size,total=D.tracks.length;
 const slices=[{n:added,label:'Sonradan tamamlanan',cls:'dash-slice-new'},{n:initial,label:'Başlangıçta tamamlanan',cls:'dash-slice-initial'},{n:left,label:'Tamamlanmamış',cls:'dash-slice-left'}];
 let offset=0,body='<circle class="dash-donut-ground" cx="100" cy="100" r="76"/>';
 for(const s of slices){body+=`<circle class="${s.cls}" cx="100" cy="100" r="76" pathLength="100" stroke-dasharray="${s.n/total*100} ${100-s.n/total*100}" stroke-dashoffset="${-offset}" transform="rotate(-90 100 100)"/>`;offset+=s.n/total*100;}
 body+=`<text class="dash-donut-number" x="100" y="98" text-anchor="middle">${dashPercent(completed.size/total*100)}</text><text x="100" y="121" text-anchor="middle">katalog tamamlandı</text>`;
 return `<div class="dash-catalog">${dashSvg(`${completed.size} / ${total} pist tamamlandı. Başlangıçta ${initial}, sonradan ${added}, tamamlanmamış ${left}.`,body,'0 0 200 200')}<dl>${slices.map(s=>`<div class="${s.cls}"><dt>${s.label}</dt><dd>${dashNumber(s.n)}</dd></div>`).join('')}</dl></div><p class="dash-caption">Bütün profiller ve tarihler. Bir temiz tam tur katalog işaretini tamamlar; günlük hedef ayrı hesaplanır.</p>`;
}
function dashTable(rows){
 if(!rows.length)return '<p class="dash-caption">Seçili filtrelerde süreli pist kaydı yok. Filtreyi değiştir veya bugünkü uçuşunu kaydet.</p>';
 return `<div class="dash-scroll" tabindex="0" role="region" aria-label="Pist gelişim tablosu, dar ekranda yatay kaydırılabilir"><table class="dash-table"><caption>Filtredeki ${rows.length} pist. Dar ekranda tabloyu yatay kaydır.</caption><thead><tr><th scope="col">Pist / sahne</th><th scope="col">Deneme</th><th scope="col">Temiz oranı</th><th scope="col">En iyi tur</th><th scope="col">İlk → son ortanca</th><th scope="col">Süre değişimi</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row"><button class="dash-track-link" data-dash-track="${esc(r.id)}">${esc(byId[r.id].name)}</button><small>${esc(byId[r.id].scene)}</small></th><td>${r.clean} / ${r.attempts}<small>temiz / toplam</small></td><td>${dashPercent(r.rate)}</td><td>${fmt(r.best)} sn</td><td>${r.change===null?'İki uygun kayıt gerekli':`${fmt(r.first.median)} → ${fmt(r.last.median)} sn`}</td><td>${r.change===null?'—':`${dashPercent(Math.abs(r.change))} ${r.change>0?'daha hızlı':r.change<0?'daha yavaş':'aynı süre'}<small>Temiz oranı ${dashPercent(r.first.rate)} → ${dashPercent(r.last.rate)}</small>`}</td></tr>`).join('')}</tbody></table></div>`;
}
function dashboard(){
 if(!window.FPV_DASH_READY)return '<p>Gelişim panosu hazırlanıyor…</p>';
 const data=dashData();if(!data.rows.some(r=>r.id===dashTrack))dashTrack=data.rows[0]?.id||'';
 const row=data.rows.find(r=>r.id===dashTrack),profiles=[...new Set([state.profile,...state.logs.map(l=>l.profile)])];
 const totalSecs=Object.values(state.activity).reduce((sum,n)=>sum+n,0),goalCount=Object.values(state.results).filter(r=>r.goal).length;
 const nextTask=typeof tasksFor==='function'?tasksFor().find(t=>!result(t).goal&&!result(t).blocked):null;
 const nextTrack=nextTask?byId[nextTask.track]:null;
 const periodText={all:'Tüm kayıtlar',7:'Son 7 gün',30:'Son 30 gün',90:'Son 90 gün'}[dashPeriod]||'Tüm kayıtlar';
 const empty=!data.logs.length;
 return `<div class="dash-root">
 <header class="dash-masthead"><div><h1>Gelişim panosu</h1><p>Ne kadar uçtun, ne kadar temiz uçtun, nerede hızlandın?</p></div><a class="dash-primary-link" href="#today">Bugünkü çalışmayı aç</a></header>
 <div class="dash-toolbar"><div class="dash-toolbar-title"><strong>Kayıtlarını incele</strong><span>${periodText} · ${esc(data.profile)}</span></div><label>Dönem<select id="dash-period">${[['all','Tüm kayıtlar'],['7','Son 7 gün'],['30','Son 30 gün'],['90','Son 90 gün']].map(([v,s])=>`<option value="${v}" ${dashPeriod===v?'selected':''}>${s}</option>`).join('')}</select></label><label>Ölçüm profili<select id="dash-profile">${profiles.map(p=>`<option ${data.profile===p?'selected':''}>${esc(p)}</option>`).join('')}</select></label></div>
 <div class="dash-overview">
  <aside class="dash-period-summary"><h2>Dönem özeti</h2><p>${empty?'İlk tur kaydınla başlayacak.':`${new Set(data.logs.map(l=>l.day)).size} program gününde uçuş kaydın var.`}</p><dl class="dash-summary"><div><dt>Temiz tur oranı</dt><dd><strong>${dashPercent(data.rate)}</strong><span>${data.clean} / ${data.attempts} deneme</span></dd></div><div><dt>Uçuş kaydı</dt><dd>${dashNumber(data.logs.length)}<span>${dashNumber(data.rows.length)} farklı pistte</span></dd></div></dl><div class="dash-next"><h3>${nextTask?'Sıradaki çalışma':'Bugünün hedefleri tamam'}</h3><p>${nextTrack?`${esc(nextTrack.name)} · ${esc(nextTask.title)}`:'Günün notunu ekleyebilir veya uçuşlarını inceleyebilirsin.'}</p><a href="#today">Çalışma alanına git →</a></div></aside>
  <section class="dash-panel dash-activity"><div class="dash-section-head"><h2>Gün gün uçuşların</h2><p>Son 14 kayıt gününde temiz ve hatalı tur sayısı.</p></div>${dashBars(data.logs)}</section>
 </div>
 <section class="dash-track-section" id="dash-track-section"><div class="dash-track-intro"><div><h2>Aynı pistte ne değişti?</h2><p>Tur süresini ve uçuş tutarlılığını birlikte karşılaştır.</p></div><label>İncelenecek pist<select id="dash-track" ${data.rows.length?'':'disabled'}>${data.rows.length?data.rows.map(r=>`<option value="${esc(r.id)}" ${r.id===dashTrack?'selected':''}>${esc(byId[r.id].name)} — ${esc(byId[r.id].scene)}</option>`).join(''):'<option>Kayıtlı pist yok</option>'}</select></label></div>
 ${row?`<div class="dash-track-name"><div><h3>${esc(byId[row.id].name)}</h3><p>${esc(byId[row.id].scene)}</p></div><span>${row.attempts} deneme · ${dashPercent(row.rate)} temiz</span></div>`:''}
 <div class="dash-track-grid"><section class="dash-panel"><div class="dash-section-head"><h3>Tur süresindeki değişim</h3><p>Temiz turların ortancası, saniye. Daha düşük süre daha hızlıdır.</p></div>${dashLine(row)}${row?.change!=null?`<div class="dash-takeaway"><strong>${dashPercent(Math.abs(row.change))} ${row.change>0?'daha hızlı':row.change<0?'daha yavaş':'aynı süre'}</strong><p>${fmt(row.first.median)} sn → ${fmt(row.last.median)} sn · temiz oranı ${dashPercent(row.first.rate)} → ${dashPercent(row.last.rate)}</p></div>`:''}</section><section class="dash-panel"><div class="dash-section-head"><h3>Uçuş tutarlılığı</h3><p>Aynı pist ve profilde, ilk ve son uygun kayıt.</p></div>${dashRadar(row,data.profile)}</section></div></section>
 <section class="dash-records"><div class="dash-records-head"><div><h2>Pist kayıtların</h2><p>Bir pistin adına basarak yukarıdaki karşılaştırmayı aç.</p></div><label>Sıralama<select id="dash-sort">${[['recent','Son çalışılan'],['name','Pist adı'],['attempts','En çok denenen']].map(([v,s])=>`<option value="${v}" ${dashSort===v?'selected':''}>${s}</option>`).join('')}</select></label></div>${dashTable(data.rows)}</section>
 <div class="dash-longterm"><section class="dash-panel"><div class="dash-section-head"><h2>Katalogdaki ilerlemen</h2><p>Bütün tarihler ve profiller.</p></div>${dashDonut()}</section><section class="dash-lifetime"><h2>Toplam çalışma</h2><p>Bu bölüm üstteki dönem filtresinden bağımsızdır.</p><dl><div><dt>Tamamlanan günlük hedef</dt><dd>${dashNumber(goalCount)}</dd></div><div><dt>Sayaçta kayıtlı süre</dt><dd>${Math.floor(totalSecs/3600)} sa ${Math.floor(totalSecs%3600/60)} dk</dd></div></dl><p class="dash-caption">Sayaç dışında yaptığın uçuşların süresi ölçülmez. Bir pisti temiz bitirmek ve günlük hedefi tamamlamak ayrı kaydedilir.</p><a href="#progress">Bütün uçuş kayıtlarını aç →</a></section></div>
 <details class="dash-disclosure dash-method"><summary>Bu ölçümler nasıl hesaplanıyor?</summary><p>Temiz uçuş oranı temiz tur / bütün denemelerdir; X denemeleri paydada kalır. Süre karşılaştırması aynı pistte en az iki uygun kaydın ortancasını kullanır. Her uygun kayıtta en az 3 temiz tur gerekir. Sayaç dışındaki uçuş süresi bilinmez.</p><a href="#guide">Ölçüm ve uçuş rehberini aç</a></details>
 </div>`;
}document.addEventListener('change',e=>{
 const id=e.target.id;if(!['dash-period','dash-profile','dash-track','dash-sort'].includes(id))return;
 if(id==='dash-period')dashPeriod=e.target.value;if(id==='dash-profile')dashProfile=e.target.value;if(id==='dash-track')dashTrack=e.target.value;if(id==='dash-sort')dashSort=e.target.value;
 render();document.getElementById(id)?.focus({preventScroll:true});
});
document.addEventListener('click',e=>{const button=e.target.closest('[data-dash-track]');if(!button)return;dashTrack=button.dataset.dashTrack;render();const select=$('#dash-track');select.focus({preventScroll:true});$('#dash-track-section').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
window.addEventListener('hashchange',()=>{document.title=page==='dashboard'?'Gelişim panosu · FPV Çalışma Defteri':'FPV Çalışma Defteri';$('#main').focus({preventScroll:true});});
window.FPV_DASH_READY=true;
window.FPV_ANALYTICS={stats:dashStats,data:dashData,radarValues:dashRadarValues};
render();
if(page==='dashboard')document.title='Gelişim panosu · FPV Çalışma Defteri';

