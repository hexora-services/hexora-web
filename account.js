import {firebaseConfig, configured} from './firebase-config.js';
const $=id=>document.getElementById(id);
const cities=['თბილისი','ბათუმი','ქუთაისი','რუსთავი','გორი','ზუგდიდი','ფოთი','ხაშური','სამტრედია','სენაკი','ზესტაფონი','თელავი','საგარეჯო','მცხეთა','ახალციხე','ქობულეთი','ოზურგეთი','გურჯაანი','სიღნაღი','ლაგოდეხი','ახმეტა','ყვარელი','მარნეული','ბოლნისი','გარდაბანი','ბორჯომი','დუშეთი','კასპი','წალკა','მესტია','ამბროლაური','ლანჩხუთი','საჩხერე','ჭიათურა','სხვა ქალაქი'];
const categories=["გათბობა და გაგრილება","ელექტრიკოსი","სანტექნიკოსი","რემონტი და მშენებლობა","ავტოსერვისი","კონდიციონერები","დასუფთავება","ტექნიკის შეკეთება","გადაზიდვა","ეზო და ბაღი","კარ-ფანჯარა","კომპიუტერის სერვისი","ავეჯის აწყობა და შეკეთება","სახურავი და ფასადი","შედუღება და ლითონი","საკეტები და კარები","კამერები და სიგნალიზაცია","ავტოდახმარება გზაზე","კურიერი და მიტანა","ღონისძიებები და ფოტო/ვიდეო","სილამაზე და მოვლა","შინაური ცხოველების მოვლა","მობილურისა და გაჯეტების სერვისი","დიზაინი და პროექტირება"];
const subs=[["გათბობის ქვაბის ხელოსანი","ქვაბის მონტაჟი","ქვაბის დიაგნოსტიკა","გათბობის სისტემის გამორეცხვა","რადიატორების მონტაჟი","იატაკქვეშა გათბობა","კონდიციონერის მონტაჟი","კონდიციონერის შეკეთება"],["ელექტროგაყვანილობის შეკეთება","როზეტები და ჩამრთველები","განათების მონტაჟი","ავტომატებისა და ფარის მონტაჟი","ელექტრო დიაგნოსტიკა"],["წყლის მილების შეკეთება","ონკანებისა და ნიჟარის მონტაჟი","კანალიზაციის გაწმენდა","უნიტაზის მონტაჟი","წყლის გაჟონვის აღმოფხვრა"],["კედლების შეღებვა","კაფელის და მეტლახის დაგება","გიფსოკარდონის სამუშაოები","შპაკლვა და ლესვა","იატაკის მოწყობა","ბინის სრული რემონტი"],["ავტომობილის დიაგნოსტიკა","ძრავის შეკეთება","სავალი ნაწილის შეკეთება","ელექტროობა ავტომობილზე","ზეთისა და ფილტრების შეცვლა"],["კონდიციონერის მონტაჟი","კონდიციონერის შეკეთება","კონდიციონერის წმენდა","ფრეონის შემოწმება"],["ბინის დალაგება","ოფისის დასუფთავება","რემონტის შემდგომი დასუფთავება","ფანჯრების რეცხვა"],["სარეცხი მანქანის შეკეთება","მაცივრის შეკეთება","ჭურჭლის სარეცხის შეკეთება","გაზქურის შეკეთება","ღუმლის შეკეთება"],["ავეჯის გადაზიდვა","ბინის გადატანა","სამშენებლო მასალების გადაზიდვა","ტვირთის აწევა და ჩამოტვირთვა"],["ბალახის გაკრეჭა","ხეების გასხვლა","ეზოს დასუფთავება","ბაღის მოვლა","სარწყავი სისტემის მოწყობა"],["ფანჯრის შეკეთება","კარის მონტაჟი","საკეტის შეკეთება","ალუმინის კარ-ფანჯარა","პლასტმასის კარ-ფანჯარა"],["კომპიუტერის დიაგნოსტიკა","ლეპტოპის შეკეთება","Windows-ის დაყენება","ინტერნეტისა და ქსელის გამართვა","პრინტერის შეკეთება"],["ავეჯის აწყობა","კარადის მონტაჟი","სამზარეულოს ავეჯის მონტაჟი","ავეჯის შეკეთება","რბილი ავეჯის რესტავრაცია","ავეჯის დამზადება"],["სახურავის შეკეთება","სახურავის გადახურვა","წყალსაწრეტი სისტემის მონტაჟი","ფასადის მოპირკეთება","გარე თბოიზოლაცია","აივნის შეკეთება"],["შედუღების სამუშაოები","ლითონის კარების დამზადება","მოაჯირების მონტაჟი","ჭიშკრის დამზადება","ლითონის კონსტრუქციები"],["საკეტის გამოცვლა","კარის საკეტის შეკეთება","კარის რეგულირება","ჭიშკრის ავტომატიკის მონტაჟი","კარის სახელურების შეკეთება"],["სამეთვალყურეო კამერების მონტაჟი","კამერების შეკეთება","სიგნალიზაციის მონტაჟი","უსაფრთხოების სისტემის დიაგნოსტიკა","დომოფონის მონტაჟი"],["ევაკუატორის გამოძახება","აკუმულატორის დახმარება","საბურავის ადგილზე შეცვლა","მობილური ავტოდიაგნოსტიკა","ავტომობილის ადგილზე მომსახურება"],["ამანათების მიტანა","დოკუმენტების მიწოდება","სასწრაფო კურიერი","ნივთების მიტანა","შეკვეთების კურიერული მომსახურება"],["ფოტოგრაფი","ვიდეოგრაფი","ღონისძიების წამყვანი","ღონისძიების დეკორატორი","ხმის აპარატურის მომსახურება","ღონისძიების ორგანიზება"],["პარიკმახერი","ვიზაჟისტი","მანიკიური და პედიკიური","სტილისტი","მაკიაჟი ადგილზე"],["ცხოველების გრუმინგი","ძაღლის გასეირნება","შინაური ცხოველის დროებითი მოვლა","ცხოველის ტრანსპორტირება","ვეტერინარის ვიზიტი"],["ტელეფონის ეკრანის შეკეთება","ტელეფონის ელემენტის შეცვლა","დამტენის პორტის შეკეთება","ტაბლეტის შეკეთება","ჭკვიანი საათის შეკეთება"],["ინტერიერის დიზაინი","აზომვა და ნახაზები","არქიტექტურული პროექტირება","3D ვიზუალიზაცია","ლანდშაფტის დიზაინი","ავეჯის პროექტირება"]];
let selectedRole='customer', mode='register',auth,firestore,user,account,profile, sdk;
let registrationInProgress=false;
const msg=(text,good=false)=>{const n=$('message');n.textContent=text;n.classList.add('show');n.classList.toggle('good',good);if(good) n.scrollIntoView({block:'nearest',behavior:'smooth'});};
const clearMsg=()=>{$('message').classList.remove('show','good');$('message').textContent='';};
function options(id,values){$(id).replaceChildren(...values.map((s,i)=>{const x=document.createElement('option');x.value=id.toLowerCase().includes('category')?String(i):s;x.textContent=s;return x;}));}
function setSub(catId,subId,preferred){const i=Number($(catId).value);$(subId).replaceChildren(...(subs[i]||[]).map(s=>{const x=document.createElement('option');x.value=s;x.textContent=s;return x;}));if(preferred && (subs[i]||[]).includes(preferred))$(subId).value=preferred;}
for(const id of ['registerCity','profileCity'])options(id,cities);
for(const id of ['registerCategory','profileCategory'])options(id,categories);
$('registerCategory').onchange=()=>setSub('registerCategory','registerSubcategory');
$('profileCategory').onchange=()=>setSub('profileCategory','profileSubcategory');
setSub('registerCategory','registerSubcategory');setSub('profileCategory','profileSubcategory');
function setRole(role){selectedRole=role;document.querySelectorAll('[data-role]').forEach(b=>b.classList.toggle('selected',b.dataset.role===role));$('workerFields').classList.toggle('hidden',role!=='worker');$('registerFee').required=role==='worker';}
document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>setRole(b.dataset.role));
function setMode(next){mode=next;clearMsg();$('modeRegister').classList.toggle('selected',mode==='register');$('modeLogin').classList.toggle('selected',mode==='login');$('registerForm').classList.toggle('hidden',mode!=='register');$('loginForm').classList.toggle('hidden',mode!=='login');}
$('modeRegister').onclick=()=>setMode('register');$('modeLogin').onclick=()=>setMode('login');
function errorText(e){const code=e?.code||'';const mapping={'auth/email-already-in-use':'ეს ელფოსტა უკვე რეგისტრირებულია. სცადე შესვლა.','auth/invalid-email':'ელფოსტის მისამართი არასწორია.','auth/weak-password':'აირჩიე უფრო ძლიერი პაროლი.','auth/invalid-credential':'ელფოსტა ან პაროლი არასწორია.','auth/too-many-requests':'ბევრი მცდელობაა. მოგვიანებით სცადე.','auth/network-request-failed':'ინტერნეტკავშირი გადაამოწმე.','permission-denied':'Firebase-ის წვდომის წესები შესამოწმებელია.','auth/unauthorized-domain':'Firebase Authentication → Settings → Authorized domains-ში დაამატე hexora-services.github.io.'};return mapping[code]||`ოპერაცია ვერ შესრულდა (${code||e.message||'უცნობი შეცდომა'}).`;}
function withBusy(btn,task){const old=btn.textContent;btn.disabled=true;btn.textContent='გთხოვ, დაელოდე...';return Promise.resolve().then(task).catch(e=>msg(errorText(e))).finally(()=>{btn.disabled=false;btn.textContent=old;});}
$('registerForm').addEventListener('submit',e=>{e.preventDefault();if(!configured)return msg('ჯერ Firebase უნდა დავაკავშიროთ.');withBusy($('registerBtn'),async()=>{clearMsg();const name=$('registerName').value.trim(),email=$('registerEmail').value.trim(),password=$('registerPassword').value,repeat=$('confirmPassword').value;if(name.length<2||name.length>60)return msg('სახელი 2–60 სიმბოლო უნდა იყოს.');if(password.length<8||password.length>128)return msg('პაროლი უნდა იყოს 8–128 სიმბოლო.');if(password!==repeat)return msg('პაროლები ერთმანეთს არ ემთხვევა.');const fee=Number($('registerFee').value);if(selectedRole==='worker'&&(!Number.isInteger(fee)||fee<1||fee>2000))return msg('ვიზიტის ფასი მიუთითე 1–2000 ₾.');registrationInProgress=true;try{const credential=await sdk.createUserWithEmailAndPassword(auth,email,password);user=credential.user;await sdk.updateProfile(user,{displayName:name});const data={displayName:name,role:selectedRole,createdAt:sdk.serverTimestamp()};await sdk.setDoc(sdk.doc(firestore,'accounts',user.uid),data);if(selectedRole==='worker')await sdk.setDoc(sdk.doc(firestore,'workerProfiles',user.uid),{displayName:name,city:$('registerCity').value,category:Number($('registerCategory').value),subcategory:$('registerSubcategory').value,visitFee:fee,online:false,approved:false,updatedAt:sdk.serverTimestamp()});await sdk.sendEmailVerification(user);msg('ანგარიში შეიქმნა! ელფოსტაზე გაიგზავნა დადასტურების წერილი.',true);await loadDashboard(user);}finally{registrationInProgress=false;}});});
$('loginForm').addEventListener('submit',e=>{e.preventDefault();if(!configured)return;withBusy($('loginBtn'),async()=>{clearMsg();await sdk.signInWithEmailAndPassword(auth,$('loginEmail').value.trim(),$('loginPassword').value);});});
$('resetPassword').onclick=()=>{if(!configured)return;const email=$('loginEmail').value.trim();if(!email)return msg('ჯერ ჩაწერე ელფოსტა შესვლის ველში.');withBusy($('resetPassword'),async()=>{await sdk.sendPasswordResetEmail(auth,email);msg('თუ ანგარიში არსებობს, პაროლის აღდგენის წერილი გაიგზავნა.',true);});};

