import {firebaseConfig,configured} from './firebase-config.js';
const $=id=>document.getElementById(id);
const id=new URLSearchParams(location.search).get('id')||'';
const status=$('status');
function showStatus(t,err=false){status.textContent=t;status.className='notice'+(err?' error':'');status.hidden=false;}
const safeImage=v=>{try{const u=new URL(v);return u.protocol==='https:'&&u.hostname==='firebasestorage.googleapis.com'&&u.pathname.startsWith('/v0/b/')?u.href:null}catch{return null}};
if(!/^[A-Za-z0-9_-]{20,128}$/.test(id)){showStatus('ხელოსნის პროფილის ბმული არასწორია.',true);}else if(!configured){showStatus('Firebase ჯერ არ არის დაკავშირებული.',true);}else init();
async function init(){
try{
 const [appSDK,authSDK,dbSDK]=await Promise.all([
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')]);
 const app=appSDK.getApps().length?appSDK.getApp():appSDK.initializeApp(firebaseConfig);
 const auth=authSDK.getAuth(app),db=dbSDK.getFirestore(app);
 let currentUser=null;
 const authReady=new Promise(resolve=>authSDK.onAuthStateChanged(auth,u=>{currentUser=u;resolve(u)},()=>resolve(null)));
 const viewer=await authReady;
 const snap=await dbSDK.getDoc(dbSDK.doc(db,'workerProfiles',id));
 if(!snap.exists()){showStatus('ხელოსნის პროფილი ვერ მოიძებნა.',true);return;}
 const p=snap.data();const self=viewer?.uid===id;
 if(!p.approved && !self){showStatus('ეს პროფილი ჯერ არ არის გამოქვეყნებული.',true);return;}
 $('content').hidden=false;status.hidden=true;
 $('name').textContent=p.displayName||'ხელოსანი';
 $('specialty').textContent=p.subcategory||'მომსახურება';
 $('location').textContent='📍 '+(p.city||'საქართველო');
 $('visitFee').textContent=Number.isInteger(p.visitFee)?p.visitFee.toLocaleString('ka-GE')+' ₾':'შეთანხმებით';
 $('availability').textContent=p.online?'🟢 ონლაინ':'⚪ ოფლაინ';
 if(!p.approved){$('approval').textContent='⏳ ჯერ არ არის დამტკიცებული';$('approval').className='chip warn';$('revealPhone').disabled=true;}
 const avatar=safeImage(p.photoURL);if(avatar){const i=document.createElement('img');i.src=avatar;i.alt='ხელოსნის პროფილის ფოტო';$('avatar').replaceChildren(i);}
 $('bio').textContent=p.bio||'ხელოსანს აღწერა ჯერ არ დაუმატებია.';
 $('experience').textContent=Number.isInteger(p.experienceYears)?'გამოცდილება: '+p.experienceYears+' წელი':'';
 const photos=(Array.isArray(p.gallery)?p.gallery:[]).map(safeImage).filter(Boolean);
 if(photos.length){for(const [i,src] of photos.entries()){const a=document.createElement('a');a.href=src;a.target='_blank';a.rel='noopener noreferrer';const el=document.createElement('img');el.src=src;el.loading='lazy';el.alt='შესრულებული სამუშაო '+(i+1);a.append(el);$('gallery').append(a);}}else{$('noGallery').hidden=false;}
 if(viewer && viewer.uid!==id && p.approved){void record('views',viewer.uid);}
 async function record(kind,viewerUid){
  try{const ref=dbSDK.doc(db,'workerInteractions',id,kind,viewerUid);const exists=await dbSDK.getDoc(ref);if(!exists.exists())await dbSDK.setDoc(ref,{viewerUid,createdAt:dbSDK.serverTimestamp()});}catch(e){console.warn('HEXORA სტატისტიკის ჩაწერა ვერ შესრულდა',e.code||e.message);}
 }
 $('revealPhone').onclick=async()=>{
  const viewer=currentUser || await authReady;
  if(!viewer){$('phoneStatus').hidden=false;$('phoneStatus').textContent='ნომრის სანახავად ჯერ შედი HEXORA-ს ანგარიშში.';const a=document.createElement('a');a.href='account.html';a.textContent=' შესვლა →';$('phoneStatus').append(a);return;}
  if(!p.approved){$('phoneStatus').hidden=false;$('phoneStatus').textContent='ნომერი ხელმისაწვდომი გახდება პროფილის დამტკიცების შემდეგ.';return;}
  $('revealPhone').disabled=true;
  try{
   const contact=await dbSDK.getDoc(dbSDK.doc(db,'workerContacts',id));
   const phone=contact.exists()?contact.data().phone:'';
   if(!/^\+?\d{9,15}$/.test(phone)){$('phoneStatus').hidden=false;$('phoneStatus').textContent='ხელოსანს ტელეფონი ჯერ არ დაუმატებია.';return;}
   $('phoneStatus').hidden=false;$('phoneStatus').textContent='ნომერი: '+phone;
   $('dial').hidden=false;$('dial').href='tel:'+phone;
   $('revealPhone').textContent='ნომერი ნაჩვენებია';
   if(viewer.uid!==id)void record('clicks',viewer.uid);
  }catch(e){$('phoneStatus').hidden=false;$('phoneStatus').className='notice error';$('phoneStatus').textContent='ნომერი ვერ ჩაიტვირთა. შეამოწმე ანგარიშში შესვლა ან Firebase-ის წესები.';}
  finally{$('revealPhone').disabled=false;}
 };
}catch(e){console.error('worker page error',e);showStatus('პროფილი ვერ ჩაიტვირთა. შეამოწმე ინტერნეტი და Firestore-ის წესები.',true);}
}
