import { auth, db, APP, SKILLS, BELT_COLORS, BELT_LEVELS, ini, toast, sync } from './firebase-config.js?v=800';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { coachDash, coachAtt, coachSkills, coachNotes, coachSched, coachMsgs, coachProfile, library, skillDetail, lessonPlans } from './views-coach.js?v=800';
import { dirHome, dirSched, dirAthletes, dirCoaches, dirTimecards, dirMsgs, dirBilling, dirSubs, dirInjuries, dirAttendance, dirDocuments, dirRoutines } from './views-director.js?v=800';
import { parentHome, parentSkills, parentTuition, parentMsgs, parentDocuments } from './views-parent.js?v=800';

window.APP=APP;
const FC={apiKey:"AIzaSyCmG-MfINmp1rMQOsXGNmRkBxJROSdqyqk",authDomain:"kinetic-a4862.firebaseapp.com",projectId:"kinetic-a4862",storageBucket:"kinetic-a4862.firebasestorage.app",messagingSenderId:"924145283660",appId:"1:924145283660:web:f1135f7000d9e4897f7ae9"};
let obStep=1,obData={},obPlan='crew',_snapUnsubs=[],_moreOpen=false,_notifTimer=null;
const _notified={};
const $=id=>document.getElementById(id);
const show=id=>{const e=$(id);if(e)e.style.display='flex';};
const hide=id=>{const e=$(id);if(e)e.style.display='none';};
const val=id=>$(id)?.value||'';
const sval=(id,v)=>{const e=$(id);if(e)e.value=v;};

onAuthStateChanged(auth,async user=>{
  if(!user){showAuth();return;}
  APP.user=user;
  APP.profile={name:user.email.split('@')[0],email:user.email,role:'director',belt:'Foundation',certifications:[]};
  for(let i=0;i<4;i++){
    try{
      const snap=await getDoc(doc(db,'users',user.uid));
      if(snap.exists()){APP.profile={...APP.profile,...snap.data()};APP.role=APP.profile.role||'director';APP.gymId=APP.profile.gymId||null;break;}
      else if(i===3){
        try{
          const invSnap=await getDocs(query(collection(db,'invites'),where('email','==',user.email)));
          if(!invSnap.empty){const inv=invSnap.docs[0].data();await setDoc(doc(db,'users',user.uid),{name:inv.name||user.email.split('@')[0],email:user.email,role:inv.role||'coach',belt:inv.belt||'Foundation',certifications:[],gymId:inv.gymId||null,gymName:inv.gymName||'',firstLogin:true,createdAt:new Date().toISOString()});break;}
          const athSnap=await getDocs(query(collection(db,'athletes'),where('parentEmail','==',user.email)));
          if(!athSnap.empty){const gymId=athSnap.docs[0].data().gymId||null;await setDoc(doc(db,'users',user.uid),{name:user.email.split('@')[0],email:user.email,role:'parent',belt:'',certifications:[],gymId,gymName:'',firstLogin:true,createdAt:new Date().toISOString()});break;}
        }catch(e){}
        await setDoc(doc(db,'users',user.uid),{name:user.email.split('@')[0],email:user.email,role:'director',belt:'Foundation',certifications:[],createdAt:new Date().toISOString()},{merge:true});
      }
    }catch(e){console.warn(e);}
    if(i<3)await new Promise(r=>setTimeout(r,600));
  }
  if(!APP.gymId){
    if(APP.role==='director'){showOb();return;}
    else{
      hide('loadingScreen');$('appShell').style.display='flex';
      APP.view=APP.role==='coach'?'coachDash':'parentHome';
      initApp();
      $('mc').innerHTML=`<div class="empty-state" style="margin-top:60px;"><div class="es-icon">⏳</div><h3>Account Not Linked Yet</h3><p>Ask your director to invite you through the KINETIC portal.</p><button class="btn danger" style="margin-top:20px;" onclick="K.signOut()">Sign Out</button></div>`;
      return;
    }
  }
  await loadAll();
  if(APP.role==='parent')await loadParentData();
  setupRealtimeListeners();
  showApp();
});

function setupRealtimeListeners(){
  _snapUnsubs.forEach(u=>u());_snapUnsubs=[];
  const gid=APP.gymId;if(!gid)return;
  _snapUnsubs.push(onSnapshot(query(collection(db,'subRequests'),where('gymId','==',gid)),snap=>{APP.subRequests=snap.docs.map(d=>({id:d.id,...d.data()}));updateBadges();if(APP.view==='dirSubs'||APP.view==='coachSched')render();}));
  _snapUnsubs.push(onSnapshot(query(collection(db,'messages'),where('gymId','==',gid)),snap=>{APP.messages=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));updateBadges();if(['dirMsgs','coachMsgs','parentMsgs'].includes(APP.view))render();}));
  _snapUnsubs.push(onSnapshot(query(collection(db,'timecards'),where('gymId','==',gid)),snap=>{APP.allTimecards=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.clockIn||0)-new Date(a.clockIn||0));if(APP.role==='coach')APP.myTimecards=APP.allTimecards.filter(t=>t.coachId===APP.user?.uid);updateBadges();}));
  _snapUnsubs.push(onSnapshot(query(collection(db,'injuries'),where('gymId','==',gid)),snap=>{APP.allInjuries=snap.docs.map(d=>({id:d.id,...d.data()}));updateBadges();}));
}

async function loadAll(){
  const gid=APP.gymId;
  if(!gid){APP.allClasses=[];APP.allAthletes=[];APP.archivedAthletes=[];APP.allCoaches=[];APP.allTimecards=[];APP.myTimecards=[];APP.subRequests=[];APP.allInjuries=[];APP.messages=[];APP.coachConcerns=[];APP.allDocuments=[];APP.allRoutines=[];return;}
  try{
    const results=await Promise.allSettled([
      getDocs(query(collection(db,'classes'),where('gymId','==',gid))),
      getDocs(query(collection(db,'athletes'),where('gymId','==',gid))),
      getDocs(query(collection(db,'users'),where('gymId','==',gid))),
      getDocs(query(collection(db,'timecards'),where('gymId','==',gid))),
      getDocs(query(collection(db,'subRequests'),where('gymId','==',gid))),
      getDocs(query(collection(db,'injuries'),where('gymId','==',gid))),
      getDocs(query(collection(db,'messages'),where('gymId','==',gid))),
      getDocs(query(collection(db,'notes'),where('gymId','==',gid))),
      getDocs(query(collection(db,'documents'),where('gymId','==',gid))),
      getDocs(query(collection(db,'routines'),where('gymId','==',gid))),
    ]);
    const safe=i=>results[i].status==='fulfilled'?results[i].value:{docs:[]};
    const[clsS,athS,coaS,tcS,subS,injS,msgS,noteS,docS,routS]=Array.from({length:10},(_,i)=>safe(i));
    APP.allClasses=clsS.docs.map(d=>({id:d.id,...d.data()}));
    const allAth=athS.docs.map(d=>({id:d.id,...d.data()}));
    APP.allAthletes=allAth.filter(a=>!a.archived);APP.archivedAthletes=allAth.filter(a=>a.archived);
    APP.allCoaches=coaS.docs.map(d=>({id:d.id,...d.data()})).filter(c=>c.role==='coach');
    APP.allTimecards=tcS.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.clockIn||0)-new Date(a.clockIn||0));
    APP.subRequests=subS.docs.map(d=>({id:d.id,...d.data()}));
    APP.allInjuries=injS.docs.map(d=>({id:d.id,...d.data()}));
    APP.messages=msgS.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    APP.coachConcerns=noteS.docs.map(d=>({id:d.id,...d.data()})).filter(n=>n.issueNotes&&n.issueNotes.trim()&&!n.dismissed).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
    APP.allDocuments=docS.docs.map(d=>({id:d.id,...d.data()}));
    APP.allRoutines=routS.docs.map(d=>({id:d.id,...d.data()}));
    if(APP.role==='coach')APP.myTimecards=APP.allTimecards.filter(t=>t.coachId===APP.user?.uid);
    if(APP.role==='parent'){const pa=await getDocs(query(collection(db,'athletes'),where('parentEmail','==',APP.user.email)));APP.parentAthletes=pa.docs.map(d=>({id:d.id,...d.data()}));}
    const gs=await getDoc(doc(db,'gyms',gid));if(gs.exists())APP.gymProfile=gs.data();
  }catch(e){console.warn('loadAll:',e);}
}

async function loadParentData(){
  if(APP.role!=='parent'||!APP.gymId)return;
  APP.parentSkillData=APP.parentSkillData||{};APP.parentSkillUpdated=APP.parentSkillUpdated||{};
  try{for(const ath of(APP.parentAthletes||[])){const myClasses=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));for(const cls of myClasses){try{const snap=await getDocs(query(collection(db,'skills'),where('classId','==',cls.id)));let latest='',state={};snap.docs.forEach(d=>{const dat=d.data();if((dat.date||'')>latest){latest=dat.date||'';state=dat.skills||{};}});const athIdx=(cls.athletes||[]).indexOf(ath.id);if(athIdx>-1&&state[athIdx]){if(!APP.parentSkillData[ath.id])APP.parentSkillData[ath.id]={};Object.assign(APP.parentSkillData[ath.id],state[athIdx]);APP.parentSkillUpdated[ath.id]=latest;}}catch(e){}}}}catch(e){}
}

function showAuth(){hide('loadingScreen');show('authScreen');hide('obScreen');hide('appShell');}
function showOb(){hide('loadingScreen');hide('authScreen');show('obScreen');hide('appShell');renderOb(1);}
function showApp(){hide('loadingScreen');hide('authScreen');hide('obScreen');$('appShell').style.display='flex';initApp();if(APP.role==='coach')startNotificationWatcher();if(APP.profile?.firstLogin)setTimeout(()=>K.openModal('changePwModal'),800);}

