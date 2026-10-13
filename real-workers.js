import { firebaseConfig, configured } from './firebase-config.js';
const area=document.getElementById('liveWorkers');
const status=document.getElementById('liveProfilesStatus');
if (!area || !status) throw new Error('HEXORA: missing live catalog container');
let approvedWorkers = [];
let filters={category:null,subcategory:null,city:'ყველა ქალაქი',onlineOnly:false,sort:'default'};
const safe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ratingCache=new Map();
const ratingPending=new Set();
let firestoreDb=null,firestoreSDK=null;
const safeFee=v=>Number.isInteger(v)&&v>=1&&v<=2000?`${v.toLocaleString('ka-GE')} ₾`:'ფასი შეთანხმებით';
function render(){
 let visible=approvedWorkers.filter(w=>
  (filters.category===null||w.category===filters.category)&&
  (filters.subcategory===null||w.subcategory===filters.subcategory)&&
  (!filters.city||filters.city==='ყველა ქალაქი'||w.city===filters.city)&&
  (!filters.onlineOnly||w.online===true)
 );
 visible.sort(filters.sort==='price'?(a,b)=>a.visitFee-b.visitFee:(a,b)=>Number(b.online)-Number(a.online));
 const suffix=filters.onlineOnly?' ონლაინ':'';
 status.classList.remove('error');
 status.textContent=visible.length?`✅ ნაპოვნია ${visible.length} დამტკიცებული${suffix} ხელოსანი. ვიზიტის ფასი მითითებულია ხელოსნის მიერ.`:'ამ კატეგორიაში ჯერ არ არის დამტკიცებული'+suffix+' ხელოსანი. ხელოსნებს რეგისტრაცია შეუძლიათ HEXORA-ზე.';
 area.innerHTML=visible.map(w=>`<article class="worker" data-live-worker="${safe(w.id)}"><div class="worker-head"><div class="avatar">👷</div><div style="flex:1"><h3>${safe(w.displayName)}</h3><div class="muted small">📍 ${safe(w.city)}</div></div><span class="status ${w.online?'':'off'}">● ${w.online?'ონლაინ':'ოფლაინ'}</span></div><div class="worker-tags"><span class="chip">✉️ ელფოსტით დადასტურებული</span><span class="chip">${safe(w.subcategory)}</span></div><div class="muted small" data-rating-worker="${safe(w.id)}">☆ შეფასებები იტვირთება...</div><p class="live-note">ვიზიტის საფასურს ხელოსანი თავად ადგენს. რეალური გამოძახება და გადახდა ამ ეტაპზე ჯერ არ არის ჩართული.</p><div class="worker-foot"><div class="price">${safeFee(w.visitFee)} <small>/ ვიზიტი</small></div><button type="button" class="btn btn-sm" disabled title="რეალური გამოძახებები ჯერ არ მუშაობს">გამოძახება მალე</button><a href="worker.html?id=${encodeURIComponent(w.id)}" class="btn btn-dark btn-sm" style="text-decoration:none">პროფილის ნახვა →</a></div></article>`).join('');
 void loadVisibleRatings(visible.slice(0,24));
 updateRatingBadges();
}
function updateRatingBadges(){
 area.querySelectorAll('[data-rating-worker]').forEach(el=>{
   const d=ratingCache.get(el.dataset.ratingWorker);
   if(d){el.textContent=d.total?`⭐ ${d.avg.toFixed(1)} / 5 · ${d.total} შეფასება`:'☆ ჯერ შეფასება არ აქვს';}
   else {el.textContent='☆ შეფასებები ხელოსნის პროფილზე';}
 });
}
async function loadVisibleRatings(workers){
 if(!firestoreDb||!firestoreSDK)return;
 for(const worker of workers){
   if(ratingCache.has(worker.id)||ratingPending.has(worker.id))continue;
   ratingPending.add(worker.id);
   try{
     const ref=firestoreSDK.collection(firestoreDb,'workerReviews',worker.id,'items');
     const agg=await firestoreSDK.getAggregateFromServer(ref,{total:firestoreSDK.count(),avg:firestoreSDK.average('rating')});
     ratingCache.set(worker.id,agg.data());updateRatingBadges();
   }catch(error){console.warn('HEXORA rating summary unavailable',error.code||error.message);}
   finally{ratingPending.delete(worker.id);}
 }
}
window.addEventListener('hexora:filters',e=>{filters={...filters,...(e.detail||{})};if(ready)render();});
let ready=false;
async function init(){
 if(!configured){status.classList.add('error');status.textContent='Firebase კონფიგურაცია ჯერ არ არის დასრულებული.';return;}
 try {
  const [appSDK, dbSDK]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')
  ]);
  const app=appSDK.getApps().length?appSDK.getApp():appSDK.initializeApp(firebaseConfig);
  const db=dbSDK.getFirestore(app);firestoreDb=db;firestoreSDK=dbSDK;
  // Only approved profiles are requested. The Firestore rules also restrict access.
  const q=dbSDK.query(dbSDK.collection(db,'workerProfiles'),dbSDK.where('approved','==',true));
  dbSDK.onSnapshot(q,snapshot=>{
   approvedWorkers=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}))
    .filter(w=>typeof w.displayName==='string'&&typeof w.city==='string'&&Number.isInteger(w.category)&&typeof w.subcategory==='string');
   ready=true;render();
  }, err=>{
   console.error('HEXORA worker catalog query failed',err.code||err.message);
   status.classList.add('error');
   status.textContent='ხელოსნების ბაზა დროებით ვერ ჩაიტვირთა. გადაამოწმე Firebase Firestore-ის წესები და ინტერნეტკავშირი.';
   area.replaceChildren();
  });
 }catch(err){
  console.error('HEXORA catalog failed to initialize',err.code||err.message);
  status.classList.add('error');
  status.textContent='ხელოსნების კატალოგი დროებით ვერ ჩაიტვირთა. სცადე გვერდის განახლება.';
 }
}
init();