// Account email correction: reauthenticate with the existing password, then confirm the new inbox.
const emailChangeForm=$('changeEmailForm');
function showEmailChangeMessage(text,good=false){
 const el=$('emailChangeResult');el.textContent=text;
 el.className='email-change-result show '+(good?'ok':'error');
}
function emailChangeError(err){
 const code=err?.code||'';
 const messages={
  'auth/invalid-email':'ახალი ელფოსტის მისამართი არასწორია.',
  'auth/email-already-in-use':'ეს ელფოსტა უკვე გამოყენებულია სხვა ანგარიშზე.',
  'auth/invalid-credential':'პაროლი არასწორია. შეამოწმე და ხელახლა სცადე.',
  'auth/wrong-password':'პაროლი არასწორია. შეამოწმე და ხელახლა სცადე.',
  'auth/too-many-requests':'ბევრი მცდელობაა. მოგვიანებით სცადე.',
  'auth/requires-recent-login':'ხელახლა შედი HEXORA-ში და კვლავ სცადე.',
  'auth/network-request-failed':'ინტერნეტთან კავშირი გადაამოწმე.',
  'auth/operation-not-allowed':'ელფოსტის შეცვლა Firebase-ში შეზღუდულია. ადმინისტრატორს შეატყობინე.',
  'auth/unauthorized-continue-uri':'Firebase-ში საიტის დომენი დასამატებელია.',
  'auth/invalid-continue-uri':'დადასტურების ბმულის პარამეტრი არასწორია.',
  'auth/invalid-api-key':'Firebase-ის კონფიგურაცია გასასწორებელია.',
  'auth/user-token-expired':'ხელახლა შედი ანგარიშში და სცადე.'
 };
 return messages[code] || ('ელფოსტის შეცვლა ვერ შესრულდა. '+(code?'შეცდომა: '+code:'ხელახლა სცადე.'));
}
function collapseEmailChange(){
 emailChangeForm.classList.add('hidden');
 $('toggleEmailChange').setAttribute('aria-expanded','false');
 $('confirmEmailPassword').value='';
}
$('toggleEmailChange').onclick=()=>{
 const open=emailChangeForm.classList.contains('hidden');
 emailChangeForm.classList.toggle('hidden',!open);
 $('toggleEmailChange').setAttribute('aria-expanded',String(open));
 if(open){$('newAccountEmail').focus();}
 else collapseEmailChange();
};
$('cancelEmailChange').onclick=collapseEmailChange;
emailChangeForm.addEventListener('submit',async e=>{
 e.preventDefault();
 const current=auth?.currentUser;
 if(!current||!sdk){showEmailChangeMessage('ჯერ შედი HEXORA-ს ანგარიშში.');return;}
 const newEmail=$('newAccountEmail').value.trim();
 const password=$('confirmEmailPassword').value;
 if(!newEmail||!password){showEmailChangeMessage('შეავსე ორივე ველი.');return;}
 if(current.email?.toLowerCase()===newEmail.toLowerCase()){
  showEmailChangeMessage('ეს ელფოსტა უკვე მითითებულია ანგარიშზე. ჩაწერე ახალი მისამართი.');return;
 }
 const button=$('saveNewEmail');button.disabled=true;
 const label=button.textContent;button.textContent='იგზავნება...';
 try{
  const credential=sdk.EmailAuthProvider.credential(current.email,password);
  await sdk.reauthenticateWithCredential(current,credential);
  await sdk.verifyBeforeUpdateEmail(current,newEmail);
  showEmailChangeMessage('✅ ახალი ელფოსტის დასადასტურებელი წერილი გაიგზავნა. გახსენი ახალი ფოსტა (Spam-იც შეამოწმე), დააჭირე ბმულს და შემდეგ დაბრუნდი HEXORA-ში. მანამდე ძველი ელფოსტა მოქმედებს.',true);
  $('newAccountEmail').value='';
  collapseEmailChange();
 }catch(err){console.warn('HEXORA email update:',err?.code||'unknown');showEmailChangeMessage(emailChangeError(err));}
 finally{button.disabled=false;button.textContent=label;$('confirmEmailPassword').value='';}
});

