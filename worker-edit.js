import {firebaseConfig, configured} from './firebase-config.js';
const $ = id => document.getElementById(id);
const status = $('status');
let auth, db, authSDK, dbSDK, uid, profile;

function note(message, error=false){
  status.textContent=message;
  status.className='notice'+(error?' error':'');
  status.hidden=false;
}
function displayPhoto(dataUrl){
  const box=$('avatar');
  if(!box)return;
  box.replaceChildren();
  if(typeof dataUrl==='string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(dataUrl)){
    const img=document.createElement('img');
    img.alt='ხელოსნის პროფილის ფოტო';
    img.src=dataUrl;
    box.append(img);
  }else{
    box.textContent='👷';
  }
}
function setUpOnePhotoUI(){
  // Hide the old Firebase Storage five-photo uploader; no Storage is used.
  const gallery=$('uploadWork')?.closest('section');
  if(gallery)gallery.hidden=true;
  const avatarSection=$('uploadAvatar')?.closest('section');
  if(avatarSection){
    const title=avatarSection.querySelector('h2');
    if(title)title.textContent='ერთი პროფილის ფოტო';
    const help=document.createElement('p');
    help.className='muted small';
    help.textContent='უფასო საცდელი ვერსია: ერთი ფოტო. სურათი ავტომატურად დაპატარავდება და Firestore-ში შეინახება. შეგიძლია ნებისმიერ დროს შეცვალო.';
    avatarSection.append(help);
    const remove=document.createElement('button');
    remove.type='button';remove.id='removeAvatar';remove.className='btn soft';
    remove.style.marginTop='10px';remove.textContent='ფოტოს წაშლა';
    avatarSection.append(remove);
    remove.onclick=removePhoto;
  }
  const intro=document.querySelector('main.wrap > section.card p.muted');
  if(intro)intro.innerHTML='აქედან შეცვლი აღწერას, ნომერსა და ერთ პროფილის ფოტოს. ქალაქი, სპეციალობა და ფასი შეგიძლია შეცვალო <a href="account.html">ჩემს ანგარიშში</a>.';
}
setUpOnePhotoUI();
if(!configured){note('Firebase ჯერ არ არის დაკავშირებული.',true);} else init();

async function init(){
 try{
   const [appSDK,aSDK,fSDK]=await Promise.all([
     import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
     import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
     import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')
   ]);
   const app=appSDK.getApps().length?appSDK.getApp():appSDK.initializeApp(firebaseConfig);
   authSDK=aSDK;dbSDK=fSDK;auth=aSDK.getAuth(app);db=fSDK.getFirestore(app);
   aSDK.onAuthStateChanged(auth,async user=>{
     $('editor').hidden=true;uid=null;profile=null;
     if(!user){
       note('ჯერ შედი HEXORA-ს ანგარიშში.');
       const a=document.createElement('a');a.href='account.html';a.textContent=' შესვლა / რეგისტრაცია →';status.append(a);
       return;
     }
     uid=user.uid;
     try{
       const acc=await fSDK.getDoc(fSDK.doc(db,'accounts',uid));
       if(!acc.exists()||acc.data().role!=='worker'){
         note('ამ გვერდზე მხოლოდ ხელოსნის ანგარიშით შეგიძლია ფოტოს დამატება.',true);return;
       }
       const snap=await fSDK.getDoc(fSDK.doc(db,'workerProfiles',uid));
       if(!snap.exists()){note('ხელოსნის პროფილი ვერ მოიძებნა. გადაამოწმე რეგისტრაცია.',true);return;}
       profile=snap.data();
       $('editor').hidden=false;
       $('previewLink').hidden=false;
       $('previewLink').href='worker.html?id='+encodeURIComponent(uid);
       $('bio').value=profile.bio||'';
       $('experience').value=profile.experienceYears??0;
       const contact=await fSDK.getDoc(fSDK.doc(db,'workerContacts',uid));
       $('phone').value=contact.exists()?contact.data().phone||'':'';
       const pic=await fSDK.getDoc(fSDK.doc(db,'workerImages',uid));
       displayPhoto(pic.exists()?pic.data().dataUrl:null);
       note(profile.approved?'✅ დამტკიცებული პროფილი. ფოტო საჯაროდ ჩანს.':'⏳ პროფილი დამტკიცებას ელოდება. ფოტო დამტკიცების შემდეგ გამოჩნდება.');
       void loadStats();
     }catch(e){console.error(e);note('პროფილი ვერ ჩაიტვირთა. შეამოწმე ახალი Firestore Rules.',true);}
   });
 }catch(e){console.error(e);note('Firebase ვერ ჩაიტვირთა. გადაამოწმე კავშირი.',true);}
}

