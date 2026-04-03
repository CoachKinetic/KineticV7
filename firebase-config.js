import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

export const auth = getAuth(initializeApp({
  apiKey:"AIzaSyCmG-MfINmp1rMQOsXGNmRkBxJROSdqyqk",
  authDomain:"kinetic-a4862.firebaseapp.com",
  projectId:"kinetic-a4862",
  storageBucket:"kinetic-a4862.firebasestorage.app",
  messagingSenderId:"924145283660",
  appId:"1:924145283660:web:f1135f7000d9e4897f7ae9"
}));
export const db = getFirestore(auth.app);

export const APP = {
  user:null, profile:null, role:null, gymId:null, gymProfile:null, plan:'crew',
  view:'home',
  // Coach session
  clockedIn:false, clockInTime:null, clockSessionId:null,
  selectedClass:null, // full class object with athleteObjects[]
  attState:{}, attSaved:false,
  skillState:{}, notesSaved:false,
  classNotes:'', issueNotes:'', privateNotes:{},
  simpleMode:false, simpleStep:'att', simpleEvent:null, simpleAthIdx:0,
  lessonLevel:'Level 1',
  // Gym data
  allClasses:[], allAthletes:[], archivedAthletes:[], allCoaches:[],
  allTimecards:[], myTimecards:[], subRequests:[], allInjuries:[], messages:[],
  // Parent
  parentAthletes:[], parentAthIdx:0,
  // UI
  libLevel:'all', libEvent:'all',
  athleteTab:'active',
};

export const BELT_LEVELS = ['Foundation','Level 1','Level 2','Level 3','Level 4','Level 5','Xcel Bronze','Xcel Silver','Xcel Gold','Xcel Platinum'];
export const BELT_COLORS = {'Foundation':'#E8E8E8','Level 1':'#E8C84A','Level 2':'#E8894A','Level 3':'#4A9B6F','Level 4':'#4A7AB8','Level 5':'#7B5EA7','Xcel Bronze':'#CD8B4A','Xcel Silver':'#A8A9AD','Xcel Gold':'#B5996A','Xcel Platinum':'#8BA9BE'};