$('logout').onclick=()=>{sdk.signOut(auth).catch(e=>msg(errorText(e)));};
$('sendVerification').onclick=()=>{withBusy($('sendVerification'),async()=>{await sdk.sendEmailVerification(auth.currentUser);msg('დადასტურების წერილი გაიგზავნა.',true);});};
$('reloadVerification').onclick=()=>{withBusy($('reloadVerification'),async()=>{await auth.currentUser.reload();await loadDashboard(auth.currentUser);msg('დადასტურების სტატუსი განახლებულია.',true);});};
async function loadDashboard(current){user=current;const snap=await sdk.getDoc(sdk.doc(firestore,'accounts',current.uid));if(!snap.exists())throw new Error('ანგარიშის ჩანაწერი ვერ მოიძებნა. თუ რეგისტრაცია შეწყდა, დაგვიკავშირდი მხარდაჭერასთან.');account=snap.data();$('loading').classList.add('hidden');$('anonymous').classList.add('hidden');$('signed').classList.remove('hidden');$('greeting').textContent='გამარჯობა, '+(account.displayName||current.displayName||'მომხმარებელო')+'!';$('identityEmail').textContent=current.email||'';$('rolePill').textContent=account.role==='worker'?'🧰 ხელოსანი':'👤 მომხმარებელი';$('emailVerify').classList.toggle('hidden',!!current.emailVerified);$('customerPanel').classList.toggle('hidden',account.role!=='customer');$('workerPanel').classList.toggle('hidden',account.role!=='worker');if(account.role==='worker'){const ps=await sdk.getDoc(sdk.doc(firestore,'workerProfiles',current.uid));if(ps.exists()){profile=ps.data();$('profileName').value=profile.displayName||'';$('profileCity').value=profile.city||cities[0];$('profileCategory').value=String(profile.category??0);setSub('profileCategory','profileSubcategory',profile.subcategory);$('profileFee').value=profile.visitFee??25;$('profileOnline').value=String(!!profile.online);$('approvalStatus').textContent=profile.approved?'✅ პროფილი დამტკიცებულია. სამუშაო რეჟიმის ჩართვა შეგიძლია.':'⏳ პროფილი შემოწმებას ელოდება. საჯარო სიაში ჯერ არ გამოჩნდება.'; }else{$('approvalStatus').textContent='პროფილის შექმნა ვერ დასრულდა. დაუკავშირდი ადმინისტრატორს.';}}}
$('workerProfileForm').addEventListener('submit',e=>{e.preventDefault();if(!configured||!user||account?.role!=='worker'||!profile)return;withBusy($('profileSave'),async()=>{const fee=Number($('profileFee').value),name=$('profileName').value.trim();if(!Number.isInteger(fee)||fee<1||fee>2000)return msg('ვიზიტის ფასი უნდა იყოს 1–2000 ₾.');if(name.length<2||name.length>60)return msg('სახელი უნდა იყოს 2–60 სიმბოლო.');await sdk.updateDoc(sdk.doc(firestore,'workerProfiles',user.uid),{displayName:name,city:$('profileCity').value,category:Number($('profileCategory').value),subcategory:$('profileSubcategory').value,visitFee:fee,online:$('profileOnline').value==='true',updatedAt:sdk.serverTimestamp()});profile={...profile,displayName:name,city:$('profileCity').value,category:Number($('profileCategory').value),subcategory:$('profileSubcategory').value,visitFee:fee,online:$('profileOnline').value==='true'};msg('ხელოსნის პროფილი შენახულია.',true);});});
async function init(){if(!configured){$('loading').classList.add('hidden');$('setup').hidden=false;$('anonymous').classList.remove('hidden');$('registerBtn').disabled=true;$('loginBtn').disabled=true;$('resetPassword').disabled=true;return;}try{const [appModule,authModule,fireModule]=await Promise.all([import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js')]);sdk={...authModule,...fireModule};const app=appModule.initializeApp(firebaseConfig);auth=authModule.getAuth(app);firestore=fireModule.getFirestore(app);authModule.onAuthStateChanged(auth,async(current)=>{if(registrationInProgress)return;clearMsg();$('loading').classList.add('hidden');if(current){try{await loadDashboard(current)}catch(e){$('signed').classList.add('hidden');$('anonymous').classList.remove('hidden');msg(errorText(e));}}else{$('emailChangeResult').className='email-change-result';$('emailChangeResult').textContent='';collapseEmailChange();user=null;account=null;profile=null;$('anonymous').classList.remove('hidden');$('signed').classList.add('hidden');}},e=>{$('loading').classList.add('hidden');msg(errorText(e))});}catch(e){$('loading').classList.add('hidden');msg('Firebase ვერ ჩაიტვირთა. გადაამოწმე ინტერნეტი და პროექტის პარამეტრები. '+errorText(e));}}
init();
