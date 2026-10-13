import {firebaseConfig,configured} from './firebase-config.js';
const $=id=>document.getElementById(id);
const notice=$('notice');
function show(message,error=false){notice.textContent=message;notice.className='notice show'+(error?' error':'');}
function errorMessage(err){
 const code=err?.code||'';
 const errors={
  'auth/invalid-email':'ახალი ელფოსტა არასწორადაა ჩაწერილი.',
  'auth/email-already-in-use':'ახალი ელფოსტა უკვე სხვა ანგარიშს ეკუთვნის.',
  'auth/wrong-password':'მიმდინარე პაროლი არასწორია.',
  'auth/invalid-credential':'მიმდინარე პაროლი არასწორია.',
  'auth/too-many-requests':'ბევრი მცდელობა იყო. ცოტა ხანში სცადე.',
  'auth/requires-recent-login':'ხელახლა შედი შენს ანგარიშში და სცადე.',
  'auth/network-request-failed':'ინტერნეტთან კავშირი გადაამოწმე.',
  'auth/operation-not-allowed':'Firebase-ის პარამეტრებში ელფოსტის შეცვლა შეზღუდულია.',
  'auth/unauthorized-continue-uri':'Firebase-ში საიტის დომენი არ არის ავტორიზებული.',
  'auth/user-token-expired':'ხელახლა შედი HEXORA-ში.'
 };
 return errors[code]||'ელფოსტის შეცვლა ვერ შესრულდა. '+(code?'კოდი: '+code:'ცადე ხელახლა.');
}
if(!configured){$('loading').hidden=true;show('Firebase არ არის დაკავშირებული.',true);}else init();
async function init(){
 try{
  const [appSDK,a]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js')
  ]);
  const app=appSDK.getApps().length?appSDK.getApp():appSDK.initializeApp(firebaseConfig);
  const auth=a.getAuth(app);
  a.onAuthStateChanged(auth,user=>{
   $('loading').hidden=true;
   $('signedin').hidden=!user;
   $('signedout').hidden=!!user;
   if(user)$('currentEmail').textContent=user.email||'—';
  },err=>{$('loading').hidden=true;show(errorMessage(err),true)});
  $('emailForm').addEventListener('submit',async event=>{
   event.preventDefault();
   const user=auth.currentUser;
   if(!user){show('ჯერ შედი HEXORA-ს ანგარიშში.',true);return;}
   const email=$('newEmail').value.trim();
   const password=$('password').value;
   if(email.toLowerCase()===String(user.email||'').toLowerCase()){show('ეს უკვე შენი მიმდინარე მისამართია. ჩაწერე ახალი.',true);return;}
   const btn=$('submit');btn.disabled=true;
   const caption=btn.textContent;btn.textContent='იგზავნება…';
   try{
    await a.reauthenticateWithCredential(user,a.EmailAuthProvider.credential(user.email,password));
    await a.verifyBeforeUpdateEmail(user,email);
    $('newEmail').value='';
    show('✅ წერილი გაიგზავნა ახალ ელფოსტაზე. შეამოწმე Inbox და Spam, გახსენი ბმული და დაადასტურე. შემდეგ დაბრუნდი ამ გვერდზე და დააჭირე სტატუსის განახლებას.');
   }catch(err){console.warn('HEXORA email correction',err?.code||'unknown');show(errorMessage(err),true)}
   finally{btn.disabled=false;btn.textContent=caption;$('password').value='';}
  });
  $('refresh').onclick=async()=>{
   const user=auth.currentUser;
   if(!user){show('ხელახლა შედი HEXORA-ს ანგარიშში.');return;}
   try{await a.reload(user);$('currentEmail').textContent=user.email||'—';show('✅ ანგარიშის ელფოსტა განახლდა. თუ ჯერ ძველი ჩანს, ახალ მისამართზე მოსული ბმულით დაადასტურე ცვლილება.');}
   catch(err){show(errorMessage(err),true)}
  };
 }catch(err){$('loading').hidden=true;console.error(err);show('გვერდის ჩატვირთვა ვერ მოხერხდა. შეამოწმე ინტერნეტი და განაახლე გვერდი.',true)}
}