function renderOb(step){
  obStep=step;
  document.querySelectorAll('.ob-dot').forEach((d,i)=>d.classList.toggle('on',i<step));
  $('obLbl').textContent=`Step ${step} of 4 — ${['','Your Gym','Your Team','Choose a Plan','Ready!'][step]}`;
  const bd=$('obBd');
  if(step===1)bd.innerHTML=`<div style="font-size:48px;margin-bottom:16px;">🏛️</div><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:24px;margin-bottom:8px;">Welcome to KINETIC.</div><div style="font-size:14px;color:var(--t2);line-height:1.6;margin-bottom:24px;">Let's set up your gym. Takes about 2 minutes.</div><div class="fg"><label class="fl">Gym Name *</label><input class="fi" id="ob_gym" placeholder="e.g. Elite Gymnastics Academy" value="${obData.gymName||''}"></div><div class="fg"><label class="fl">Your Title</label><input class="fi" id="ob_title" placeholder="Head Coach, Owner, Director" value="${obData.title||''}"></div><div class="g2" style="margin-bottom:0;"><div class="fg"><label class="fl">City</label><input class="fi" id="ob_city" value="${obData.city||''}"></div><div class="fg"><label class="fl">State</label><input class="fi" id="ob_state" value="${obData.state||''}"></div></div><div class="fg"><label class="fl">Phone</label><input class="fi" type="tel" id="ob_phone" value="${obData.phone||''}"></div><button class="btn primary full" onclick="K.obNext(1)">Continue →</button>`;
  if(step===2)bd.innerHTML=`<div style="font-size:48px;margin-bottom:16px;">🧑‍🏫</div><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:24px;margin-bottom:8px;">Tell us about your team.</div><div class="fg"><label class="fl">How many coaches?</label><select class="fs" id="ob_coaches"><option>1–3</option><option>4–8</option><option>9–15</option><option>15+</option></select></div><div class="fg"><label class="fl">Athletes enrolled?</label><select class="fs" id="ob_ath"><option>Under 25</option><option>25–50</option><option>50–100</option><option>100+</option></select></div><div style="display:flex;gap:8px;"><button class="btn" onclick="renderOb(1)">← Back</button><button class="btn primary" style="flex:1;padding:14px;" onclick="K.obNext(2)">Continue →</button></div>`;
  if(step===3)bd.innerHTML=`<div style="font-size:48px;margin-bottom:16px;">💎</div><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:24px;margin-bottom:8px;">Choose your plan.</div><div style="font-size:14px;color:var(--t2);margin-bottom:24px;">30-day free trial.</div>${[{id:'crew',p:'$99.99',n:'Gym Plan',d:'Unlimited coaches, athletes, and classes.'},{id:'solo',p:'$29.99',n:'Solo Director',d:'For independent coaches.'}].map(plan=>`<div class="plan-c ${obPlan===plan.id?'on':''}" onclick="obPlan='${plan.id}';renderOb(3)"><div class="plan-chk">${obPlan===plan.id?'✓':''}</div><div><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:22px;">${plan.p}<span style="font-size:14px;font-weight:500;color:var(--t2);">/mo</span></div><div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-top:2px;">${plan.n}</div><div style="font-size:12px;color:var(--t2);margin-top:6px;">${plan.d}</div></div></div>`).join('')}<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn" onclick="renderOb(2)">← Back</button><button class="btn primary" style="flex:1;padding:14px;" onclick="K.obNext(3)">Start Free Trial →</button></div>`;
  if(step===4)bd.innerHTML=`<div style="font-size:48px;margin-bottom:16px;">🚀</div><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:24px;margin-bottom:8px;">You're all set!</div><div style="font-size:14px;color:var(--t2);line-height:1.6;margin-bottom:24px;">KINETIC is ready for <strong>${obData.gymName}</strong>.</div><button class="btn primary full" id="launchBtn" onclick="K.finishOb()">Launch My Dashboard →</button>`;
}

const MOB_NAV={
  coach:[{i:'🏠',l:'Home',v:'coachDash'},{i:'✅',l:'Attend',v:'coachAtt'},{i:'🥋',l:'Skills',v:'coachSkills'},{i:'📅',l:'Schedule',v:'coachSched'},{i:'⋯',l:'More',v:'more'}],
  director:[{i:'🏠',l:'Home',v:'dirHome'},{i:'👧',l:'Athletes',v:'dirAthletes'},{i:'📅',l:'Schedule',v:'dirSched'},{i:'💬',l:'Messages',v:'dirMsgs'},{i:'⋯',l:'More',v:'more'}],
  parent:[{i:'🏠',l:'Home',v:'parentHome'},{i:'🥋',l:'Skills',v:'parentSkills'},{i:'💳',l:'Tuition',v:'parentTuition'},{i:'💬',l:'Messages',v:'parentMsgs'},{i:'⋯',l:'More',v:'more'}],
};
const MOB_MORE={
  coach:[{i:'📝',l:'Notes',v:'coachNotes'},{i:'📋',l:'Lessons',v:'lessons'},{i:'📚',l:'Skill Library',v:'library'},{i:'💬',l:'Messages',v:'coachMsgs'},{i:'👤',l:'Profile',v:'coachProfile'}],
  director:[{i:'🧑‍🏫',l:'Coaches',v:'dirCoaches'},{i:'🔄',l:'Sub Requests',v:'dirSubs'},{i:'💰',l:'Tuition',v:'dirBilling'},{i:'⏱️',l:'Timecards',v:'dirTimecards'},{i:'📋',l:'Attendance',v:'dirAttendance'},{i:'📄',l:'Documents',v:'dirDocuments'},{i:'🎥',l:'Routines',v:'dirRoutines'},{i:'🚑',l:'Injury Log',v:'dirInjuries'}],
  parent:[{i:'📄',l:'Documents',v:'parentDocuments'}],
};

function renderMobileNav(){
  const nav=$('mobNav');const panel=$('mobMorePanel');if(!nav)return;
  const r=APP.role||'coach';const items=MOB_NAV[r]||[];const v=APP.view||'';
  const msgUnread=(APP.messages||[]).filter(m=>!m.read&&m.fromId!==APP.user?.uid&&m.fromId!=='system').length;
  nav.innerHTML=items.map(it=>{
    const isMore=it.v==='more';const on=isMore?_moreOpen:(v===it.v||v.startsWith(it.v));
    const hasDot=(it.v==='dirMsgs'||it.v==='coachMsgs'||it.v==='parentMsgs')&&msgUnread>0;
    const clickFn=isMore?`window.K.toggleMobMore()`:`window._moreOpen=false;document.getElementById('mobMorePanel').classList.remove('open');window.K.nav('${it.v}')`;
    return`<button class="mob-nav-item ${on?'on':''}" onclick="${clickFn}">${hasDot?'<div class="mn-dot"></div>':''}<div class="mn-icon">${it.i}</div><div class="mn-lbl">${it.l}</div></button>`;
  }).join('');
  if(panel){
    const moreItems=(MOB_MORE[r]||[]).map(it=>`<div class="mob-more-item ${v===it.v?'on':''}" onclick="_moreOpen=false;document.getElementById('mobMorePanel').classList.remove('open');window.K.nav('${it.v}')"><span style="font-size:20px;width:28px;text-align:center;">${it.i}</span><span>${it.l}</span></div>`).join('');
    panel.innerHTML=`<div style="padding:12px 16px 10px;border-bottom:1px solid rgba(181,153,106,0.15);margin-bottom:8px;display:flex;align-items:center;gap:10px;"><div class="user-av" style="width:36px;height:36px;font-size:13px;">${ini(APP.profile?.name||'?')}</div><div><div style="font-size:13px;font-weight:700;color:#FAFAF8;">${APP.profile?.name||'User'}</div><div style="font-size:11px;color:rgba(250,250,248,0.4);">${APP.gymProfile?.name||''}</div></div></div>${moreItems}<div style="padding:12px;border-top:1px solid rgba(181,153,106,0.15);margin-top:8px;"><button class="so-btn" style="width:100%;padding:13px;font-size:12px;" onclick="window.K.signOut()">Sign Out</button></div>`;
    if(!_moreOpen)panel.classList.remove('open');
  }
}
window._moreOpen=false;

function updateBadges(){
  renderMobileNav();
  const pending=(APP.subRequests||[]).filter(r=>r.status==='pending'||r.status==='claimed').length;
  const unread=(APP.messages||[]).filter(m=>!m.read&&m.fromId!==APP.user?.uid&&m.fromId!=='system').length;
  const tc=(APP.allTimecards||[]).filter(t=>t.status==='pending').length;
  const badge=$('tbBadge');
  if(badge)badge.innerHTML=(pending+unread+tc)>0?`<span style="background:var(--red);color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;padding:3px 9px;border-radius:10px;">${pending+unread+tc} new</span>`:'';
}

function updateSimpleModeBar(){
  const bar=$('simpleModeBar');if(!bar)return;
  if(APP.role==='coach'&&APP.simpleMode){bar.style.display='flex';bar.innerHTML=`<div style="display:flex;align-items:center;gap:8px;background:rgba(181,153,106,0.12);border:1px solid rgba(181,153,106,0.25);border-radius:6px;padding:4px 12px;"><span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);">Simple Mode</span><button onclick="window.APP.simpleMode=false;window.renderNav&&window.renderNav();window.render&&window.render();updateSimpleModeBar();" style="background:transparent;border:1px solid rgba(181,153,106,0.3);color:var(--t2);font-size:13px;width:22px;height:22px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button></div>`;}
  else{bar.style.display='none';}
}

function startNotificationWatcher(){
  if(_notifTimer)clearInterval(_notifTimer);
  _notifTimer=setInterval(()=>{
    const uid=APP.user?.uid,today=new Date().toLocaleDateString('en-US',{weekday:'long'}),nowMin=new Date().getHours()*60+new Date().getMinutes(),todayKey=new Date().toISOString().split('T')[0];
    APP.allClasses.filter(c=>c.day===today&&((c.coaches||[]).includes(uid)||c.coachId===uid)).forEach(cls=>{
      if(!cls.time)return;const[hh,mm]=(cls.time.match(/(\d+):(\d+)/)||[0,0,0]).slice(1).map(Number);const pm=cls.time.includes('PM')&&hh!==12;const clsMin=(pm?hh+12:hh)*60+mm;const minsUntil=clsMin-nowMin;const key=cls.id+'_'+todayKey;
      if(!_notified[key]&&minsUntil<=10&&minsUntil>0){_notified[key]=true;toast(`⏰ ${cls.name} starts in ${minsUntil}m!`,'ai');}
    });
  },60000);
}

function initApp(){
  const p=APP.profile,r=APP.role;
  $('uAv').textContent=ini(p.name||'?');$('uNm').textContent=p.name||'User';
  $('gymNm').textContent=APP.gymProfile?.name||p.gymName||'';
  $('roleTag').textContent=r==='coach'?'Coach Portal':r==='director'?'Director Portal':'Parent Portal';
  $('uBelt').textContent=r==='parent'?(APP.parentAthletes?.map(a=>a.name.split(' ')[0]).join(' & ')||'Parent'):p.belt||'Foundation';
  $('smTog').style.display=r==='coach'?'flex':'none';
  const tbSub=$('tbSub');if(tbSub){tbSub.style.display='block';tbSub.textContent=APP.gymProfile?.name||p.gymName||'';}
  APP.view=r==='coach'?'coachDash':r==='director'?'dirHome':'parentHome';
  APP.attDay=new Date().toLocaleDateString('en-US',{weekday:'long'});
  if(r==='coach')APP.simpleMode=true;
  renderNav();render();updateBadges();
}

const NAV={
  coach:[{s:'Class Tools'},{i:'🏠',l:'Dashboard',v:'coachDash'},{i:'✅',l:'Attendance',v:'coachAtt'},{i:'🥋',l:'Skill Tracker',v:'coachSkills'},{i:'📝',l:'Notes',v:'coachNotes'},{i:'📋',l:'Lesson Plans',v:'lessons'},{s:'My KINETIC'},{i:'📚',l:'Skill Library',v:'library'},{i:'📅',l:'My Schedule',v:'coachSched'},{i:'💬',l:'Messages',v:'coachMsgs'},{i:'👤',l:'My Profile',v:'coachProfile'}],
  director:[{s:'Operations'},{i:'🏠',l:'Overview',v:'dirHome'},{i:'👧',l:'Athletes',v:'dirAthletes'},{i:'🧑‍🏫',l:'Coaches',v:'dirCoaches'},{i:'📅',l:'Schedule',v:'dirSched'},{i:'📋',l:'Attendance',v:'dirAttendance'},{i:'💬',l:'Messages',v:'dirMsgs'},{i:'🔄',l:'Sub Requests',v:'dirSubs'},{s:'Admin'},{i:'💰',l:'Tuition',v:'dirBilling'},{i:'⏱️',l:'Timecards',v:'dirTimecards'},{i:'🚑',l:'Injury Log',v:'dirInjuries'},{s:'Content'},{i:'📄',l:'Documents',v:'dirDocuments'},{i:'🎥',l:'Routines',v:'dirRoutines'},{i:'📚',l:'Skill Library',v:'library'}],
  parent:[{s:'My Athletes'},{i:'🏠',l:'Dashboard',v:'parentHome'},{i:'📈',l:'Skills',v:'parentSkills'},{i:'💳',l:'Tuition',v:'parentTuition'},{i:'💬',l:'Messages',v:'parentMsgs'},{i:'📄',l:'Documents',v:'parentDocuments'}],
};