$('profileForm').onsubmit=async e=>{
 e.preventDefault();if(!uid||!profile)return;
 const bio=$('bio').value.trim(),years=Number($('experience').value),phone=$('phone').value.trim().replace(/[\s\-()]/g,'');
 if(bio.length>800){note('აღწერა მაქსიმუმ 800 სიმბოლო უნდა იყოს.',true);return;}
 if(!Number.isInteger(years)||years<0||years>70){note('გამოცდილება 0-70 წელი უნდა იყოს.',true);return;}
 if(phone&&!/^\+?\d{9,15}$/.test(phone)){note('ტელეფონის ფორმატი არასწორია. მაგალითად: +9955XXXXXXXX',true);return;}
 $('save').disabled=true;
 try{
   await dbSDK.updateDoc(dbSDK.doc(db,'workerProfiles',uid),{bio,experienceYears:years,updatedAt:dbSDK.serverTimestamp()});
   await dbSDK.setDoc(dbSDK.doc(db,'workerContacts',uid),{phone,updatedAt:dbSDK.serverTimestamp()});
   profile={...profile,bio,experienceYears:years};note('✅ აღწერა და ტელეფონის ნომერი შენახულია.');
 }catch(e){console.error(e);note('მონაცემების შენახვა ვერ მოხერხდა. შეამოწმე Firestore Rules.',true);}
 finally{$('save').disabled=false;}
};

async function fileToSmallDataUrl(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)
   throw new Error('აირჩიე JPG, PNG ან WebP ფოტო 12 MB-მდე.');
 let bitmap;
 try{bitmap=await createImageBitmap(file);}catch{throw new Error('სურათის გახსნა ვერ მოხერხდა. სცადე სხვა ფოტო.');}
 try{
   let maxEdge=520;
   for(let attempt=0;attempt<10;attempt++){
     const scale=Math.min(1,maxEdge/Math.max(bitmap.width,bitmap.height));
     const canvas=document.createElement('canvas');
     canvas.width=Math.max(1,Math.round(bitmap.width*scale));
     canvas.height=Math.max(1,Math.round(bitmap.height*scale));
     const ctx=canvas.getContext('2d');
     if(!ctx)throw new Error('სურათის დამუშავება ამ ტელეფონზე ვერ მოხერხდა.');
     ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
     ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
     const quality=Math.max(.42,.74-attempt*.04);
     const result=canvas.toDataURL('image/jpeg',quality);
     if(result.length<=96000) return result;
     maxEdge=Math.max(220,Math.round(maxEdge*.82));
   }
   throw new Error('ფოტო ზედმეტად დიდია. სცადე უფრო უბრალო სურათი.');
 }finally{bitmap.close?.();}
}

$('uploadAvatar').onclick=async()=>{
 if(!uid||!profile)return;
 const file=$('avatarFile')?.files?.[0];
 if(!file){note('ჯერ აირჩიე ფოტო.',true);return;}
 const button=$('uploadAvatar');button.disabled=true;note('ფოტო მცირდება და ინახება...');
 try{
   const dataUrl=await fileToSmallDataUrl(file);
   await dbSDK.setDoc(dbSDK.doc(db,'workerImages',uid),{dataUrl,updatedAt:dbSDK.serverTimestamp()});
   displayPhoto(dataUrl);$('avatarFile').value='';
   note('✅ ფოტო შენახულია. ახალი ფოტოს ატვირთვით ძველს ჩაანაცვლებ.');
 }catch(e){console.error(e);note('ფოტო ვერ შეინახა: '+(e.code==='permission-denied'?'Firestore Rules ჯერ არ განახლებულა.':e.message||e.code),true);}
 finally{button.disabled=false;}
};
async function removePhoto(){
 if(!uid||!confirm('გინდა პროფილის ფოტოს წაშლა?'))return;
 const button=$('removeAvatar');button.disabled=true;
 try{
   await dbSDK.deleteDoc(dbSDK.doc(db,'workerImages',uid));
   displayPhoto(null);note('✅ ფოტო წაიშალა.');
 }catch(e){console.error(e);note('ფოტოს წაშლა ვერ შესრულდა.',true);}
 finally{button.disabled=false;}
}
async function loadStats(){
 try{
   const [views,clicks]=await Promise.all(['views','clicks'].map(kind=>dbSDK.getCountFromServer(dbSDK.collection(db,'workerInteractions',uid,kind))));
   $('views').textContent=views.data().count.toLocaleString('ka-GE');
   $('clicks').textContent=clicks.data().count.toLocaleString('ka-GE');
 }catch(e){console.warn(e);$('views').textContent='—';$('clicks').textContent='—';}
}
