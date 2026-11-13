'use strict';
// Recommendations never change the simulator, radio or historical profile labels.
const EQUIPMENT_PROFILE='Switchback | Single Class | R1 Actual150/600/.20 | cam50 FOV130 | gaz100 P2';
const equipmentBaseToday=today;
today=function(){
 const content=equipmentBaseToday();
 const card=`<details class="support-tool equipment-card"><summary>Simülatör ayarları</summary><div><h3>Five33 Switchback</h3><p><b>50° kamera eğimi · 130° yatay FOV · %100 gaz</b><br>Actual: merkez 150 / üst hız 600°/sn / expo 0,20 · Prop Profile 2</p><p class="small">Alıştığın görüşü koruyoruz. Önce simde uygula ve dene; defter simülatör ayarlarını değiştirmez.</p></div><div class="equipment-actions"><button data-action="equipment-guide">Drone sırası ve bütün ayarlar ↗</button><details><summary>Bu ayarları simde uyguladım</summary><p class="small">Yalnız yukarıdaki ayarları ve Single Class koşulunu uyguladıysan bu etiketi seç. Eski kayıtlar korunur; yeni süre referansı oluşur. Farklı ayar kullanıyorsan aşağıdaki ölçüm profili alanına kendi etiketini yaz.</p><button data-action="equipment-profile">Bu ölçüm etiketini kullan</button></details></div></details>`;
 return content.replace('<div class="equipment-slot"></div>',card);
};
const equipmentBaseGuide=guide;
guide=function(){const content=equipmentBaseGuide(),cut=content.indexOf('<div class="guide-layout">');return content.slice(0,cut)+window.FPV_EQUIPMENT_HTML.replace(/<p class="eyebrow">.*?<\/p>/,'')+content.slice(cut);};
document.addEventListener('click',e=>{
 const action=e.target.closest('[data-action]')?.dataset.action;
 if(action==='equipment-guide'){
  location.hash='guide';
  if(page==='guide')render();
 }else if(action==='equipment-profile'){
  pauseTimer();
  state.profile=EQUIPMENT_PROFILE;
  save();render();
  toast('Defterin ölçüm etiketi seçildi. Sim ayarları otomatik değiştirilmedi.');
 }
});
render();