function renderNav(){
  const nav=NAV[APP.role]||[];
  const subPending=(APP.subRequests||[]).filter(r=>r.status==='pending'||r.status==='claimed').length;
  const msgUnread=(APP.messages||[]).filter(m=>!m.read&&m.fromId!==APP.user?.uid&&m.fromId!=='system').length;
  const tcPending=(APP.allTimecards||[]).filter(t=>t.status==='pending').length;
  $('sbNav').innerHTML=nav.map(it=>{if(it.s)return`<div class="nav-sec">${it.s}</div>`;const on=APP.view===it.v||APP.view?.startsWith(it.v);const badge=it.v==='dirSubs'&&subPending>0?subPending:it.v==='dirMsgs'&&msgUnread>0?msgUnread:it.v==='dirTimecards'&&tcPending>0?tcPending:it.v==='coachMsgs'&&msgUnread>0?msgUnread:0;return`<div class="nav-item ${on?'on':''}" onclick="K.nav('${it.v}')"><span class="nav-icon">${it.i}</span>${it.l}${badge?`<span class="nav-badge">${badge}</span>`:''}</div>`;}).join('');
  const sw=$('togSw');if(sw)sw.classList.toggle('on',APP.simpleMode||false);
  renderMobileNav();
}
window.renderNav=renderNav;

let clockTimer=null;
function startClock(){
  if(clockTimer)clearInterval(clockTimer);
  const tick=()=>{const e=$('liveClock');if(e)e.textContent=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});};
  tick();clockTimer=setInterval(tick,1000);
  if(APP.clockedIn){const et=()=>{const e=$('elapsedTime');if(e){const d=Math.floor((new Date()-APP.clockInTime)/60000);e.textContent=d>=60?`${Math.floor(d/60)}h ${d%60}m`:`${d}m`;}};et();setInterval(et,10000);}
}

async function loadAI(){
  const el=$('aiContent');if(!el)return;
  el.innerHTML=`<div class="ai-loading">Preparing your lesson plan<span>.</span><span>.</span><span>.</span></div>`;
  const notes=APP.classNotes||'Class worked on Level 1 gymnastics skills.';
  try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`You are KINETIC, a gymnastics coaching AI. Based on these class notes, give a practical lesson plan for TODAY. Use real gymnastics terms. Format: one focus sentence then 3 bullets with •.\n\nNotes: "${notes}"`}]})});const data=await res.json();if(data.content?.[0]){el.innerHTML=`<div class="ai-txt">${data.content[0].text.replace(/\n/g,'<br>').replace(/•/g,'<strong>•</strong>')}</div>`;}}
  catch(e){el.innerHTML=`<div class="ai-txt"><strong>•</strong> Review hollow body in every skill.<br><strong>•</strong> Celebrate progress from last session.<br><strong>•</strong> Conditioning: 3× hollow holds, 30 seconds each.</div>`;}
}

function render(){
  const c=$('mc');if(!c)return;
  const v=APP.view||'coachDash';
  const views={coachDash,coachAtt,coachSkills,coachNotes,coachSched,coachMsgs,coachProfile,lessons:lessonPlans,library:()=>library(APP.libLevel||'all',APP.libEvent||'all'),dirHome,dirSched,dirAttendance,dirAthletes:()=>dirAthletes('active'),dirAthletes_arch:()=>dirAthletes('archived'),dirCoaches,dirTimecards,dirMsgs,dirBilling,dirSubs,dirInjuries,dirDocuments,dirRoutines,parentHome,parentSkills,parentTuition,parentMsgs,parentDocuments};
  if(v.startsWith('skill_')){c.innerHTML=skillDetail(v.replace('skill_',''));return;}
  try{c.innerHTML=(views[v]?views[v]():`<div class="empty-state"><div class="es-icon">🔒</div><h3>Coming Soon</h3><p>This feature is on the roadmap for KINETIC 2.0.</p></div>`);}
  catch(err){console.error('render:',v,err);c.innerHTML=`<div class="empty-state"><div class="es-icon">⚠️</div><h3>Something went wrong</h3><p style="font-size:12px;">${err.message}</p><button class="btn primary" style="margin-top:16px;" onclick="K.nav('${APP.role==='director'?'dirHome':APP.role==='coach'?'coachDash':'parentHome'}')">← Go Home</button></div>`;}
  if(v==='coachDash'){startClock();if(APP.clockedIn)loadAI();}
  updateSimpleModeBar();
}
window.render=render;