export const SKILLS = [
  {id:'f1',level:'Foundation',event:'General',name:'Pointed Toes',spot:'Form Spot',correct:'Foot fully extended, toes reaching long.',cues:'Write with your toes! · Reach long!',drill:'Show lazy feet vs pointed. Ask them to write on the ceiling.',errors:[{e:'Flexed foot',f:'Write with your toes!',c:'Theraband pointing'}],deductions:[{d:'Flexed or sickled foot',v:'^0.10'}],principle:'Get it in the body not just the brain'},
  {id:'f2',level:'Foundation',event:'General',name:'Strong Arms',spot:'Form Spot',correct:'Arms fully extended, engaged. Elbows NOT locked.',cues:'Strong arm check! · Strong not straight!',drill:'Strong Arm Check — push on each arm. Strong but not locked.',errors:[{e:'Locked elbows',f:'Strong not locked!',c:'Strong arm check drill'}],deductions:[{d:'Bars — bent arms',v:'^0.20–0.50'},{d:'Vault — arms bent',v:'^0.50'}],principle:'Strong not Straight'},
  {id:'f3',level:'Foundation',event:'General',name:'Hollow Body',spot:'Form Spot',correct:'Lower back pressed flat, belly button to spine.',cues:'SQUISH THE BUG! · Push belly button to floor!',drill:'Squish the Bug — slide hand under lower back.',errors:[{e:'Arched lower back',f:'SQUISH THE BUG!',c:'Hollow body holds 10-30 sec'}],deductions:[{d:'Hollow (BHC)',v:'^0.20'},{d:'Vault arched',v:'^0.30'}],principle:'Get it in the body not just the brain'},
  {id:'f4',level:'Foundation',event:'General',name:'Lunge',spot:'Form Spot',correct:'Front knee over front foot, back leg extended, hips square.',cues:'Knee over toe! · Tall body!',drill:'The Push — gentle push from behind.',errors:[{e:'Knee collapsing',f:'Knee over your toe!',c:'Lunge holds'}],deductions:[{d:'Cartwheel hand placement',v:'0.10'}],principle:'Get it in the body not just the brain'},
  {id:'f5',level:'Foundation',event:'General',name:'Relevé',spot:'Form Spot',correct:'Weight on balls of feet, heels lifted, strong ankles.',cues:'String pulling you to the ceiling! · Grow tall!',drill:'The String — imagine a string pulling straight up.',errors:[{e:'Sickled ankles',f:'Push through ball of foot evenly',c:'Relevé holds'}],deductions:[{d:'Beam relevé 2 sec',v:'^0.20'}],principle:'Get it in the body not just the brain'},
  {id:'f6',level:'Foundation',event:'General',name:'Stick',spot:'Form Spot',correct:'Two foot landing, strong knees absorb, feet do not move.',cues:"Land on hot lava — don't move! · Feet are GLUED!",drill:'Jump and stick drills. Every landing = full freeze.',errors:[{e:'Steps on landing',f:'Feet are GLUED!',c:'Jump and stick drills'}],deductions:[{d:'Steps on landing',v:'ea 0.10'},{d:'Fall',v:'0.50'}],principle:'Gym culture starts at Level 1'},
  {id:'f7',level:'Foundation',event:'General',name:'Salute',spot:'Form Spot',correct:'After stick — arms raise tall. Confident, controlled.',cues:'Show the judge you meant it! · Own it!',drill:'Full finish: skill → stick → salute → exit.',errors:[{e:'Forgetting to salute',f:'Every landing ends with a salute.',c:'Full finish sequence every rep'}],deductions:[{d:'Failure to salute',v:'0.20–0.30'}],principle:'Gym culture starts at Level 1'},
  {id:'l1v1',level:'Level 1',event:'Vault',name:'Stretch Jump to Handstand Flatback',spot:'TRUE SPOT',mantra:'Run · Circle · Punch',correct:'Sprint → hurdle → punch → stretch jump → handstand → flat back. Ankles before bums.',cues:'Run · Circle · Punch! · Lean · Kick · Push! · Ankles before bums!',drill:'Mat progression: 8→16→24→32→36in rezi.',errors:[{e:'Piked handstand',f:'Push tall',c:'Handstand holds'},{e:'Bent arms',f:'Strong arms!',c:'Push-up holds'}],deductions:[{d:'Arms bent',v:'^0.50'},{d:'Arched body',v:'^0.30'},{d:'Head contact',v:'2.00'}],principle:'Confidence before height. Always.',spotWarning:'TRUE SPOT — you are supporting an inverted athlete.'},
  {id:'l1b1',level:'Level 1',event:'Bars',name:'Pullover',spot:'TRUE SPOT',correct:'Chin up · Hips up · Toes over. Finish in front support.',cues:'Chin Up · Hips Up · Toes Over! · Barbie thumbs!',drill:'Chin-up hold → hip pop drill → toes-over on low bar.',errors:[{e:'One-foot takeoff',f:'Both feet together',c:'Two-foot jump'},{e:'Not in front support',f:'Push through to extended',c:'Front support holds'}],deductions:[{d:'Not in front support',v:'^0.10'},{d:'One-foot takeoff',v:'0.30'}],principle:'Get it in the body not just the brain',spotWarning:'Hand under hips to guide over bar.'},
  {id:'l1b2',level:'Level 1',event:'Bars',name:'Cast',spot:'Form Spot',correct:'From front support — push hips away from bar, hollow line.',cues:'Push the bar away! · Hollow body!',drill:'Cast to wall — tap wall with toes.',errors:[{e:'Hips not leaving bar',f:'Push the bar AWAY',c:'Hip flexor stretches'},{e:'Bent arms',f:'Strong arms!',c:'Push-up holds'}],deductions:[{d:'Not straight-hollow',v:'^0.20'}],principle:'Strong not Straight'},
  {id:'l1b3',level:'Level 1',event:'Bars',name:'Back Hip Circle',spot:'TRUE SPOT',correct:'Hollow body maintained throughout. Hip/thigh contact on bar.',cues:'Squish the bug all the way around! · Hips on the bar!',drill:'Spotted BHC. Hollow check before every attempt.',errors:[{e:'Losing hollow',f:'Squish the bug!',c:'Hollow holds'},{e:'Hip leaving bar',f:'Hips glued!',c:'Hip circle drills'}],deductions:[{d:'No hollow',v:'^0.20'},{d:'No hip contact',v:'^0.20'}],principle:'Get it in the body not just the brain',spotWarning:'Hand on upper back throughout.'},
  {id:'l1b4',level:'Level 1',event:'Bars',name:'Underswing Dismount',spot:'TRUE SPOT',correct:'Cast, pike, push bar away, extend to hollow, stick.',cues:'Push the bar away! · Reach long! · Stick it!',drill:'Spotted from low bar. Hand under back in flight.',errors:[{e:'Hips hitting bar',f:'Pike and push AWAY',c:'Underswing on low bar'},{e:'No extension',f:'Reach long — hollow!',c:'Jump to hollow holds'}],deductions:[{d:'No hollow',v:'^0.20'},{d:'Hips on bar',v:'0.20'}],principle:'Confidence before height.',spotWarning:'Hand under lower back during flight.'},
  {id:'l1bm1',level:'Level 1',event:'Beam',name:'Straddle Mount',spot:'Form Spot',correct:"Jump to front support, 1/4 turn to straddle sit. Don't squish Bob.",cues:"Don't squish Bob! · Strong arms!",drill:'Bob the sticker — land without squishing.',errors:[{e:'Collapsing arms',f:'Strong arms!',c:'Push-up holds on beam'}],deductions:[{d:'Not in front support',v:'^0.10'}],principle:'Get it in the body not just the brain'},
  {id:'l1bm2',level:'Level 1',event:'Beam',name:'Arabesque',spot:'Form Spot',correct:'Free leg lifts min 30° above beam, arms in T.',cues:'String lifts your back leg! · Arms in T!',drill:'Arms in T. String for back leg.',errors:[{e:'Leg not at 30°',f:'String pulls that leg UP!',c:'Arabesque holds on floor'}],deductions:[{d:'Leg not min 30°',v:'^0.20'}],principle:'Gym culture starts at Level 1'},
  {id:'l1fl1',level:'Level 1',event:'Floor',name:'Forward Roll',spot:'Form Spot',correct:'Tuck maintained. Do not push off with hands to stand.',cues:'Chin to chest! · Ball shape!',drill:'Cheese mat roll — incline helps.',errors:[{e:'Pushing off with hands',f:'Keep hands off floor',c:'Incline roll drills'},{e:'Losing tuck',f:'Ball shape!',c:'Tuck hold'}],deductions:[{d:'No tuck',v:'^0.20'},{d:'Hands off floor',v:'0.30'}],principle:'Get it in the body not just the brain'},
  {id:'l1fl2',level:'Level 1',event:'Floor',name:'Cartwheel',spot:'Form Spot',correct:'Alternate hand placement, pass through vertical, lunge in/out.',cues:'Paint the ceiling! · One hand then the other!',drill:'Hand markers — tape X on floor.',errors:[{e:'Simultaneous hands',f:'One hand THEN the other!',c:'Hand marker drills'},{e:'Not through vertical',f:'Kick hips UP!',c:'Cartwheel on wall'}],deductions:[{d:'Simultaneous hands',v:'0.10'},{d:'Not through vertical',v:'^0.30'}],principle:"Understand what you're asking the brain to do",safetyNote:'Do NOT teach cartwheel and handstand in same session.'},
  {id:'l1fl3',level:'Level 1',event:'Floor',name:'Backward Roll',spot:'Form Spot',correct:'Tuck maintained. Hands push through at top.',cues:'Ball shape! · Push those hands through!',drill:'Cheese mat. Crossed hands spot.',errors:[{e:'Hands before rolling',f:'Sit first — then roll',c:'Cheese mat drills'}],deductions:[{d:'No tuck',v:'^0.20'},{d:'Hands during squat',v:'0.30'}],principle:'Get it in the body not just the brain',spotWarning:'Crossed hands: one on belly, one on back.'},
];

export const ini = n => (n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
export const bc = l => BELT_COLORS[l]||'#E8E8E8';
export const greet = n => { const h=new Date().getHours(); return `${h<12?'Good morning':h<17?'Good afternoon':'Good evening'}, ${(n||'Coach').split(' ')[0]} 👋`; };
export function toast(msg,type='ok'){
  const t=document.getElementById('toast');if(!t)return;
  t.textContent=msg;
  t.style.background=type==='warn'?'#7A5500':type==='err'?'#9B3A2F':type==='ai'?'#1e1b4b':'#1C1C1C';
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);
}
export function sync(on){const s=document.getElementById('syncDot');if(s){if(on){s.classList.add('show');}else{setTimeout(()=>s.classList.remove('show'),800);}}}
