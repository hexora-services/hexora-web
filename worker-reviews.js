import {firebaseConfig,configured} from './firebase-config.js';
const $=id=>document.getElementById(id);
const workerUid=new URLSearchParams(location.search).get('id')||'';
const panel=$('reviewSection');
if (!configured || !/^[A-Za-z0-9_-]{20,128}$/.test(workerUid)) {
  if(panel) panel.hidden=true;
} else { void initReviews(); }

async function initReviews(){
  let selected=0,existing=false,currentUser=null,authSDK,dbSDK,auth,db;
  const notice=$('reviewNotice'),form=$('reviewForm'),submit=$('submitReview'),remove=$('removeReview');
  function tell(message,error=false){notice.hidden=false;notice.textContent=message;notice.className='notice'+(error?' error':'');}
  function choose(n){selected=n;for(const b of $('starPicker').querySelectorAll('button')){
    const active=Number(b.dataset.reviewStar)<=n;
    b.textContent=active?'★':'☆';b.classList.toggle('chosen',active);
    b.setAttribute('aria-pressed',String(Number(b.dataset.reviewStar)===n));
  }}
  $('starPicker').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.reviewStar))));
  try{
    const [appSDK,aSDK,fSDK]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')
    ]);
    authSDK=aSDK;dbSDK=fSDK;
    const app=appSDK.getApps().length?appSDK.getApp():appSDK.initializeApp(firebaseConfig);
    auth=aSDK.getAuth(app);db=fSDK.getFirestore(app);
    const profileSnap=await fSDK.getDoc(fSDK.doc(db,'workerProfiles',workerUid));
    if(!profileSnap.exists()||profileSnap.data().approved!==true){panel.hidden=true;return;}
    const user=await new Promise(resolve=>aSDK.onAuthStateChanged(auth,resolve,()=>resolve(null)));
    currentUser=user;
    let canWrite=false;
    if(!user){tell('შეფასებების ნახვა ყველას შეუძლია. შესაფასებლად შედი მომხმარებლის ანგარიშში.');
      const a=document.createElement('a');a.href='account.html';a.textContent=' შესვლა →';notice.append(a);
    }else if(user.uid===workerUid){tell('საკუთარი პროფილის შეფასება შეუძლებელია.');}
    else {
      await user.reload();
      if(!user.emailVerified){tell('შეფასებისთვის ჯერ დაადასტურე ელფოსტა და ხელახლა შედი ანგარიშში.');}
      else {
        const account=await fSDK.getDoc(fSDK.doc(db,'accounts',user.uid));
        if(account.exists()&&account.data().role==='customer'){
          canWrite=true;form.hidden=false;notice.hidden=true;
          const own=await fSDK.getDoc(fSDK.doc(db,'workerReviews',workerUid,'items',user.uid));
          if(own.exists()){
            existing=true;const data=own.data();choose(data.rating);$('reviewComment').value=data.comment||'';
            submit.textContent='შეფასების განახლება';remove.hidden=false;
          }
        }else{tell('შეფასების დატოვება შესაძლებელია მომხმარებლის ანგარიშით. ხელოსნის ანგარიშით შეფასება არ შეიძლება.');}
      }
    }
    await refresh();
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(!canWrite||!currentUser)return;
      if(selected<1||selected>5){tell('აირჩიე 1-დან 5-მდე ვარსკვლავი.',true);return;}
      const comment=$('reviewComment').value.trim();
      if(comment.length>300){tell('კომენტარი 300 სიმბოლოზე მოკლე უნდა იყოს.',true);return;}
      submit.disabled=true;
      try{
        await currentUser.reload();if(!currentUser.emailVerified)throw Error('ელფოსტა დასადასტურებელია.');
        const ref=fSDK.doc(db,'workerReviews',workerUid,'items',currentUser.uid);
        if(existing){await fSDK.updateDoc(ref,{rating:selected,comment,updatedAt:fSDK.serverTimestamp()});}
        else{await fSDK.setDoc(ref,{rating:selected,comment,createdAt:fSDK.serverTimestamp(),updatedAt:fSDK.serverTimestamp()});existing=true;}
        remove.hidden=false;submit.textContent='შეფასების განახლება';tell('✅ შენი შეფასება შენახულია.');
        await refresh();
      }catch(error){console.error('HEXORA review save',error);tell('შეფასება ვერ შეინახა. გადაამოწმე ელფოსტა, Firebase წესები და ინტერნეტი.',true);}
      finally{submit.disabled=false;}
    });
    remove.addEventListener('click',async()=>{
      if(!canWrite||!currentUser||!existing||!confirm('ნამდვილად გინდა შეფასების წაშლა?'))return;
      remove.disabled=true;
      try{
        await fSDK.deleteDoc(fSDK.doc(db,'workerReviews',workerUid,'items',currentUser.uid));
        existing=false;choose(0);$('reviewComment').value='';remove.hidden=true;submit.textContent='შეფასების შენახვა';tell('✅ შენი შეფასება წაიშალა.');await refresh();
      }catch(error){console.error('HEXORA review delete',error);tell('შეფასების წაშლა ვერ შესრულდა.',true);}
      finally{remove.disabled=false;}
    });
  }catch(error){console.error('HEXORA review init',error);tell('შეფასებების ჩატვირთვა ვერ მოხერხდა. გადაამოწმე Firestore-ის წესები.',true);}

  async function refresh(){
    try{
      const ref=dbSDK.collection(db,'workerReviews',workerUid,'items');
      const [aggregate,recent]=await Promise.all([
        dbSDK.getAggregateFromServer(ref,{total:dbSDK.count(),avg:dbSDK.average('rating')}),
        dbSDK.getDocs(dbSDK.query(ref,dbSDK.orderBy('updatedAt','desc'),dbSDK.limit(20)))
      ]);
      const {total,avg}=aggregate.data();
      $('reviewAverage').textContent=total&&Number.isFinite(avg)?avg.toFixed(1):'—';
      $('reviewAverageStars').textContent=total?'★'.repeat(Math.round(avg))+'☆'.repeat(5-Math.round(avg)):'☆☆☆☆☆';
      $('reviewCount').textContent=total?`${total.toLocaleString('ka-GE')} შეფასება`:'ჯერ არ არის შეფასებული';
      const list=$('reviewList');list.replaceChildren();
      if(recent.empty){const empty=document.createElement('div');empty.className='review-empty';empty.textContent='ამ ხელოსანს ჯერ არ აქვს შეფასება.';list.append(empty);return;}
      for(const doc of recent.docs){
        const r=doc.data(),article=document.createElement('article');article.className='review-entry';
        const line=document.createElement('div');line.className='review-line';
        const left=document.createElement('strong');left.textContent=doc.id===currentUser?.uid?'შენი შეფასება':'მომხმარებლის შეფასება';
        const right=document.createElement('span');right.className='review-stars';
        right.textContent='★'.repeat(Math.min(5,Math.max(0,Number(r.rating)||0)))+'☆'.repeat(5-Math.min(5,Math.max(0,Number(r.rating)||0)));
        const date=document.createElement('span');date.className='muted small';
        date.textContent=r.updatedAt?.toDate?.().toLocaleDateString('ka-GE')||'';
        line.append(left,right,date);article.append(line);
        if(r.comment){const p=document.createElement('p');p.textContent=r.comment;article.append(p);}
        list.append(article);
      }
    }catch(error){console.error('HEXORA reviews loading',error);tell('შეფასებები ვერ ჩაიტვირთა. შესაძლოა Firestore-ის წესები ჯერ არ გამოქვეყნებულა.',true);}
  }
}