const K=window.K={
nav(v){_moreOpen=false;const panel=$('mobMorePanel');if(panel)panel.classList.remove('open');APP.view=v;renderNav();render();if(v==='dirAttendance')K.loadAttendanceRecords();},
toggleSimple(){APP.simpleMode=!APP.simpleMode;renderNav();render();toast(APP.simpleMode?'Simple Mode ON':'Simple Mode OFF');},
toggleMobMore(){_moreOpen=!_moreOpen;const panel=$('mobMorePanel');if(panel)panel.classList.toggle('open',_moreOpen);renderMobileNav();},
switchTab(t){$('inForm').style.display=t==='in'?'block':'none';$('upForm').style.display=t==='up'?'block':'none';$('siTab').classList.toggle('on',t==='in');$('suTab').classList.toggle('on',t==='up');},
pickSignupType(type){document.querySelectorAll('.su-card:not(.locked)').forEach(c=>c.classList.remove('on'));const el=type==='gym'?$('suGym'):null;if(el)el.classList.add('on');$('gymForm').classList.toggle('show',type==='gym');},
async signIn(){const btn=$('inBtn'),err=$('inErr');err.style.display='none';const email=val('inEmail'),pass=val('inPass');if(!email||!pass){err.textContent='Please fill in all fields.';err.style.display='block';return;}btn.disabled=true;btn.textContent='Signing in...';try{await signInWithEmailAndPassword(auth,email,pass);}catch(e){err.textContent=e.code==='auth/invalid-credential'?'Email or password is incorrect.':e.message;err.style.display='block';btn.disabled=false;btn.textContent='Sign In →';}},
async signUpGym(){const btn=$('upBtn'),err=$('upErr');err.style.display='none';const name=val('upName').trim(),email=val('upEmail').trim(),pass=val('upPass');if(!name||!email||!pass){err.textContent='Fill in all fields.';err.style.display='block';return;}if(pass.length<6){err.textContent='Password must be 6+ characters.';err.style.display='block';return;}btn.disabled=true;btn.textContent='Creating...';try{const cred=await createUserWithEmailAndPassword(auth,email,pass);await setDoc(doc(db,'users',cred.user.uid),{name,email,role:'director',belt:'Foundation',certifications:[],createdAt:new Date().toISOString()});toast('✓ Welcome to KINETIC!');}catch(e){err.textContent=e.code==='auth/email-already-in-use'?'Account already exists.':e.message;err.style.display='block';btn.disabled=false;btn.textContent='Create Account →';}},
signOut(){_snapUnsubs.forEach(u=>u());signOut(auth);},
obNext(step){if(step===1){const n=val('ob_gym').trim();if(!n){toast('Gym name required','warn');return;}obData={gymName:n,title:val('ob_title'),city:val('ob_city'),state:val('ob_state'),phone:val('ob_phone')};}if(step===2){obData.coachCount=val('ob_coaches')||'1–3';obData.athCount=val('ob_ath')||'Under 25';}renderOb(step+1);},
async finishOb(){const btn=$('launchBtn');if(btn){btn.disabled=true;btn.textContent='Setting up...';}try{const ref=await addDoc(collection(db,'gyms'),{name:obData.gymName,title:obData.title||'',city:obData.city||'',state:obData.state||'',phone:obData.phone||'',coachCount:obData.coachCount,athCount:obData.athCount,plan:obPlan,directorId:APP.user.uid,createdAt:new Date().toISOString()});APP.gymId=ref.id;APP.gymProfile={name:obData.gymName,plan:obPlan};await setDoc(doc(db,'users',APP.user.uid),{gymId:ref.id,gymName:obData.gymName,directorTitle:obData.title||''},{merge:true});APP.profile.gymId=ref.id;APP.profile.gymName=obData.gymName;await loadAll();setupRealtimeListeners();showApp();}catch(e){toast('Setup failed: '+e.message,'warn');if(btn){btn.disabled=false;btn.textContent='Launch →';}}},
openModal(id,data={}){
  if(id==='addAthModal')$('addAthContent').innerHTML=buildAthForm();
  if(id==='editAthModal'){const a=APP.allAthletes.find(x=>x.id===data.id);if(!a)return;$('editAthContent').innerHTML=buildAthForm(a,true);}
  if(id==='viewAthModal'){const a=APP.allAthletes.find(x=>x.id===data.id);if(!a)return;$('viewAthContent').innerHTML=buildAthDetail(a);}
  if(id==='addClassModal'){$('nc_level').innerHTML=BELT_LEVELS.map(l=>`<option value="${l}">${l}</option>`).join('');$('nc_coach').innerHTML=`<option value="">TBD</option>${APP.allCoaches.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}`;if(data.day)sval('nc_day',data.day);}
  if(id==='editClassModal'){const cls=APP.allClasses.find(c=>c.id===data.classId);if(!cls)return;$('editClassContent').innerHTML=buildEditClassForm(cls);}
  if(id==='classModal'){const c=APP.allClasses.find(x=>x.id===data.classId);if(!c)return;$('classMoContent').innerHTML=buildClassDetail(c);}
  if(id==='inviteModal'){const t=data.type||'coach';APP.inviteType=t;$('invTitle').textContent=t==='coach'?'Invite a Coach':'Invite a Parent';$('invDesc').textContent=t==='coach'?'Account auto-created with temp password.':'Portal created when athlete is added.';$('invBeltWrap').style.display=t==='coach'?'block':'none';$('inv_belt').innerHTML=BELT_LEVELS.slice(0,6).map(l=>`<option value="${l}">${l}</option>`).join('');$('invResult').style.display='none';$('invActions').style.display='flex';$('invDone').style.display='none';sval('inv_name','');sval('inv_email','');}
  if(id==='editCoachModal'){const c=APP.allCoaches.find(x=>x.id===data.id);if(!c)return;$('editCoachContent').innerHTML=buildEditCoachForm(c);}
  if(id==='newMsgModal'){
    const role=data.role||'director';const sel=$('msg_to');
    if(role==='director'){const parentOpts=APP.allAthletes.map(a=>`<option value="parent_${a.id}">${a.name.split(' ')[0]}'s Parent</option>`).join('');const classOpts=APP.allClasses.map(c=>`<option value="class_${c.id}">📅 ${c.name} — All Members</option>`).join('');sel.innerHTML=`<option value="coaches">All Coaches</option><option value="parents">All Parents</option>${classOpts}${APP.allCoaches.map(c=>`<option value="${c.id}">${c.name} (Coach)</option>`).join('')}${parentOpts}`;}
    else if(role==='coach'){sel.innerHTML=`<option value="director">Director</option>`;}
    else{sel.innerHTML=`<option value="director">Director</option><option value="coaches">My Coach</option>`;}
    if(data.reminder&&data.ath){const fn=data.ath.name.split(' ')[0];sel.value=`parent_${data.ath.id}`;sval('msg_sub',`Tuition Reminder — ${data.ath.name}`);sval('msg_body',`Hi! Friendly reminder that ${fn}'s tuition is due.`);}
    else{sval('msg_sub','');sval('msg_body','');}
  }
  if(id==='msgViewModal'){
    const msgs=APP.messages||[];const m=msgs[data.idx];if(!m)return;
    if(!m.read&&m.fromId!==APP.user?.uid){m.read=true;try{setDoc(doc(db,'messages',m.id||'_'),{read:true},{merge:true}).catch(()=>{});}catch(e){}}
    const tid=m.threadId||m.id;
    const thread=msgs.filter(x=>(x.threadId||x.id)===tid).sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
    const lastOther=thread.filter(x=>x.fromId!==APP.user?.uid).slice(-1)[0]||m;
    const safeSubj=(m.subject||'').replace(/'/g,"\\'");
    $('msgViewContent').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;"><h3 style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;">${m.subject||''}</h3><button class="btn" onclick="K.closeModal('msgViewModal');render();">✕</button></div>
    <div style="border:1px solid var(--bdr);border-radius:8px;overflow:hidden;margin-bottom:16px;">${thread.map(msg=>{const isMine=msg.fromId===APP.user?.uid;return`<div style="padding:14px 16px;${isMine?'background:rgba(181,153,106,0.05)':''}border-top:1px solid var(--bdr2);"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><div style="display:flex;align-items:center;gap:8px;"><div class="mini-av">${ini(msg.from||'?')}</div><span style="font-size:13px;font-weight:700;">${isMine?'You':msg.from||'Unknown'}</span></div><span style="font-size:11px;color:var(--t3);">${msg.time||''}</span></div><div style="font-size:14px;color:var(--t2);line-height:1.7;padding-left:34px;">${msg.body||msg.preview||''}</div>${msg.type==='sub_confirm_request'?`<div style="padding-left:34px;margin-top:10px;display:flex;gap:8px;"><button class="btn primary" style="flex:1;" onclick="K.confirmSubFromCoach('${msg.subRequestId||''}')">✓ Approve Sub</button><button class="btn danger" style="flex:1;" onclick="K.denySubFinal('${msg.subRequestId||''}')">Deny</button></div>`:''}</div>`;}).join('')}</div>
    <div><label class="fl">Reply</label><textarea class="ft" id="replyBody" placeholder="Write a reply..." style="min-height:80px;"></textarea><button class="btn primary full" style="margin-top:8px;" onclick="K.sendReply('${lastOther.fromId||''}','Re: ${safeSubj}','${tid||''}')">Send Reply →</button></div>`;
  }
  if(id==='editTuitionModal'){const a=APP.allAthletes.find(x=>x.id===data.id);if(!a)return;$('editTuitionContent').innerHTML=`<h3 style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;margin-bottom:16px;">Edit Tuition — ${a.name}</h3><div class="fg"><label class="fl">Monthly Amount ($)</label><input class="fi" id="et_amt" type="number" value="${a.tuitionAmount||185}"></div><div class="fg"><label class="fl">Billing Cycle</label><select class="fs" id="et_cycle"><option ${a.billingCycle==='Monthly'?'selected':''}>Monthly</option><option ${a.billingCycle==='Per Semester'?'selected':''}>Per Semester</option><option ${a.billingCycle==='Annual'?'selected':''}>Annual</option></select></div><div class="fg"><label class="fl">Status</label><select class="fs" id="et_stat"><option ${a.tuitionStatus==='pending'?'selected':''} value="pending">Pending</option><option ${a.tuitionStatus==='paid'?'selected':''} value="paid">Paid</option><option ${a.tuitionStatus==='overdue'?'selected':''} value="overdue">Overdue</option></select></div><div style="display:flex;gap:8px;"><button class="btn" style="flex:1;" onclick="K.closeModal('editTuitionModal')">Cancel</button><button class="btn primary" style="flex:1;" onclick="K.saveTuition('${a.id}')">Save →</button></div>`;}
  if(id==='addChargeModal')$('ch_ath').innerHTML=`<option value="all">All Athletes</option>${APP.allAthletes.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}`;
  if(id==='editTCModal'){const tc=APP.allTimecards?.find(t=>t.id===data.id);if(!tc)return;$('editTCContent').innerHTML=`<div class="mo-title">Edit Timecard</div><p style="font-size:13px;color:var(--t2);margin-bottom:16px;"><strong>${tc.coachName||'Coach'}</strong> · ${tc.date||''}</p><div class="fg"><label class="fl">Clock In</label><input class="fi" type="datetime-local" id="tc_in" value="${tc.clockIn?tc.clockIn.slice(0,16):''}"></div><div class="fg"><label class="fl">Clock Out</label><input class="fi" type="datetime-local" id="tc_out" value="${tc.clockOut?tc.clockOut.slice(0,16):''}"></div><div class="fg"><label class="fl">Director Note</label><input class="fi" id="tc_note" value="${tc.directorNote||''}" placeholder="Reason for edit..."></div><div style="display:flex;gap:8px;"><button class="btn" style="flex:1;" onclick="K.closeModal('editTCModal')">Cancel</button><button class="btn primary" style="flex:1;" onclick="K.saveEditTC('${tc.id}')">Save →</button></div>`;}
  if(id==='addMakeupModal'){const cls=APP.allClasses.find(c=>c.id===data.classId);const available=APP.allAthletes.filter(a=>!cls||(!(cls.athletes||[]).includes(a.id)));$('makeupContent').innerHTML=`<div class="mo-title">Add Makeup Athlete</div><p style="font-size:13px;color:var(--t2);margin-bottom:16px;">Added for today only.</p><div class="fg"><label class="fl">Athlete</label><select class="fs" id="mu_ath"><option value="">Select...</option>${available.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select></div><div style="display:flex;gap:8px;"><button class="btn" style="flex:1;" onclick="K.closeModal('addMakeupModal')">Cancel</button><button class="btn primary" style="flex:1;" onclick="K.addMakeupAthlete('${data.classId||''}')">Add for Today →</button></div>`;}
  if(id==='subReqModal'){const my=APP.allClasses.filter(c=>(c.coaches||[]).includes(APP.user?.uid)||c.coachId===APP.user?.uid);$('sub_cls').innerHTML=my.length?my.map(c=>`<option value="${c.id}">${c.name} — ${c.day} ${c.time}</option>`).join(''):`<option>No classes assigned</option>`;sval('sub_date','');sval('sub_reason','');}
  if(id==='lpModal')$('lpTitle').textContent=data.title?`${data.level} — Week ${data.week}: ${data.title}`:`Week ${data.week||1}`;
  if(id==='changePwModal'){$('cpErr').style.display='none';sval('cpNew','');sval('cpConf','');}
  if(id==='rosterModal'){const c=APP.allClasses.find(x=>x.id===data.classId);if(!c)return;const aths=APP.allAthletes.filter(a=>(c.athletes||[]).includes(a.id));$('rosterContent').innerHTML=`<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><h3 style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;">${c.name}</h3><button class="btn" onclick="K.closeModal('rosterModal')">✕</button></div>${aths.map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--bdr2);"><div class="mini-av">${ini(a.name)}</div><div style="flex:1;font-size:13px;font-weight:600;">${a.name}</div></div>`).join('')}`;}
  if(id==='uploadDocModal'){$('uploadDocContent').innerHTML=buildUploadDocForm();}
  if(id==='uploadRoutineModal'){$('uploadRoutineContent').innerHTML=buildUploadRoutineForm();}
  $(id).classList.add('open');
},
closeModal(id){$(id).classList.remove('open');},
setAtt(clsIdx,athIdx,status){if(!APP.attState[clsIdx])APP.attState[clsIdx]={};APP.attState[clsIdx][athIdx]=status;const row=document.getElementById(`ar_${clsIdx}_${athIdx}`);if(row){row.querySelectorAll('.att-btn')[0].className='att-btn'+(status==='present'?' sel-p':'');row.querySelectorAll('.att-btn')[1].className='att-btn'+(status==='absent'?' sel-a':'');}},
markAll(clsId,status){const cls=APP.allClasses.find(c=>c.id===clsId);APP.allAthletes.filter(a=>(cls?.athletes||[]).includes(a.id)).forEach((_,i)=>K.setAtt(clsId,i,status));},
async saveAtt(clsId){sync(true);const cls=APP.allClasses.find(c=>c.id===clsId);const aths=APP.allAthletes.filter(a=>(cls?.athletes||[]).includes(a.id));const state=APP.attState[clsId]||{};const presentIds=aths.filter((_,i)=>state[i]!=='absent').map(a=>a.id);const absentIds=aths.filter((_,i)=>state[i]==='absent').map(a=>a.id);const today=new Date().toISOString().split('T')[0];try{await setDoc(doc(db,`attendance/${today}_${clsId}`),{date:today,attendance:state,presentIds,absentIds,coachId:APP.user.uid,classId:clsId,className:cls?.name||'',gymId:APP.gymId||null,updatedAt:new Date().toISOString()},{merge:true});if(!APP.attSavedClasses)APP.attSavedClasses={};APP.attSavedClasses[clsId]=true;if(!APP.sessionState)APP.sessionState={};if(!APP.sessionState[clsId])APP.sessionState[clsId]={};APP.sessionState[clsId].attDone=true;APP.attSaved=true;sync(false);toast('✓ Attendance saved ✅');render();}catch(e){sync(false);toast('⚠️ '+e.message,'warn');}},
setSkill(ai,skid,status){if(!APP.skillState[ai])APP.skillState[ai]={};APP.skillState[ai][skid]=status;document.querySelectorAll(`[data-skill="${ai}_${skid}"]`).forEach(btn=>{const s=btn.dataset.status;btn.className='ssb'+(s===status?s==='nr'?' sel-nr':s==='ip'?' sel-ip':' sel-m':'');});const cls=APP.selectedClass||{level:'Level 1'};const ls=(window._SKILLS||[]).filter(s=>s.level===cls.level);const m=ls.filter(s=>APP.skillState[ai][s.id]==='m').length;const pct=ls.length?Math.round(m/ls.length*100):0;const bar=document.getElementById(`spb${ai}`),pctEl=document.getElementById(`spp${ai}`);if(bar)bar.style.width=pct+'%';if(pctEl)pctEl.textContent=pct+'%';},
async saveSkills(){sync(true);try{await setDoc(doc(db,`skills/${APP.user.uid}_${new Date().toISOString().split('T')[0]}_${APP.activeSkillClass||'gen'}`),{date:new Date().toISOString(),skills:APP.skillState,coachId:APP.user.uid,classId:APP.activeSkillClass||null,gymId:APP.gymId||null},{merge:true});if(!APP.sessionState)APP.sessionState={};if(!APP.sessionState[APP.activeSkillClass||'gen'])APP.sessionState[APP.activeSkillClass||'gen']={};APP.sessionState[APP.activeSkillClass||'gen'].skillsDone=true;sync(false);toast('✓ Skills saved ☁️');}catch(e){sync(false);toast('⚠️ '+e.message,'warn');}},
async saveNotes(){const cn=$('cnTa'),inn=$('inTa');if(cn)APP.classNotes=cn.value;if(inn)APP.issueNotes=inn.value;sync(true);try{await setDoc(doc(db,`notes/${APP.user.uid}_${new Date().toISOString().split('T')[0]}_${APP.activeSkillClass||'gen'}`),{date:new Date().toISOString(),classNotes:APP.classNotes,issueNotes:APP.issueNotes,privateNotes:APP.privateNotes||{},coachId:APP.user.uid,classId:APP.activeSkillClass||null,gymId:APP.gymId||null},{merge:true});APP.notesSaved=true;if(!APP.sessionState)APP.sessionState={};if(!APP.sessionState[APP.activeSkillClass||'gen'])APP.sessionState[APP.activeSkillClass||'gen']={};APP.sessionState[APP.activeSkillClass||'gen'].notesDone=true;sync(false);toast('✓ Notes saved ☁️');render();}catch(e){sync(false);toast('⚠️ '+e.message,'warn');}},
startSession(classId){const cls=APP.allClasses.find(c=>c.id===classId);if(!cls)return;if(!APP.clockedIn){toast('Clock in first','warn');return;}APP.activeSkillClass=classId;APP.selectedClass={...cls,athleteObjects:APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id))};if(!APP.attState[classId]){APP.attState[classId]={};APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id)).forEach((_,i)=>{APP.attState[classId][i]='present';});}const st=APP.sessionState?.[classId]||{};APP.view=st.skillsDone?'coachNotes':st.attDone?'coachSkills':'coachAtt';if(APP.view==='coachAtt')APP.attDay=cls.day;renderNav();render();},
startSkills(classId){APP.activeSkillClass=classId;const cls=APP.allClasses.find(c=>c.id===classId);if(cls)APP.selectedClass={...cls,athleteObjects:APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id))};APP.view='coachSkills';renderNav();render();},
async loadNotesHistory(date,classId){try{const s=await getDoc(doc(db,'notes/'+APP.user.uid+'_'+date+'_'+classId));if(s.exists()){const d=s.data();APP.classNotes=d.classNotes||'';APP.issueNotes=d.issueNotes||'';APP.privateNotes=d.privateNotes||{};}else{APP.classNotes='No notes for this date.';APP.issueNotes='';APP.privateNotes={};}render();}catch(e){render();}},
clockIn(){const my=APP.allClasses.filter(c=>(c.coaches||[]).includes(APP.user?.uid)||c.coachId===APP.user?.uid);if(my.length===0){K.doClockIn(null);return;}if(my.length===1){K.doClockIn(my[0]);return;}$('mc').innerHTML=`<h2 style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:22px;margin-bottom:8px;">Which class are you teaching?</h2><p style="font-size:14px;color:var(--t2);margin-bottom:20px;">You can switch classes after clocking in.</p>${my.map(c=>`<div onclick="K.clockInClass('${c.id}')" style="background:var(--panel);border:2px solid var(--bdr);border-radius:12px;padding:18px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--bdr)'"><div style="font-size:28px;">🥋</div><div style="flex:1;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;">${c.name}</div><div style="font-size:12px;color:var(--t2);margin-top:3px;">${c.day} · ${c.time} · ${c.level}</div></div><span style="color:var(--gold);font-size:20px;">→</span></div>`).join('')}`;},
clockInClass(id){K.doClockIn(APP.allClasses.find(c=>c.id===id)||null);},
async doClockIn(cls){APP.clockedIn=true;APP.clockInTime=new Date();APP.clockSessionId='tc_'+APP.user.uid+'_'+Date.now();APP.selectedClass=cls?{...cls,athleteObjects:APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id))}:{name:'General',athleteObjects:[]};APP.attState={};APP.attSavedClasses={};APP.skillState={};APP.attSaved=false;APP.notesSaved=false;APP.classNotes='';APP.issueNotes='';APP.sessionState={};if(cls){APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id)).forEach((_,i)=>{if(!APP.attState[cls.id])APP.attState[cls.id]={};APP.attState[cls.id][i]='present';});}try{await setDoc(doc(db,'timecards',APP.clockSessionId),{coachId:APP.user.uid,coachName:APP.profile?.name||'Coach',gymId:APP.gymId||null,classId:cls?.id||null,className:cls?.name||'General',date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),clockIn:APP.clockInTime.toISOString(),status:'active'});}catch(e){}APP.activeSkillClass=cls?.id||null;APP.view='coachDash';renderNav();render();toast(`✓ Clocked In${cls?` — ${cls.name}`:''}`);},
clockOut(){if(!APP.attSaved){toast('Save attendance first','warn');return;}K.openModal('coModal');['coS1','coS2','coS3','coS4'].forEach((id,i)=>{const e=$(id);if(e)e.style.display=i===0?'block':'none';});},
coTime(yes){$('coS1').style.display='none';$(yes?'coS3':'coS2').style.display='block';},
async coNote(){const n=val('coNote');if(n&&APP.clockSessionId)try{await setDoc(doc(db,'timecards',APP.clockSessionId),{directorNote:n},{merge:true});}catch(e){}$('coS2').style.display='none';$('coS3').style.display='block';},
coInjury(injured){if(injured){$('coS3').style.display='none';$('coS4').style.display='block';try{addDoc(collection(db,'injuries'),{coachId:APP.user.uid,coachName:APP.profile?.name,gymId:APP.gymId||null,classId:APP.selectedClass?.id,className:APP.selectedClass?.name||'',date:new Date().toISOString(),status:'pending',details:'Auto-logged at clock-out',autoLogged:true});}catch(e){}}else K.coFinish();},
async coFinish(){const now=new Date(),diff=APP.clockInTime?Math.floor((now-APP.clockInTime)/60000):0;const h=Math.floor(diff/60),m=diff%60,dur=h>0?`${h}h ${m}m`:`${m}m`;if(APP.clockSessionId)try{await setDoc(doc(db,'timecards',APP.clockSessionId),{clockOut:now.toISOString(),duration:dur,status:'pending'},{merge:true});}catch(e){}APP.clockedIn=false;K.closeModal('coModal');renderNav();toast('✓ Clocked Out');APP.view='coachDash';render();},
async saveNewClass(){const name=val('nc_name').trim(),day=val('nc_day'),time=val('nc_time').trim(),coachId=val('nc_coach'),cap=+val('nc_cap')||8,level=val('nc_level')||'Level 1',notes=val('nc_notes').trim();const coachObj=APP.allCoaches.find(c=>c.id===coachId);if(!name||!time){toast('Name and time required','warn');return;}try{const data={name,day,time,coachId,coachName:coachObj?.name||'TBD',coaches:coachId?[coachId]:[],cap,level,notes,athletes:[],gymId:APP.gymId||null,createdAt:new Date().toISOString()};const ref=await addDoc(collection(db,'classes'),data);APP.allClasses.push({id:ref.id,...data});K.closeModal('addClassModal');toast('✓ Class added!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async saveEditClass(id){const name=val('ec_name').trim(),day=val('ec_day'),time=val('ec_time').trim(),level=val('ec_level')||'Level 1',cap=+val('ec_cap')||8,notes=val('ec_notes').trim();const selCoaches=[...document.querySelectorAll('input[name="ec_coach"]:checked')].map(c=>c.value);const first=APP.allCoaches.find(c=>c.id===selCoaches[0]);const coachName=selCoaches.length===0?'TBD':selCoaches.length===1?(first?.name||'TBD'):`${first?.name||'Coach'} +${selCoaches.length-1}`;if(!name||!time){toast('Name and time required','warn');return;}try{const upd={name,day,time,level,cap,notes,coaches:selCoaches,coachId:selCoaches[0]||null,coachName};await setDoc(doc(db,'classes',id),upd,{merge:true});const cls=APP.allClasses.find(c=>c.id===id);if(cls)Object.assign(cls,upd);K.closeModal('editClassModal');toast('✓ Updated!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async saveNewAthlete(){const name=val('af_name').trim(),parentEmail=val('af_parentEmail').trim();if(!name||!parentEmail){toast('Name and parent email required','warn');return;}const level=document.getElementById('af_level')?.value||'Level 1';const data={name,initials:ini(name),parentEmail,parentName:val('af_parentName')||'',phone:val('af_phone')||'',dob:val('af_dob')||'',emName:val('af_emName')||'',emPhone:val('af_emPhone')||'',level,medical:val('af_medical')||'',tuitionAmount:+val('af_tuition')||185,billingCycle:val('af_billing')||'Monthly',coachNames:[],gymId:APP.gymId||null,tuitionStatus:'pending',createdAt:new Date().toISOString()};const selCls=[...document.querySelectorAll('input[name="af_class"]:checked')].map(c=>c.value);try{const ref=await addDoc(collection(db,'athletes'),data);for(const cid of selCls){const cls=APP.allClasses.find(c=>c.id===cid);if(cls){cls.athletes=[...(cls.athletes||[]),ref.id];await setDoc(doc(db,'classes',cid),{athletes:cls.athletes},{merge:true});}}try{const sec=initializeApp(FC,'parent_'+Date.now());const{getAuth:ga,createUserWithEmailAndPassword:cu,signOut:so}=await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js");const sa=ga(sec);await cu(sa,parentEmail,'Kinetic1!');await setDoc(doc(db,'users',(sa.currentUser?.uid||'_')),{name:val('af_parentName')||'Parent',email:parentEmail,role:'parent',belt:'',certifications:[],gymId:APP.gymId||null,gymName:APP.gymProfile?.name||'',firstLogin:true,createdAt:new Date().toISOString()});await so(sa);deleteApp(sec);toast(`✓ ${name} added! Parent: ${parentEmail} / Kinetic1!`);}catch(pe){toast(`✓ ${name} added!${pe.code==='auth/email-already-in-use'?' (Parent exists)':''}`);}APP.allAthletes.push({id:ref.id,...data});K.closeModal('addAthModal');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async saveEditAthlete(id){const ath=APP.allAthletes.find(a=>a.id===id);if(!ath)return;const g=(elId,fb)=>{const e=document.getElementById(elId);return(e&&e.value.trim()!=='')?e.value.trim():(fb||'');};const level=document.getElementById('af_level')?.value||ath.level||'Level 1';const updates={name:g('af_name',ath.name),parentEmail:g('af_parentEmail',ath.parentEmail),parentName:g('af_parentName',ath.parentName||''),phone:g('af_phone',ath.phone||''),dob:document.getElementById('af_dob')?.value||ath.dob||'',emName:g('af_emName',ath.emName||''),emPhone:g('af_emPhone',ath.emPhone||''),level,medical:g('af_medical',ath.medical||''),tuitionAmount:+(document.getElementById('af_tuition')?.value||ath.tuitionAmount||185),billingCycle:document.getElementById('af_billing')?.value||ath.billingCycle||'Monthly'};const selCls=[...document.querySelectorAll('input[name="af_class"]:checked')].map(c=>c.value);try{await setDoc(doc(db,'athletes',id),updates,{merge:true});Object.assign(ath,updates);for(const cls of APP.allClasses){const inSel=selCls.includes(cls.id),inCls=(cls.athletes||[]).includes(id);if(inSel&&!inCls){cls.athletes=[...(cls.athletes||[]),id];await setDoc(doc(db,'classes',cls.id),{athletes:cls.athletes},{merge:true});}if(!inSel&&inCls){cls.athletes=cls.athletes.filter(a=>a!==id);await setDoc(doc(db,'classes',cls.id),{athletes:cls.athletes},{merge:true});}}K.closeModal('editAthModal');toast('✓ Updated!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async archiveAthlete(id,name){if(!confirm(`Archive ${name}?`))return;try{await setDoc(doc(db,'athletes',id),{archived:true,archivedAt:new Date().toISOString()},{merge:true});const ath=APP.allAthletes.find(a=>a.id===id);if(ath){APP.allAthletes=APP.allAthletes.filter(a=>a.id!==id);APP.archivedAthletes=[...(APP.archivedAthletes||[]),{...ath,archived:true}];}toast(`✓ ${name} archived`);render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async unarchiveAthlete(id){try{await setDoc(doc(db,'athletes',id),{archived:false,archivedAt:null},{merge:true});const ath=(APP.archivedAthletes||[]).find(a=>a.id===id);if(ath){APP.archivedAthletes=APP.archivedAthletes.filter(a=>a.id!==id);APP.allAthletes=[...APP.allAthletes,{...ath,archived:false}];}toast('✓ Restored');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async generateInvite(){const name=val('inv_name').trim(),email=val('inv_email').trim(),belt=val('inv_belt')||'Foundation',type=APP.inviteType||'coach';if(!name||!email){toast('Name and email required','warn');return;}const defaultPass=type==='coach'?'CoachKinetic1!':'Kinetic1!';try{await addDoc(collection(db,'invites'),{email,name,role:type,belt:type==='coach'?belt:null,gymId:APP.gymId||null,gymName:APP.gymProfile?.name||'',createdBy:APP.user?.uid,createdAt:new Date().toISOString(),status:'pending'});let autoCreated=false;try{const sec=initializeApp(FC,'inv_'+Date.now());const{getAuth:ga,createUserWithEmailAndPassword:cu,signOut:so}=await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js");const sa=ga(sec);const cred=await cu(sa,email,defaultPass);await setDoc(doc(db,'users',cred.user.uid),{name,email,role:type,belt,certifications:[],gymId:APP.gymId||null,gymName:APP.gymProfile?.name||'',firstLogin:true,createdAt:new Date().toISOString()});if(type==='coach')APP.allCoaches.push({id:cred.user.uid,name,email,belt,gymId:APP.gymId});await so(sa);deleteApp(sec);autoCreated=true;}catch(e){if(e.code!=='auth/email-already-in-use')console.warn(e);}$('invResult').innerHTML=`<div style="font-size:12px;color:var(--green);font-weight:700;margin-bottom:10px;">✓ ${autoCreated?'Account Created':'Account Found'}</div><div style="margin-bottom:8px;"><div class="fl" style="margin-bottom:2px;">Email</div><div style="font-weight:700;">${email}</div></div>${autoCreated?`<div style="margin-bottom:8px;"><div class="fl" style="margin-bottom:2px;">Temp Password</div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;letter-spacing:2px;">${defaultPass}</div></div>`:''}<button class="btn" onclick="window.navigator.clipboard?.writeText('${email}\\n${defaultPass}').then(()=>window.toast('✓ Copied!'))">Copy Credentials</button>`;$('invResult').style.display='block';$('invActions').style.display='none';$('invDone').style.display='block';toast(`✓ ${name} ${autoCreated?'created':'found'}`);render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async saveEditCoach(id){const belt=val('ec_cbelt'),certs=[...document.querySelectorAll('input[name="ec_cert"]:checked')].map(c=>c.value);try{await setDoc(doc(db,'users',id),{belt,certifications:certs},{merge:true});const c=APP.allCoaches.find(x=>x.id===id);if(c){c.belt=belt;c.certifications=certs;}K.closeModal('editCoachModal');toast('✓ Updated!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async approveTC(id){try{await setDoc(doc(db,'timecards',id),{status:'approved'},{merge:true});APP.allTimecards=(APP.allTimecards||[]).map(t=>t.id===id?{...t,status:'approved'}:t);toast('✓ Approved');}catch(e){toast('⚠️ '+e.message,'warn');}},
async saveEditTC(id){const clockIn=$('tc_in')?.value,clockOut=$('tc_out')?.value,note=$('tc_note')?.value||'';const tc=APP.allTimecards?.find(t=>t.id===id);if(!tc)return;let dur=tc.duration||'';if(clockIn&&clockOut){const diff=Math.floor((new Date(clockOut)-new Date(clockIn))/60000);const h=Math.floor(diff/60),m=diff%60;dur=h>0?`${h}h ${m}m`:`${m}m`;}try{await setDoc(doc(db,'timecards',id),{clockIn:clockIn?new Date(clockIn).toISOString():tc.clockIn,clockOut:clockOut?new Date(clockOut).toISOString():tc.clockOut,duration:dur,directorNote:note,editHistory:[...(tc.editHistory||[]),{editedBy:APP.user?.uid,at:new Date().toISOString(),oldIn:tc.clockIn,oldOut:tc.clockOut,reason:note}],status:'approved'},{merge:true});const idx=(APP.allTimecards||[]).findIndex(t=>t.id===id);if(idx>-1)APP.allTimecards[idx]={...APP.allTimecards[idx],duration:dur,directorNote:note,status:'approved'};K.closeModal('editTCModal');toast('✓ Updated!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
exportTimecards(){const all=APP.allTimecards||[];const q=v=>{const s=String(v||'').replace(/"/g,'""');return'"'+s+'"';};const rows=[['Coach','Date','Clock In','Clock Out','Duration','Status','Note'],...all.map(t=>[t.coachName,t.date,t.clockIn,t.clockOut,t.duration,t.status,t.directorNote].map(q))];const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(rows.map(r=>r.join(',')).join('\r\n'));a.download='KINETIC_Timecards.csv';a.click();toast('✓ Exported!');},
async sendMsg(){const toRaw=val('msg_to'),subject=val('msg_sub').trim()||'Message',body=val('msg_body').trim();if(!body){toast('Write a message first','warn');return;}let toId=null,toRole=null,classId=null;if(['coaches','parents','director'].includes(toRaw))toRole=toRaw;else if(toRaw.startsWith('class_')){classId=toRaw.replace('class_','');toRole='class';}else toId=toRaw;try{await addDoc(collection(db,'messages'),{from:APP.profile?.name||'User',fromId:APP.user?.uid,fromRole:APP.role,toId,toRole,classId,subject,body,preview:body.slice(0,80),threadId:Date.now().toString(36),time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),read:false,gymId:APP.gymId||null,createdAt:new Date().toISOString()});K.closeModal('newMsgModal');toast('✓ Sent!');}catch(e){toast('⚠️ '+e.message,'warn');}},
async sendReply(toId,subject,threadId){const body=val('replyBody').trim();if(!body){toast('Write a reply first','warn');return;}try{await addDoc(collection(db,'messages'),{from:APP.profile?.name||'User',fromId:APP.user?.uid,fromRole:APP.role,toId:toId||null,toRole:null,subject,body,preview:'You: '+body.slice(0,70),threadId:threadId||null,time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),read:false,gymId:APP.gymId||null,createdAt:new Date().toISOString()});K.closeModal('msgViewModal');render();toast('✓ Reply sent!');}catch(e){toast('⚠️ '+e.message,'warn');}},
async sendTuitionReminder(athId){const ath=APP.allAthletes.find(a=>a.id===athId);if(!ath)return;K.openModal('newMsgModal',{role:'director',reminder:true,ath});},
async saveTuition(id){const amt=+val('et_amt')||185,cycle=val('et_cycle')||'Monthly',stat=val('et_stat')||'pending';try{await setDoc(doc(db,'athletes',id),{tuitionAmount:amt,billingCycle:cycle,tuitionStatus:stat},{merge:true});const ath=APP.allAthletes.find(a=>a.id===id);if(ath){ath.tuitionAmount=amt;ath.billingCycle=cycle;ath.tuitionStatus=stat;}K.closeModal('editTuitionModal');toast('✓ Updated!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async saveCharge(){const athId=val('ch_ath'),type=val('ch_type'),amount=+val('ch_amt')||0,desc=val('ch_desc').trim()||type;try{await addDoc(collection(db,'charges'),{athId,type,amount,desc,gymId:APP.gymId||null,createdAt:new Date().toISOString(),status:'pending'});K.closeModal('addChargeModal');toast(`✓ $${amount} charge added!`);}catch(e){toast('⚠️ '+e.message,'warn');}},
async approveSubReq(id){try{await setDoc(doc(db,'subRequests',id),{status:'open'},{merge:true});APP.subRequests=(APP.subRequests||[]).map(r=>r.id===id?{...r,status:'open'}:r);toast('✓ Posted to Sub Board');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async denySubReq(id){try{await setDoc(doc(db,'subRequests',id),{status:'denied'},{merge:true});APP.subRequests=(APP.subRequests||[]).filter(s=>s.id!==id);toast('Denied');render();}catch(e){}},
async claimSub(id){try{await setDoc(doc(db,'subRequests',id),{subCoachId:APP.user.uid,subCoachName:APP.profile?.name,status:'claimed'},{merge:true});APP.subRequests=(APP.subRequests||[]).map(r=>r.id===id?{...r,subCoachId:APP.user.uid,subCoachName:APP.profile?.name,status:'claimed'}:r);toast('✓ Sent to director!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async approveSubClaim(id){try{const r=APP.subRequests?.find(s=>s.id===id);if(!r)return;await setDoc(doc(db,'subRequests',id),{status:'awaiting_original'},{merge:true});APP.subRequests=(APP.subRequests||[]).map(s=>s.id===id?{...s,status:'awaiting_original'}:s);await addDoc(collection(db,'messages'),{from:'KINETIC',fromId:'system',fromRole:'system',toId:r.requestedBy,toRole:null,subject:`Can ${r.subCoachName} sub your class?`,body:`${r.subCoachName} has volunteered to cover ${r.className} on ${r.date}. Please approve below.`,subRequestId:id,type:'sub_confirm_request',threadId:'sub_'+id,time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),read:false,gymId:APP.gymId||null,createdAt:new Date().toISOString()});toast('✓ Sent for final OK');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async confirmSubFromCoach(subReqId){try{const r=APP.subRequests?.find(s=>s.id===subReqId);if(!r){toast('Not found','warn');return;}await setDoc(doc(db,'subRequests',subReqId),{status:'confirmed'},{merge:true});APP.subRequests=(APP.subRequests||[]).map(s=>s.id===subReqId?{...s,status:'confirmed'}:s);APP.messages=(APP.messages||[]).map(m=>m.type==='sub_confirm_request'&&m.subRequestId===subReqId?{...m,read:true}:m);try{await Promise.all((APP.messages||[]).filter(m=>m.type==='sub_confirm_request'&&m.subRequestId===subReqId&&m.id).map(m=>setDoc(doc(db,'messages',m.id),{read:true},{merge:true})));}catch(e){}const ann=`${r.subCoachName} is confirmed to sub ${r.className} on ${r.date}.`;const tid=Date.now().toString(36);const base={from:'KINETIC',fromId:'system',fromRole:'system',threadId:tid,time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),read:false,gymId:APP.gymId||null,createdAt:new Date().toISOString(),body:ann,preview:ann};await Promise.all([addDoc(collection(db,'messages'),{...base,toId:r.requestedBy,subject:`Confirmed: Sub for ${r.className}`}),addDoc(collection(db,'messages'),{...base,toId:r.subCoachId,subject:`You're confirmed: ${r.className}`}),addDoc(collection(db,'messages'),{...base,toId:null,toRole:'director',subject:`Sub Confirmed: ${r.className}`})]);const cls=APP.allClasses.find(c=>c.id===r.classId);if(cls&&r.subCoachId){const uc=[...new Set([...(cls.coaches||[]),r.subCoachId])];await setDoc(doc(db,'classes',r.classId),{coaches:uc},{merge:true});cls.coaches=uc;}toast('✓ Confirmed!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async denySubFinal(subReqId){try{if(!subReqId)return;await setDoc(doc(db,'subRequests',subReqId),{status:'denied'},{merge:true});APP.subRequests=(APP.subRequests||[]).filter(s=>s.id!==subReqId);toast('Sub denied');render();}catch(e){}},
async submitSubReq(){const clsId=val('sub_cls'),date=val('sub_date'),reason=val('sub_reason').trim();const cls=APP.allClasses.find(c=>c.id===clsId);if(!date||!reason){toast('Date and reason required','warn');return;}try{await addDoc(collection(db,'subRequests'),{className:cls?.name||'Class',classId:clsId,date,reason,requestedBy:APP.user.uid,requestedByName:APP.profile?.name||'Coach',status:'pending',requiredBelt:cls?.level||'Level 1',gymId:APP.gymId||null,createdAt:new Date().toISOString()});K.closeModal('subReqModal');toast('✓ Sub request sent!');}catch(e){toast('⚠️ '+e.message,'warn');}},
async resolveInjury(id){try{await setDoc(doc(db,'injuries',id),{status:'resolved'},{merge:true});const inj=APP.allInjuries?.find(i=>i.id===id);if(inj)inj.status='resolved';toast('✓ Resolved');render();}catch(e){}},
async dismissConcern(noteId){try{await setDoc(doc(db,'notes',noteId),{dismissed:true},{merge:true});APP.coachConcerns=(APP.coachConcerns||[]).filter(n=>n.id!==noteId);render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async saveClassNotes(id){const notes=document.getElementById(`cls_notes_${id}`)?.value||'';try{await setDoc(doc(db,'classes',id),{notes},{merge:true});const cls=APP.allClasses.find(c=>c.id===id);if(cls)cls.notes=notes;toast('✓ Saved!');}catch(e){toast('⚠️ '+e.message,'warn');}},
async addCoachToClass(classId,coachId){if(!coachId)return;try{const cls=APP.allClasses.find(c=>c.id===classId);if(!cls)return;const coaches=[...new Set([...(cls.coaches||[]),coachId])];const co=APP.allCoaches.find(c=>c.id===coachId);await setDoc(doc(db,'classes',classId),{coaches,coachId:coaches[0],coachName:co?.name||'TBD'},{merge:true});cls.coaches=coaches;toast('✓ Added');K.openModal('classModal',{classId});}catch(e){toast('⚠️ '+e.message,'warn');}},
async removeAthFromClass(classId,athId){try{const cls=APP.allClasses.find(c=>c.id===classId);if(!cls)return;cls.athletes=(cls.athletes||[]).filter(a=>a!==athId);await setDoc(doc(db,'classes',classId),{athletes:cls.athletes},{merge:true});toast('✓ Removed');K.openModal('classModal',{classId});}catch(e){toast('⚠️ '+e.message,'warn');}},
async addAthToClass(classId,athId){if(!athId)return;try{const cls=APP.allClasses.find(c=>c.id===classId);if(!cls)return;if(!(cls.athletes||[]).includes(athId))cls.athletes=[...(cls.athletes||[]),athId];await setDoc(doc(db,'classes',classId),{athletes:cls.athletes},{merge:true});toast('✓ Added');K.openModal('classModal',{classId});}catch(e){toast('⚠️ '+e.message,'warn');}},
addMakeupAthlete(classId){const athId=$('mu_ath')?.value;if(!athId){toast('Select an athlete','warn');return;}if(!APP.makeupAthletes)APP.makeupAthletes={};if(!APP.makeupAthletes[classId])APP.makeupAthletes[classId]=[];APP.makeupAthletes[classId].push({athId,date:new Date().toISOString().split('T')[0]});K.closeModal('addMakeupModal');toast('✓ Makeup athlete added');render();},
async loadAttendanceRecords(){const viewDate=APP.attViewDate||new Date().toISOString().split('T')[0];const dayName=new Date(viewDate+'T12:00').toLocaleDateString('en-US',{weekday:'long'});APP.attRecords=APP.attRecords||{};try{await Promise.all(APP.allClasses.filter(c=>c.day===dayName).map(async cls=>{const key=viewDate+'_'+cls.id;try{const snap=await getDoc(doc(db,'attendance/'+key));APP.attRecords[key]=snap.exists()?{id:snap.id,...snap.data()}:null;}catch(e){APP.attRecords[key]=null;}}));}catch(e){}},
async editAttRecord(date,clsId,athId,status){const key=date+'_'+clsId;const rec=APP.attRecords?.[key]||{presentIds:[],absentIds:[],classId:clsId,date,gymId:APP.gymId||null};let{presentIds=[],absentIds=[]}=rec;if(status==='present'){presentIds=[...new Set([...presentIds,athId])];absentIds=absentIds.filter(id=>id!==athId);}else{absentIds=[...new Set([...absentIds,athId])];presentIds=presentIds.filter(id=>id!==athId);}try{await setDoc(doc(db,'attendance/'+key),{...rec,presentIds,absentIds,updatedAt:new Date().toISOString()},{merge:true});APP.attRecords[key]={...rec,presentIds,absentIds};toast('✓ Updated');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async changePassword(){const np=val('cpNew'),cf=val('cpConf'),err=$('cpErr');err.style.display='none';if(np.length<6){err.textContent='At least 6 characters.';err.style.display='block';return;}if(np!==cf){err.textContent='Passwords do not match.';err.style.display='block';return;}try{await updatePassword(auth.currentUser,np);await setDoc(doc(db,'users',APP.user.uid),{firstLogin:false},{merge:true});APP.profile.firstLogin=false;K.closeModal('changePwModal');toast('✓ Password updated!');}catch(e){const err2=$('cpErr');err2.textContent=e.code==='auth/requires-recent-login'?'Sign out and back in first.':e.message;err2.style.display='block';}},
nav_attDay(day){APP.attDay=day;render();},
async saveDocument(){const name=val('doc_name').trim(),fileUrl=val('doc_url').trim(),fileType=val('doc_type')||'other',description=val('doc_desc').trim(),sharedWith=val('doc_share');if(!name){toast('Document name required','warn');return;}let sharedWithIds=[];if(sharedWith==='class'){sharedWithIds=[...document.querySelectorAll('input[name="doc_share_ids"]:checked')].map(c=>c.value);}else if(sharedWith==='athlete'){sharedWithIds=[...document.querySelectorAll('input[name="doc_share_ids"]:checked')].map(c=>c.value);}try{const data={name,fileUrl,fileType,description,sharedWith,sharedWithIds,uploadedBy:APP.user?.uid,uploadedByName:APP.profile?.name||'Director',gymId:APP.gymId||null,createdAt:new Date().toISOString()};const ref=await addDoc(collection(db,'documents'),data);APP.allDocuments=[{id:ref.id,...data},...APP.allDocuments];K.closeModal('uploadDocModal');toast('✓ Document saved!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async deleteDocument(id){if(!confirm('Delete this document?'))return;try{await deleteDoc(doc(db,'documents',id));APP.allDocuments=(APP.allDocuments||[]).filter(d=>d.id!==id);toast('✓ Deleted');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async saveRoutine(){const name=val('rout_name').trim(),videoUrl=val('rout_video').trim(),audioUrl=val('rout_audio').trim(),notes=val('rout_notes').trim(),clsId=val('rout_class');if(!name){toast('Routine name required','warn');return;}const cls=APP.allClasses.find(c=>c.id===clsId);try{const data={name,videoUrl,audioUrl,notes,classId:clsId||null,className:cls?.name||'All Classes',level:cls?.level||'',createdBy:APP.user?.uid,gymId:APP.gymId||null,createdAt:new Date().toISOString()};const ref=await addDoc(collection(db,'routines'),data);APP.allRoutines=[{id:ref.id,...data},...APP.allRoutines];K.closeModal('uploadRoutineModal');toast('✓ Routine saved!');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
async deleteRoutine(id){if(!confirm('Delete this routine?'))return;try{await deleteDoc(doc(db,'routines',id));APP.allRoutines=(APP.allRoutines||[]).filter(r=>r.id!==id);toast('✓ Deleted');render();}catch(e){toast('⚠️ '+e.message,'warn');}},
};

function buildUploadDocForm(){
  return`<div class="mo-title">Upload Document</div>
  <div class="alert info" style="font-size:12px;">Paste a link (Google Drive, Dropbox, etc.) to share with parents.</div>
  <div class="fg"><label class="fl">Document Name *</label><input class="fi" id="doc_name" placeholder="e.g. Spring Schedule, Registration Form"></div>
  <div class="fg"><label class="fl">Link / URL</label><input class="fi" id="doc_url" type="url" placeholder="https://drive.google.com/..."></div>
  <div class="fg"><label class="fl">File Type</label><select class="fs" id="doc_type"><option value="pdf">PDF</option><option value="image">Image</option><option value="form">Form</option><option value="link">Link</option><option value="other">Other</option></select></div>
  <div class="fg"><label class="fl">Description (optional)</label><input class="fi" id="doc_desc" placeholder="Brief description..."></div>
  <div class="fg"><label class="fl">Share With</label><select class="fs" id="doc_share" onchange="window._updateDocShareUI(this.value)"><option value="all">All Parents</option><option value="class">Specific Class(es)</option><option value="athlete">Specific Athlete(s)</option></select></div>
  <div id="doc_share_ids_wrap" style="display:none;margin-bottom:14px;"></div>
  <div style="display:flex;gap:8px;"><button class="btn" style="flex:1;" onclick="K.closeModal('uploadDocModal')">Cancel</button><button class="btn primary" style="flex:1;" onclick="K.saveDocument()">Save →</button></div>`;
}

window._updateDocShareUI=function(val){
  const wrap=document.getElementById('doc_share_ids_wrap');if(!wrap)return;
  if(val==='all'){wrap.style.display='none';return;}
  wrap.style.display='block';
  if(val==='class'){wrap.innerHTML=`<label class="fl">Select Classes</label><div style="border:1px solid var(--bdr);border-radius:4px;background:var(--bg);padding:8px;max-height:180px;overflow-y:auto;">${APP.allClasses.map(c=>`<label style="display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;"><input type="checkbox" name="doc_share_ids" value="${c.id}" style="accent-color:var(--gold);"><span style="font-size:13px;">${c.name} — ${c.day} ${c.time}</span></label>`).join('')}</div>`;}
  else{wrap.innerHTML=`<label class="fl">Select Athletes</label><div style="border:1px solid var(--bdr);border-radius:4px;background:var(--bg);padding:8px;max-height:180px;overflow-y:auto;">${APP.allAthletes.map(a=>`<label style="display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;"><input type="checkbox" name="doc_share_ids" value="${a.id}" style="accent-color:var(--gold);"><div class="mini-av" style="width:20px;height:20px;font-size:8px;">${ini(a.name)}</div><span style="font-size:13px;">${a.name}</span></label>`).join('')}</div>`;}
};

function buildUploadRoutineForm(){
  return`<div class="mo-title">Add Routine / Media</div>
  <div class="fg"><label class="fl">Name *</label><input class="fi" id="rout_name" placeholder="e.g. Level 1 Floor Routine"></div>
  <div class="fg"><label class="fl">Video Link (YouTube, Drive, etc.)</label><input class="fi" id="rout_video" type="url" placeholder="https://youtube.com/..."></div>
  <div class="fg"><label class="fl">Audio / Music Link</label><input class="fi" id="rout_audio" type="url" placeholder="https://drive.google.com/..."></div>
  <div class="fg"><label class="fl">Assign to Class (optional)</label><select class="fs" id="rout_class"><option value="">All Classes</option>${APP.allClasses.map(c=>`<option value="${c.id}">${c.name} — ${c.day}</option>`).join('')}</select></div>
  <div class="fg"><label class="fl">Notes</label><textarea class="ft" id="rout_notes" style="min-height:60px;" placeholder="Any notes for parents or athletes..."></textarea></div>
  <div style="display:flex;gap:8px;"><button class="btn" style="flex:1;" onclick="K.closeModal('uploadRoutineModal')">Cancel</button><button class="btn primary" style="flex:1;" onclick="K.saveRoutine()">Save →</button></div>`;
}

function buildAthForm(ath={},editing=false){
  const currentClasses=editing?APP.allClasses.filter(c=>(c.athletes||[]).includes(ath.id)).map(c=>c.id):[];
  return`<div class="mo-title">${editing?'Edit Athlete':'Add Athlete'}</div>
  <div class="fg"><label class="fl">Full Name *</label><input class="fi" id="af_name" value="${ath.name||''}" placeholder="First Last"></div>
  <div class="g2" style="margin-bottom:0;"><div class="fg"><label class="fl">Date of Birth</label><input class="fi" type="date" id="af_dob" value="${ath.dob||''}"></div><div class="fg"><label class="fl">Level</label><select class="fs" id="af_level">${BELT_LEVELS.map(l=>`<option value="${l}"${ath.level===l?' selected':''}>${l}</option>`).join('')}</select></div></div>
  <div class="fg"><label class="fl">Parent Name *</label><input class="fi" id="af_parentName" value="${ath.parentName||''}" placeholder="First Last"></div>
  <div class="fg"><label class="fl">Parent Email *</label><input class="fi" type="email" id="af_parentEmail" value="${ath.parentEmail||''}" placeholder="parent@email.com"></div>
  <div class="fg"><label class="fl">Parent Phone</label><input class="fi" type="tel" id="af_phone" value="${ath.phone||''}" placeholder="(555) 000-0000"></div>
  <div class="g2" style="margin-bottom:0;"><div class="fg"><label class="fl">Emergency Contact</label><input class="fi" id="af_emName" value="${ath.emName||''}" placeholder="Name & Relationship"></div><div class="fg"><label class="fl">Emergency Phone</label><input class="fi" type="tel" id="af_emPhone" value="${ath.emPhone||''}" placeholder="(555) 000-0000"></div></div>
  <div class="fg"><label class="fl">Assign to Classes</label><div style="border:1px solid var(--bdr);border-radius:4px;background:var(--bg);padding:8px;max-height:160px;overflow-y:auto;">${APP.allClasses.length===0?`<div style="font-size:12px;color:var(--t3);padding:8px;">No classes yet.</div>`:APP.allClasses.map(c=>`<label style="display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;"><input type="checkbox" name="af_class" value="${c.id}" style="accent-color:var(--gold);"${currentClasses.includes(c.id)?' checked':''}><span style="font-size:13px;">${c.name} — ${c.day} ${c.time}</span></label>`).join('')}</div></div>
  <div class="g2" style="margin-bottom:0;"><div class="fg"><label class="fl">Monthly Amount ($)</label><input class="fi" type="number" id="af_tuition" value="${ath.tuitionAmount||185}"></div><div class="fg"><label class="fl">Billing Cycle</label><select class="fs" id="af_billing"><option${ath.billingCycle==='Monthly'?' selected':''}>Monthly</option><option${ath.billingCycle==='Per Semester'?' selected':''}>Per Semester</option><option${ath.billingCycle==='Annual'?' selected':''}>Annual</option></select></div></div>
  <div class="fg"><label class="fl">Medical Notes</label><textarea class="ft" id="af_medical" style="min-height:55px;">${ath.medical||''}</textarea></div>
  <div style="display:flex;gap:8px;"><button class="btn" style="flex:1;" onclick="K.closeModal('${editing?'editAthModal':'addAthModal'}')">Cancel</button><button class="btn primary" style="flex:1;" onclick="K.${editing?`saveEditAthlete('${ath.id}')`:'saveNewAthlete()'}">${editing?'Save Changes →':'Add Athlete →'}</button></div>`;
}

function buildAthDetail(ath){
  const classes=APP.allClasses.filter(c=>(c.athletes||[]).includes(ath.id));
  return`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;"><div style="display:flex;align-items:center;gap:12px;"><div class="user-av" style="width:48px;height:48px;font-size:16px;">${ini(ath.name)}</div><div><h3 style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;">${ath.name}</h3><div class="belt-b" style="margin-top:4px;"><div class="belt-d" style="background:${BELT_COLORS[ath.level]||'#E8C84A'};"></div>${ath.level||'Level 1'}</div></div></div><div style="display:flex;gap:8px;"><button class="btn" onclick="K.closeModal('viewAthModal');K.openModal('editAthModal',{id:'${ath.id}'})">Edit</button><button class="btn" onclick="K.closeModal('viewAthModal')">✕</button></div></div>
  <div class="g2" style="margin-bottom:14px;"><div><div class="sl">Parent</div><div style="font-size:13px;font-weight:600;">${ath.parentName||'—'}</div><div style="font-size:12px;color:var(--t3);">${ath.parentEmail||'—'} · ${ath.phone||''}</div></div><div><div class="sl">Emergency</div><div style="font-size:13px;font-weight:600;">${ath.emName||'—'}</div><div style="font-size:12px;color:var(--t3);">${ath.emPhone||'—'}</div></div></div>
  ${ath.medical?`<div class="alert danger" style="margin-bottom:14px;"><strong>⚠️ Medical:</strong> ${ath.medical}</div>`:''}
  <div style="margin-bottom:14px;"><div class="sl">Classes</div>${classes.length===0?`<span style="font-size:13px;color:var(--t3);">None assigned</span>`:classes.map(c=>`<span class="pill gold-p" style="margin-right:6px;margin-bottom:4px;">${c.name} · ${c.day}</span>`).join('')}</div>
  <div><div class="sl">Tuition</div><span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;">$${ath.tuitionAmount||185}/mo</span><span class="pill ${ath.tuitionStatus==='paid'?'present':ath.tuitionStatus==='overdue'?'absent':'gold-p'}" style="margin-left:8px;">${ath.tuitionStatus||'Pending'}</span></div>`;
}

function buildEditClassForm(cls){
  return`<div class="mo-title">Edit Class</div>
  <div class="fg"><label class="fl">Class Name *</label><input class="fi" id="ec_name" value="${cls.name||''}"></div>
  <div class="g2" style="margin-bottom:0;"><div class="fg"><label class="fl">Day</label><select class="fs" id="ec_day">${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>`<option value="${d}"${cls.day===d?' selected':''}>${d}</option>`).join('')}</select></div><div class="fg"><label class="fl">Time *</label><input class="fi" id="ec_time" value="${cls.time||''}"></div></div>
  <div class="g2" style="margin-bottom:0;"><div class="fg"><label class="fl">Level</label><select class="fs" id="ec_level">${BELT_LEVELS.map(l=>`<option value="${l}"${cls.level===l?' selected':''}>${l}</option>`).join('')}</select></div><div class="fg"><label class="fl">Capacity</label><input class="fi" type="number" id="ec_cap" value="${cls.cap||8}" min="1"></div></div>
  <div class="fg"><label class="fl">Notes</label><textarea class="ft" id="ec_notes" style="min-height:60px;">${cls.notes||''}</textarea></div>
  <div class="fg"><label class="fl">Coaches</label><div style="border:1px solid var(--bdr);border-radius:4px;background:var(--bg);padding:8px;max-height:140px;overflow-y:auto;">${APP.allCoaches.length===0?'<div style="font-size:12px;color:var(--t3);padding:4px;">No coaches yet.</div>':APP.allCoaches.map(c=>`<label style="display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;"><input type="checkbox" name="ec_coach" value="${c.id}" style="accent-color:var(--gold);"${(cls.coaches||[]).includes(c.id)?' checked':''}><div class="mini-av" style="width:22px;height:22px;font-size:9px;">${ini(c.name)}</div><span style="font-size:13px;">${c.name}</span></label>`).join('')}</div></div>
  <div style="display:flex;gap:8px;"><button class="btn" style="flex:1;" onclick="K.closeModal('editClassModal')">Cancel</button><button class="btn primary" style="flex:1;" onclick="K.saveEditClass('${cls.id}')">Save →</button></div>`;
}

function buildClassDetail(cls){
  const inClass=APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id));
  const notIn=APP.allAthletes.filter(a=>!(cls.athletes||[]).includes(a.id));
  const assignedCoaches=APP.allCoaches.filter(c=>(cls.coaches||[]).includes(c.id));
  return`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;"><div><h3 style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;">${cls.name}</h3><div style="font-size:13px;color:var(--t2);margin-top:4px;">📅 ${cls.day} · ${cls.time} · ${cls.level}</div></div><button class="btn" onclick="K.closeModal('classModal')">✕</button></div>
  <div style="margin-bottom:14px;"><div class="sl">Coaches</div><div style="border:1px solid var(--bdr);border-radius:6px;overflow:hidden;">${assignedCoaches.length===0?`<div style="padding:12px 14px;font-size:13px;color:var(--t3);">None assigned</div>`:assignedCoaches.map(c=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;"><div class="mini-av">${ini(c.name)}</div><div style="font-size:13px;font-weight:600;">${c.name}</div></div>`).join('')}</div></div>
  <div class="fg"><label class="fl">Notes</label><textarea class="ft" id="cls_notes_${cls.id}" style="min-height:55px;">${cls.notes||''}</textarea><button class="btn primary" style="margin-top:6px;" onclick="K.saveClassNotes('${cls.id}')">Save Notes</button></div>
  <div style="margin:14px 0 8px;"><h3 style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;">Athletes (${inClass.length}/${cls.cap||8})</h3></div>
  ${inClass.map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--bdr2);"><div class="mini-av">${ini(a.name)}</div><span style="flex:1;font-size:13px;font-weight:600;">${a.name}</span><button class="btn danger" style="font-size:10px;padding:4px 8px;" onclick="K.removeAthFromClass('${cls.id}','${a.id}')">Remove</button></div>`).join('')}
  ${notIn.length>0?`<div style="margin-top:14px;"><div class="fl">Add Athletes</div><div style="max-height:180px;overflow-y:auto;border:1px solid var(--bdr);border-radius:4px;">${notIn.map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--bdr2);"><div class="mini-av">${ini(a.name)}</div><span style="flex:1;font-size:13px;">${a.name}</span><button class="btn primary" style="font-size:10px;padding:4px 10px;" onclick="K.addAthToClass('${cls.id}','${a.id}')">+ Add</button></div>`).join('')}</div></div>`:''}`;
}

function buildEditCoachForm(c){
  return`<div class="mo-title">Edit Coach — ${c.name}</div>
  <div class="fg"><label class="fl">Belt Level</label><select class="fs" id="ec_cbelt">${BELT_LEVELS.map(l=>`<option value="${l}"${c.belt===l?' selected':''}>${l}</option>`).join('')}</select></div>
  <div class="fg"><label class="fl">Certifications</label><div style="border:1px solid var(--bdr);border-radius:4px;background:var(--bg);padding:8px;max-height:200px;overflow-y:auto;">${BELT_LEVELS.slice(0,7).map(l=>`<label style="display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;"><input type="checkbox" name="ec_cert" value="${l}" style="accent-color:var(--gold);"${(c.certifications||[]).includes(l)||(c.belt===l)?' checked':''}><div style="display:flex;align-items:center;gap:6px;"><div class="belt-d" style="background:${BELT_COLORS[l]};"></div><span style="font-size:13px;">${l}</span></div></label>`).join('')}</div></div>
  <div style="display:flex;gap:8px;"><button class="btn" style="flex:1;" onclick="K.closeModal('editCoachModal')">Cancel</button><button class="btn primary" style="flex:1;" onclick="K.saveEditCoach('${c.id}')">Save →</button></div>`;
}

window._SKILLS=SKILLS;
window.toast=toast;
window.render=render;
