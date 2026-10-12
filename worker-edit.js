import {firebaseConfig,configured} from './firebase-config.js';
const $=id=>document.getElementById(id);
const status=$('status');let app,auth,db,storage,authSDK,dbSDK,storageSDK,uid,profile;
function note(s,err=false){status.textContent=s;status.className='notice'+(err?' error':'');status.hidden=false;}
const validImage=u=>{try{const p=new URL(u);return p.protocol==='https:'&&p.hostname==='firebasestorage.googleapis.com'&&p.pathname.startsWith('/v0/b/')?p.href:''}catch{return ''}};
if(!configured){note('Firebase ჯერ არ არის დაკავშირებული.',true);}else init();
async function init(){try{
 const [appSDK,aSDK,fSDK,sSDK]=await Promise.all([
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js'),
  import('https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js')
 ]);
 app=appSDK.getApps().length?appSDK.getApp():appSDK.initializeApp(firebaseConfig);
 authSDK=aSDK;dbSDK=fSDK;storageSDK=sSDK;
 auth=aSDK.getAuth(app);db=fSDK.getFirestore(app);storage=sSDK.getStorage(app);
 aSDK.onAuthStateChanged(auth,async(user)=>{
  if(!user){note('ჯერ შედი HEXORA-ს ანგარიშში.');const a=document.createElement('a');a.href='account.html';a.textContent=' შესვლა / რეგისტრაცია →';status.append(a);$('editor').hidden=true;return;}
  uid=user.uid;
  try{
   const acc=await fSDK.getDoc(fSDK.doc(db,'accounts',uid));
   if(!acc.exists()||acc.data().role!=='worker'){note('ეს გვერდი განკუთვნილია ხელოსნის ანგარიშისთვის. მომხმარებლის ანგარიშით ხელოსნის გვერდს ვერ შექმნი.',true);$('editor').hidden=true;return;}
   const w=await fSDK.getDoc(fSDK.doc(db,'workerProfiles',uid));
   if(!w.exists()){note('ხელოსნის პროფილი ვერ მოიძებნა. შეამოწმე რეგისტრაცია.',true);return;}
   profile=w.data();$('editor').hidden=false;
   $('previewLink').hidden=false;$('previewLink').href='worker.html?id='+encodeURIComponent(uid);
   $('bio').value=profile.bio||'';$('experience').value=profile.experienceYears??0;
   const c=await fSDK.getDoc(fSDK.doc(db,'workerContacts',uid));$('phone').value=c.exists()?c.data().phone||'':'';
   renderGallery();renderAvatar();
   note(profile.approved?'✅ პროფილი დამტკიცებულია; ფოტოები და აღწერა საჯაროდ გამოჩნდება.':'⏳ პროფილი ჯერ გადამოწმებას ელოდება; საჯარო კატალოგში არ გამოჩნდება.');
   void loadStats();
  }catch(e){console.error(e);note('პროფილის ჩატვირთვა ვერ მოხერხდა. გადაამოწმე Firebase-ის წესები.',true);}
 });
}catch(e){console.error(e);note('Firebase ვერ ჩაიტვირთა. გადაამოწმე კონფიგურაცია და ინტერნეტი.',true);}}
$('profileForm').onsubmit=async e=>{
 e.preventDefault();if(!uid||!profile)return;
 const bio=$('bio').value.trim(),experience=Number($('experience').value),phone=$('phone').value.trim().replace(/[\s\-()]/g,'');
 if(bio.length>800){note('აღწერა 800 სიმბოლოზე ნაკლები უნდა იყოს.',true);return;}
 if(!Number.isInteger(experience)||experience<0||experience>70){note('გამოცდილება უნდა იყოს 0-70 წელი.',true);return;}
 if(phone&&!/^\+?\d{9,15}$/.test(phone)){note('ნომრის მაგალითი: +9955XXXXXXXX (9–15 ციფრი).',true);return;}
 $('save').disabled=true;try{
  await dbSDK.updateDoc(dbSDK.doc(db,'workerProfiles',uid),{bio,experienceYears:experience,updatedAt:dbSDK.serverTimestamp()});
  await dbSDK.setDoc(dbSDK.doc(db,'workerContacts',uid),{phone,updatedAt:dbSDK.serverTimestamp()});
  profile={...profile,bio,experienceYears:experience};note('✅ აღწერა, გამოცდილება და ტელეფონის ნომერი შენახულია.');
 }catch(err){console.error(err);note('მონაცემები ბოლომდე ვერ შეინახა. შეამოწმე Firestore-ის წესები.',true);}finally{$('save').disabled=false;}
};
function renderAvatar(){const url=validImage(profile?.photoURL);if(!url)return;const img=document.createElement('img');img.src=url;img.alt='პროფილის ფოტო';$('avatar').replaceChildren(img);}
function renderGallery(){const slots=Array.isArray(profile?.gallery)?profile.gallery:[];const area=$('photos');area.replaceChildren();for(let i=0;i<5;i++){
 const box=document.createElement('div');box.className='photo-slot';const url=validImage(slots[i]);
 if(url){const im=document.createElement('img');im.src=url;im.loading='lazy';im.alt='სამუშაოს ფოტო '+(i+1);box.append(im);
 const b=document.createElement('button');b.type='button';b.className='btn soft';b.textContent='წაშლა';b.onclick=()=>removePhoto(i,b);box.append(b);
 }else{const txt=document.createElement('div');txt.className='empty';txt.textContent=(i+1)+'. ცარიელი ადგილი';box.append(txt);}
 area.append(box);
}}
async function toJpeg(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)throw new Error('აირჩიე JPG/PNG/WebP ფოტო მაქსიმუმ 12 MB-მდე.');
 const bitmap=await createImageBitmap(file);const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(bitmap.width*scale));canvas.height=Math.max(1,Math.floor(bitmap.height*scale));
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(new Error('ფოტოს დამუშავება ვერ მოხერხდა.')),'image/jpeg',0.82));
 if(blob.size>4*1024*1024)throw new Error('ფოტო მეტისმეტად დიდია. სცადე უფრო პატარა სურათი.');return blob;
}
async function upload(slot){
 if(!uid||!profile)return;
 const isAvatar=slot==='avatar';const input=$(isAvatar?'avatarFile':'workFile'),file=input.files?.[0];
 if(!file){note('ჯერ აირჩიე ფოტო.',true);return;}
 const btn=$(isAvatar?'uploadAvatar':'uploadWork');btn.disabled=true;note('ფოტოს ვამუშავებ და ვტვირთავ...');
 try{
  const blob=await toJpeg(file),path='workerPhotos/'+uid+'/'+(isAvatar?'avatar.jpg':'work-'+(slot+1)+'.jpg');
  const ref=storageSDK.ref(storage,path);await storageSDK.uploadBytes(ref,blob,{contentType:'image/jpeg'});
  const url=await storageSDK.getDownloadURL(ref);
  if(isAvatar){await dbSDK.updateDoc(dbSDK.doc(db,'workerProfiles',uid),{photoURL:url,updatedAt:dbSDK.serverTimestamp()});profile.photoURL=url;renderAvatar();}
  else{const a=Array.isArray(profile.gallery)?[...profile.gallery]:[];while(a.length<=slot)a.push('');a[slot]=url;await dbSDK.updateDoc(dbSDK.doc(db,'workerProfiles',uid),{gallery:a,updatedAt:dbSDK.serverTimestamp()});profile.gallery=a;renderGallery();}
  input.value='';note('✅ ფოტო წარმატებით აიტვირთა.');
 }catch(e){console.error(e);note('ფოტო ვერ აიტვირთა. ჯერ Firebase Storage უნდა იყოს ჩართული და storage.rules გამოქვეყნებული. დეტალი: '+(e.code||e.message),true);}finally{btn.disabled=false;}
}
$('uploadAvatar').onclick=()=>upload('avatar');
$('uploadWork').onclick=()=>{const a=Array.isArray(profile?.gallery)?profile.gallery:[];let slot=-1;for(let i=0;i<5;i++){if(!a[i]){slot=i;break;}}if(slot<0){note('FREE პაკეტში მაქსიმუმ 5 სამუშაოს ფოტო შეიძლება. წაშალე რომელიმე და შემდეგ ატვირთე ახალი.',true);return;}upload(slot);};
async function removePhoto(i,btn){if(!uid)return;if(!confirm('წავშალოთ ეს ფოტო?'))return;btn.disabled=true;
 try{const a=[...(profile.gallery||[])];a[i]='';await dbSDK.updateDoc(dbSDK.doc(db,'workerProfiles',uid),{gallery:a,updatedAt:dbSDK.serverTimestamp()});profile.gallery=a;renderGallery();await storageSDK.deleteObject(storageSDK.ref(storage,'workerPhotos/'+uid+'/work-'+(i+1)+'.jpg')).catch(e=>console.warn('Storage delete failed',e));note('ფოტო ამოღებულია პროფილიდან.');}catch(e){console.error(e);note('ფოტო ვერ წაიშალა.',true);btn.disabled=false;}
}
async function loadStats(){try{
 const [a,b]=await Promise.all(['views','clicks'].map(kind=>dbSDK.getCountFromServer(dbSDK.collection(db,'workerInteractions',uid,kind))));
 $('views').textContent=a.data().count.toLocaleString('ka-GE');$('clicks').textContent=b.data().count.toLocaleString('ka-GE');
 }catch(e){console.warn('Stats count unavailable',e.code||e.message);$('views').textContent='—';$('clicks').textContent='—';}}
