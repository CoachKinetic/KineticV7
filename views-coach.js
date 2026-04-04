import { APP, SKILLS, BELT_COLORS, BELT_LEVELS, ini } from './firebase-config.js?v=800';
import { msgInbox } from './views-director.js?v=800';

function timeToMin(t){if(!t)return 0;const[h,m]=(t.match(/(\d+):(\d+)/)||[0,0,0]).slice(1).map(Number);const pm=t.includes('PM')&&h!==12;const am=t.includes('AM')&&h===12;return(pm?h+12:am?0:h)*60+m;}
function locked(msg){return`<div class="alert warn">🔒 ${msg}</div><button class="btn primary" onclick="window.K.nav('coachDash')">← Dashboard</button>`;}
function sessionStatus(cls){const s=APP.sessionState?.[cls.id]||{};if(s.notesDone)return{label:'✓ Complete',color:'var(--green)',step:'done'};if(s.skillsDone)return{label:'Notes Needed',color:'var(--blue)',step:'notes'};if(s.attDone)return{label:'Skills Ready',color:'var(--gold)',step:'skills'};return{label:'Not Started',color:'var(--t3)',step:'att'};}

export function coachDash(){
  if(APP.simpleMode)return simpleHome();
  const uid=APP.user?.uid;
  const my=APP.allClasses.filter(c=>(c.coaches||[]).includes(uid)||c.coachId===uid);
  const today=new Date().toLocaleDateString('en-US',{weekday:'long'});
  const todayClasses=my.filter(c=>c.day===today).sort((a,b)=>timeToMin(a.time)-timeToMin(b.time));
  const now=new Date();
  const subConfirms=(APP.messages||[]).filter(m=>m.type==='sub_confirm_request'&&!m.read&&m.toId===uid);
  return `
  ${subConfirms.length?`<div class="alert warn" style="display:flex;align-items:center;justify-content:space-between;border-left:3px solid var(--gold);"><span>🔔 Sub request needs your approval</span><button class="btn primary" style="font-size:10px;" onclick="window.K.nav('coachMsgs')">View →</button></div>`:''}
  <div style="background:#1C1C1C;border-radius:14px;padding:20px 24px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;">
    <div><div id="liveClock" style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:36px;color:#FAFAF8;letter-spacing:-1px;">${now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>
    <div style="font-size:12px;color:rgba(250,250,248,0.4);margin-top:3px;">${now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div></div>
    <div style="text-align:right;">${APP.clockedIn
      ?`<div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5EC85E;display:flex;align-items:center;gap:5px;justify-content:flex-end;margin-bottom:8px;"><div style="width:6px;height:6px;border-radius:50%;background:#5EC85E;animation:pulse 2s infinite;"></div>Clocked In · <span id="elapsedTime">0m</span></div><button class="btn danger" onclick="window.K.clockOut()">Clock Out</button>`
      :`<div style="font-size:10px;color:rgba(250,250,248,0.3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Not Clocked In</div><button class="btn primary" onclick="window.K.clockIn()">Clock In →</button>`}
    </div>
  </div>
  <div class="sec-hdr"><h3>Today — ${today}</h3><span class="slink" onclick="window.K.nav('coachSched')">Full Schedule →</span></div>
  ${todayClasses.length===0?`<div class="empty-state compact"><div class="es-icon">🏖️</div><h3>No classes today</h3></div>`
  :todayClasses.map(cls=>{const st=sessionStatus(cls);const aths=APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id));const nowMin=now.getHours()*60+now.getMinutes();const minsUntil=timeToMin(cls.time)-nowMin;const isNow=minsUntil<=0&&minsUntil>-90;const isSoon=minsUntil>0&&minsUntil<=15;
    return`<div style="background:var(--panel);border:2px solid ${isNow?'var(--gold)':isSoon?'rgba(181,153,106,0.35)':'var(--bdr)'};border-left:4px solid ${st.color};border-radius:12px;padding:16px 18px;margin-bottom:12px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div style="flex:1;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:15px;">${cls.name}</div>${isNow?`<span style="background:var(--gold);color:var(--sb);font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:2px 8px;border-radius:10px;">NOW</span>`:isSoon?`<span style="background:var(--y-soft);color:#8A6010;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;font-family:'Barlow Condensed',sans-serif;letter-spacing:1px;text-transform:uppercase;">In ${minsUntil}m</span>`:''}</div>
          <div style="font-size:12px;color:var(--t2);display:flex;gap:10px;">🕐 ${cls.time} · 👧 ${aths.length} · 🎓 ${cls.level}</div>
          ${APP.sessionState?.[cls.id]?.attDone?`<div style="margin-top:7px;display:flex;gap:5px;"><span class="pill present" style="font-size:9px;">✓ Att</span>${APP.sessionState?.[cls.id]?.skillsDone?`<span class="pill present" style="font-size:9px;">✓ Skills</span>`:''} ${APP.sessionState?.[cls.id]?.notesDone?`<span class="pill present" style="font-size:9px;">✓ Notes</span>`:''}</div>`:''}
        </div>
        <div>${st.step==='done'?`<button class="btn" style="font-size:11px;" onclick="window.K.startSession('${cls.id}')">Review</button>`:st.step==='notes'?`<button class="btn primary" style="font-size:11px;" onclick="window.K.nav('coachNotes')">Notes →</button>`:st.step==='skills'?`<button class="btn primary" style="font-size:11px;" onclick="window.K.startSkills('${cls.id}')">Skills →</button>`:`<button class="btn primary" style="font-size:11px;" onclick="window.K.startSession('${cls.id}')">Start →</button>`}</div>
      </div>
    </div>`;}).join('')}
  ${APP.clockedIn?`<div class="ai-card" id="aiCard"><div class="ai-hdr"><span style="font-size:16px;">✨</span><span class="ai-title">Today's Lesson Focus</span><span class="ai-badge">AI · KINETIC</span></div><div id="aiContent"><div class="ai-loading">Reading your last session<span>.</span><span>.</span><span>.</span></div></div></div>`:''}
  <div class="g4" style="margin-top:16px;">
    <div class="tile" onclick="window.K.nav('library')"><div class="ti">📚</div><div class="tl">Skills</div></div>
    <div class="tile" onclick="window.K.nav('lessons')"><div class="ti">📋</div><div class="tl">Lessons</div></div>
    <div class="tile" onclick="window.K.nav('coachMsgs')"><div class="ti">💬</div><div class="tl">Messages${(APP.messages||[]).filter(m=>!m.read&&m.fromId!==APP.user?.uid&&m.fromId!=='system').length?`<span class="nav-badge" style="margin-left:4px;">${(APP.messages||[]).filter(m=>!m.read&&m.fromId!==APP.user?.uid&&m.fromId!=='system').length}</span>`:''}</div></div>
    <div class="tile" onclick="window.K.nav('coachProfile')"><div class="ti">👤</div><div class="tl">Profile</div></div>
  </div>`;
}

export function simpleHome(){
  const uid=APP.user?.uid;
  const my=APP.allClasses.filter(c=>(c.coaches||[]).includes(uid)||c.coachId===uid);
  const today=new Date().toLocaleDateString('en-US',{weekday:'long'});
  const todayClasses=my.filter(c=>c.day===today).sort((a,b)=>timeToMin(a.time)-timeToMin(b.time));
  return`<div style="max-width:480px;margin:0 auto;">
    <div style="background:#1C1C1C;border-radius:14px;padding:22px;margin-bottom:20px;text-align:center;">
      <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:40px;color:#FAFAF8;" id="liveClock">${new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>
      <div style="font-size:13px;color:rgba(250,250,248,0.4);margin-top:4px;">${today}</div>
      <div style="margin-top:16px;">${APP.clockedIn?`<button class="btn danger" style="width:100%;padding:14px;font-size:14px;" onclick="window.K.clockOut()">Clock Out</button>`:`<button class="btn primary" style="width:100%;padding:14px;font-size:14px;" onclick="window.K.clockIn()">Clock In →</button>`}</div>
    </div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">My Classes Today</div>
    ${todayClasses.length===0?`<div class="empty-state compact"><div class="es-icon">🏖️</div><h3>No classes today</h3></div>`
    :todayClasses.map(cls=>{const st=sessionStatus(cls);const aths=APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id));const done=st.step==='done';
      return`<div onclick="window.K.startSession('${cls.id}')" style="background:var(--panel);border:2px solid ${done?'var(--green)':'var(--gold)'};border-radius:12px;padding:18px 20px;margin-bottom:12px;cursor:pointer;display:flex;align-items:center;gap:14px;">
        <div style="font-size:32px;">${done?'✅':'🥋'}</div>
        <div style="flex:1;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;">${cls.name}</div>
        <div style="font-size:13px;color:var(--t2);">${cls.time} · ${aths.length} athletes</div>
        <div style="font-size:12px;color:${st.color};font-weight:600;margin-top:3px;">${st.label}</div></div>
        <div style="font-size:24px;color:var(--gold);">→</div>
      </div>`;}).join('')}
  </div>`;
}

export function coachAtt(){
  if(!APP.clockedIn)return locked('Clock in first to take attendance.');
  const uid=APP.user?.uid;
  const my=APP.allClasses.filter(c=>(c.coaches||[]).includes(uid)||c.coachId===uid);
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today=APP.attDay||new Date().toLocaleDateString('en-US',{weekday:'long'});
  const dayClasses=my.filter(c=>c.day===today).sort((a,b)=>timeToMin(a.time)-timeToMin(b.time));
  const histMode=APP.attHistDate&&APP.attHistDate!==new Date().toISOString().split('T')[0];
  return`
  <div class="sec-hdr"><h3>Attendance</h3>
    <div style="display:flex;gap:8px;align-items:center;">
      <input type="date" class="fi" style="width:auto;font-size:12px;padding:5px 10px;" value="${APP.attHistDate||new Date().toISOString().split('T')[0]}" onchange="window.APP.attHistDate=this.value;window.K.nav('coachAtt')">
      <button class="btn" onclick="window.APP.attHistDate=null;window.K.nav('coachAtt')">Today</button>
    </div>
  </div>
  ${histMode?`<div class="alert info" style="margin-bottom:12px;">📅 Viewing history. Read-only.</div>`:''}
  <div class="day-tabs">${days.map(d=>`<button class="day-tab ${today===d?'on':''}" onclick="window.APP.attDay='${d}';window.K.nav('coachAtt')">${d.slice(0,3)}</button>`).join('')}</div>
  ${dayClasses.length===0?`<div class="empty-state compact"><div class="es-icon">📅</div><h3>No classes on ${today}</h3></div>`
  :dayClasses.map(cls=>{const aths=APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id));const makeups=(APP.makeupAthletes?.[cls.id]||[]).map(m=>APP.allAthletes.find(a=>a.id===m.athId)).filter(Boolean);const allAths=[...aths,...makeups];const clsState=APP.attState[cls.id]||{};allAths.forEach((_,i)=>{if(clsState[i]===undefined)clsState[i]='present';});if(!histMode)APP.attState[cls.id]=clsState;const p=Object.values(clsState).filter(v=>v==='present').length;const saved=(APP.attSavedClasses||{})[cls.id];const ss=sessionStatus(cls);
    return`<div class="card" style="margin-bottom:14px;">
      <div class="card-hdr"><div><h4>${cls.name} ${ss.step!=='att'?`<span class="pill ${ss.step==='done'?'present':'ip'}" style="font-size:9px;">${ss.label}</span>`:''}</h4><div style="font-size:11px;color:var(--t3);">${cls.time} · ${cls.level}</div></div>
      <div style="display:flex;gap:5px;"><span class="pill present">${p} Present</span><span class="pill absent">${allAths.length-p} Absent</span>${saved?`<span class="pill present" style="font-size:9px;">✓</span>`:''}</div></div>
      ${!histMode?`<div style="padding:8px 14px;background:var(--p2);border-bottom:1px solid var(--bdr);display:flex;gap:6px;align-items:center;">
        <button class="btn" style="font-size:10px;padding:4px 10px;" onclick="window.K.markAll('${cls.id}','present')">All Present</button>
        <button class="btn" style="font-size:10px;padding:4px 10px;" onclick="window.K.markAll('${cls.id}','absent')">All Absent</button>
        <button class="btn" style="font-size:10px;padding:4px 10px;" onclick="window.K.openModal('addMakeupModal',{classId:'${cls.id}'})">+ Makeup</button>
        <button class="btn primary" style="font-size:10px;padding:4px 10px;margin-left:auto;" onclick="window.K.saveAtt('${cls.id}')" ${saved?'disabled':''}>${saved?'✓ Saved':'Save ☁️'}</button>
      </div>`:''}
      <div class="card-body">${allAths.length===0?`<div style="padding:20px;text-align:center;color:var(--t3);">No athletes yet.</div>`
      :allAths.map((a,i)=>{const isMakeup=makeups.includes(a);return`<div class="att-row" id="ar_${cls.id}_${i}">
        <div class="mini-av">${isMakeup?'🔄':ini(a.name)}</div>
        <div class="att-name">${a.name}${isMakeup?` <span class="pill ip" style="font-size:9px;">Makeup</span>`:''}</div>
        <div class="att-meta">${a.level||'Level 1'}</div>
        ${histMode?`<span class="pill ${clsState[i]==='present'?'present':'absent'}">${clsState[i]==='present'?'Present':'Absent'}</span>`:`<div class="att-btns"><button class="att-btn ${clsState[i]==='present'?'sel-p':''}" onclick="window.K.setAtt('${cls.id}',${i},'present')">Present</button><button class="att-btn ${clsState[i]==='absent'?'sel-a':''}" onclick="window.K.setAtt('${cls.id}',${i},'absent')">Absent</button></div>`}
      </div>`;}).join('')}</div>
      ${!histMode&&saved?`<div style="padding:10px 14px;background:var(--g-soft);border-top:1px solid rgba(42,107,42,0.2);"><button class="btn primary full" style="font-size:12px;" onclick="window.K.startSkills('${cls.id}')">✓ Done — Continue to Skills →</button></div>`:''}
    </div>`;}).join('')}`;
}

export function coachSkills(){
  if(!APP.clockedIn)return locked('Clock in first.');
  const cls=APP.activeSkillClass?APP.allClasses.find(c=>c.id===APP.activeSkillClass):APP.selectedClass;
  if(!cls){const uid=APP.user?.uid;const my=APP.allClasses.filter(c=>(c.coaches||[]).includes(uid)||c.coachId===uid);return`<div class="sec-hdr"><h3>Skill Tracker</h3></div><p style="font-size:14px;color:var(--t2);margin-bottom:16px;">Select a class:</p>${my.map(c=>`<div class="class-card" style="margin-bottom:10px;" onclick="window.APP.activeSkillClass='${c.id}';window.K.nav('coachSkills')"><div class="cn">${c.name}</div><div class="ct">${c.day} · ${c.time}</div></div>`).join('')}`;}
  const aths=APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id));
  const ls=SKILLS.filter(s=>s.level===cls.level);
  const evts=[...new Set(ls.map(s=>s.event))];
  return`
  <div class="sec-hdr"><h3>Skills — ${cls.name}</h3><button class="btn primary" onclick="window.K.saveSkills()">Save ☁️</button></div>
  <div class="alert ok" style="font-size:12px;">Tap NR → IP → ✓ to progress. Auto-syncs to parent portal.</div>
  <div class="g2">${aths.length===0?`<div class="card"><div style="padding:24px;text-align:center;color:var(--t3);">No athletes in this class.</div></div>`
  :aths.map((a,ai)=>{const s=APP.skillState[ai]||{};const m=ls.filter(sk=>s[sk.id]==='m').length;const pct=ls.length?Math.round(m/ls.length*100):0;
    return`<div class="card"><div class="card-hdr"><div style="display:flex;align-items:center;gap:9px;"><div class="mini-av">${ini(a.name)}</div><div><h4>${a.name}</h4><div style="font-size:11px;color:var(--t3);">${m}/${ls.length} mastered</div></div></div><div class="prog-wrap" style="width:90px;"><div class="prog-bar"><div class="prog-fill" id="spb${ai}" style="width:${pct}%"></div></div><span class="prog-pct" id="spp${ai}">${pct}%</span></div></div>
      <div class="card-body">${evts.map(evt=>{const es=ls.filter(sk=>sk.event===evt);return`<div class="evt-hdr">${evt}</div>${es.map(sk=>{const st=s[sk.id]||'nr';return`<div class="skill-row"><span class="skill-nm" onclick="window.K.nav('skill_${sk.id}')">${sk.name}</span><div class="ssbs"><button class="ssb ${st==='nr'?'sel-nr':''}" data-skill="${ai}_${sk.id}" data-status="nr" onclick="window.K.setSkill(${ai},'${sk.id}','nr')">NR</button><button class="ssb ${st==='ip'?'sel-ip':''}" data-skill="${ai}_${sk.id}" data-status="ip" onclick="window.K.setSkill(${ai},'${sk.id}','ip')">IP</button><button class="ssb ${st==='m'?'sel-m':''}" data-skill="${ai}_${sk.id}" data-status="m" onclick="window.K.setSkill(${ai},'${sk.id}','m')">✓</button></div></div>`;}).join('')}`;}).join('')}</div>
    </div>`;}).join('')}</div>
  <button class="btn primary full" onclick="window.K.saveSkills();window.APP.sessionState=window.APP.sessionState||{};window.APP.sessionState['${cls.id}']={...(window.APP.sessionState['${cls.id}']||{}),skillsDone:true};setTimeout(()=>window.K.nav('coachNotes'),600);">Save & Continue to Notes →</button>`;
}

export function coachNotes(){
  if(!APP.clockedIn)return locked('Clock in first.');
  const cls=APP.activeSkillClass?APP.allClasses.find(c=>c.id===APP.activeSkillClass):APP.selectedClass;
  const clsName=cls?.name||'Class';
  const aths=cls?APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id)):[];
  const histMode=APP.notesHistDate&&APP.notesHistDate!==new Date().toISOString().split('T')[0];
  return`
  <div class="sec-hdr"><h3>Notes — ${clsName}</h3>
    <div style="display:flex;gap:8px;align-items:center;">
      <input type="date" class="fi" style="width:auto;font-size:12px;padding:5px 10px;" value="${APP.notesHistDate||new Date().toISOString().split('T')[0]}" onchange="window.APP.notesHistDate=this.value;window.K.loadNotesHistory(this.value,'${cls?.id||'gen'}')">
      <button class="btn" onclick="window.APP.notesHistDate=null;window.K.nav('coachNotes')">Today</button>
    </div>
  </div>
  ${histMode?`<div class="alert info">📅 Read-only history.</div>`:''}
  <div class="alert info" style="font-size:12px;">Class notes are shared with your director. Private notes are only visible to you.</div>
  <div class="g2">
    <div class="card"><div class="card-hdr"><h4>Class Notes</h4></div><div style="padding:14px;">
      <div class="fg"><label class="fl">What did you work on?</label><textarea class="ft" id="cnTa" placeholder="Today we focused on..." ${histMode?'readonly':''} style="min-height:80px;">${APP.classNotes}</textarea></div>
      <div class="fg"><label class="fl">Concerns for director?</label><textarea class="ft" id="inTa" placeholder="Nothing to flag..." ${histMode?'readonly':''} style="min-height:60px;">${APP.issueNotes}</textarea></div>
      ${!histMode?`<button class="btn primary full" onclick="window.K.saveNotes()" ${APP.notesSaved?'disabled':''}>${APP.notesSaved?'✓ Saved':'Save Notes ☁️'}</button>`:''}</div></div>
    <div class="card"><div class="card-hdr"><h4>Private Athlete Notes</h4></div><div style="padding:14px;">
      <p style="font-size:12px;color:var(--t3);margin-bottom:12px;">🔒 Only visible to you.</p>
      ${aths.length===0?`<div style="font-size:13px;color:var(--t3);">No athletes in class.</div>`:aths.map((a,i)=>`<div class="fg"><label class="fl">${a.name}</label><input class="fi" ${histMode?'readonly':''} placeholder="Notes for ${a.name.split(' ')[0]}..." value="${APP.privateNotes[i]||''}" oninput="window.APP.privateNotes[${i}]=this.value"></div>`).join('')}
    </div></div>
  </div>
  ${APP.notesSaved&&!histMode?`<button class="btn primary full" onclick="window.APP.sessionState=window.APP.sessionState||{};window.APP.sessionState['${cls?.id||'gen'}']={...(window.APP.sessionState['${cls?.id||'gen'}']||{}),notesDone:true};window.K.nav('coachDash')">✓ Session Complete — Back to Dashboard</button>`:''}`;
}

export function coachSched(){
  const uid=APP.user?.uid;
  const my=APP.allClasses.filter(c=>(c.coaches||[]).includes(uid)||c.coachId===uid);
  const open=(APP.subRequests||[]).filter(r=>r.status==='open');
  const myPending=(APP.subRequests||[]).filter(r=>r.requestedBy===uid&&!['confirmed','denied'].includes(r.status));
  const subConfirms=(APP.messages||[]).filter(m=>m.type==='sub_confirm_request'&&!m.read&&m.toId===uid);
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return`
  ${subConfirms.length?`<div class="alert warn" style="display:flex;align-items:center;justify-content:space-between;"><span>🔔 Sub approval needed</span><button class="btn primary" style="font-size:11px;" onclick="window.K.nav('coachMsgs')">Respond →</button></div>`:''}
  <div class="sec-hdr"><h3>My Schedule</h3><button class="btn primary" onclick="window.K.openModal('subReqModal')">Request Sub</button></div>
  ${days.map(day=>{const dc=my.filter(c=>c.day===day).sort((a,b)=>timeToMin(a.time)-timeToMin(b.time));if(!dc.length)return'';return`<div style="margin-bottom:16px;"><div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--gold);opacity:0.7;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--bdr);">${day}</div><div class="g2">${dc.map(c=>`<div class="class-card"><div style="display:flex;justify-content:space-between;"><div class="cn" style="font-size:13px;">${c.name}</div><span class="pill gold-p">${c.time}</span></div><div class="cm" style="margin-top:5px;"><span>👧 ${(c.athletes||[]).length}</span><span>${c.level}</span></div></div>`).join('')}</div></div>`;}).join('')}
  ${myPending.length?`<div class="sec-hdr" style="margin-top:8px;"><h3>My Sub Requests</h3></div>${myPending.map(r=>`<div class="class-card" style="margin-bottom:8px;"><div class="cn" style="font-size:13px;">${r.className}</div><div class="ct">${r.date}</div><span class="pill ${r.status==='confirmed'?'present':'ip'}">${{pending:'Waiting for director',open:'Posted',claimed:'Director reviewing',awaiting_original:'Awaiting your OK',confirmed:'Confirmed'}[r.status]||r.status}</span></div>`).join('')}`:''} 
  <div class="sec-hdr" style="margin-top:8px;"><h3>Open Sub Board</h3></div>
  ${open.length===0?`<div class="empty-state compact"><div class="es-icon">🔄</div><h3>No open requests</h3></div>`
  :open.filter(r=>r.requestedBy!==uid).map(r=>{const belts=['Foundation','Level 1','Level 2','Level 3','Level 4','Level 5','Xcel Bronze','Xcel Silver','Xcel Gold','Xcel Platinum'];const canSub=belts.indexOf(APP.profile?.belt||'Foundation')>=belts.indexOf(r.requiredBelt||'Level 1')||(APP.profile?.certifications||[]).includes(r.requiredBelt||'Level 1');return`<div class="class-card" style="margin-bottom:10px;${!canSub?'opacity:0.5;':''}"><div style="display:flex;justify-content:space-between;"><div class="cn" style="font-size:13px;">${r.className}</div><span class="pill ${canSub?'gold-p':'absent'}">${canSub?'Open':'🔒 Locked'}</span></div><div class="cm" style="margin-top:5px;"><span>📅 ${r.date}</span><span>🎓 ${r.requiredBelt||'Level 1'}+</span></div>${!canSub?`<div class="alert danger" style="margin-top:8px;padding:6px 10px;font-size:11px;">Requires ${r.requiredBelt||'Level 1'} certification</div>`:`<button class="btn primary full" style="margin-top:10px;" onclick="window.K.claimSub('${r.id}')">I'll Take This Class →</button>`}</div>`;}).join('')}`;
}

export function coachMsgs(){
  const uid=APP.user?.uid;
  const all=(APP.messages||[]).filter(m=>m.toId===uid||m.toRole==='coaches'||m.fromId===uid);
  const tab=window.APP?.msgTab||'unread';
  const subConfirms=all.filter(m=>m.type==='sub_confirm_request'&&!m.read&&m.toId===uid);
  const banner=subConfirms.length?`<div style="margin-bottom:14px;">${subConfirms.map(m=>`<div class="alert warn" style="display:block;border-left:3px solid var(--gold);"><div style="font-weight:800;font-size:13px;margin-bottom:6px;">🔔 Sub Approval Needed</div><div style="font-size:13px;margin-bottom:12px;">${m.body?.split('\n')[0]||m.subject}</div><div style="display:flex;gap:8px;"><button class="btn primary" style="flex:1;" onclick="window.K.confirmSubFromCoach('${m.subRequestId||''}')">✓ Approve</button><button class="btn danger" style="flex:1;" onclick="window.K.denySubFinal('${m.subRequestId||''}')">Deny</button></div></div>`).join('')}</div>`:'';
  const inbox=all.filter(m=>!m.read&&m.fromId!==uid&&m.fromId!=='system');
  const readM=all.filter(m=>(m.read||m.fromId===uid)&&m.fromId!=='system');
  const sent=all.filter(m=>m.fromId===uid);
  const display=tab==='sent'?sent:tab==='read'?readM:inbox;
  return banner+`<div class="sec-hdr"><h3>Messages</h3><button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'coach'})">+ New</button></div>
  <div class="tab-bar">${[['unread',`Inbox${inbox.length?` (${inbox.length})`:''}`,],['read','Read'],['sent','Sent']].map(([t,l])=>`<button class="tab-btn ${tab===t?'on':''}" onclick="window.APP.msgTab='${t}';window.K.nav('coachMsgs')">${l}</button>`).join('')}</div>
  ${msgInbox(display,'coach')}`;
}

export function coachProfile(){
  const p=APP.profile||{};const h=APP.myTimecards||[];
  const today=new Date().toISOString().split('T')[0];
  const weekAgo=new Date(Date.now()-7*86400000).toISOString().split('T')[0];
  const monthAgo=new Date(Date.now()-30*86400000).toISOString().split('T')[0];
  const hoursFor=start=>{const mins=h.filter(t=>t.clockIn>=start&&t.status!=='active').reduce((s,t)=>s+(parseInt(t.duration)||0),0);return`${Math.floor(mins/60)}h ${mins%60}m`;};
  return`
  <div class="sec-hdr"><h3>My Profile</h3></div>
  <div class="g2">
    <div class="card"><div class="card-hdr"><h4>Coach Info</h4></div><div style="padding:20px;text-align:center;">
      <div class="user-av" style="width:56px;height:56px;font-size:18px;margin:0 auto 12px;">${ini(p.name||'?')}</div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;margin-bottom:4px;">${p.name||'Coach'}</div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:16px;">${p.email||''}</div>
      <div style="display:inline-flex;align-items:center;gap:8px;background:var(--p2);border:1px solid var(--bdr);border-radius:8px;padding:10px 18px;"><div style="width:18px;height:18px;border-radius:50%;background:${BELT_COLORS[p.belt||'Foundation']};"></div><span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;">${p.belt||'Foundation'} Belt</span></div>
      ${(p.certifications||[]).length?`<div style="margin-top:10px;font-size:12px;color:var(--t2);">Also certified: ${p.certifications.join(', ')}</div>`:''}
    </div></div>
    <div class="card"><div class="card-hdr"><h4>Hours Summary</h4></div><div style="padding:14px;">
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--bdr2);"><span style="font-size:13px;">Today</span><span style="font-family:'Montserrat',sans-serif;font-weight:700;">${hoursFor(today)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--bdr2);"><span style="font-size:13px;">This Week</span><span style="font-family:'Montserrat',sans-serif;font-weight:700;color:var(--gold);">${hoursFor(weekAgo)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="font-size:13px;">This Month</span><span style="font-family:'Montserrat',sans-serif;font-weight:700;color:var(--gold);">${hoursFor(monthAgo)}</span></div>
    </div></div>
  </div>`;
}

export function library(lv='all',ev='all'){
  const lvls=['Foundation','Level 1'];
  const evts=['All','Vault','Bars','Beam','Floor','General'];
  const evColors={Vault:'#C25B30',Bars:'#2E5FA3',Beam:'#7B4FA0',Floor:'#2A6B2A',General:'#B5996A'};
  const evIcons={Vault:'🏃',Bars:'🤸',Beam:'🧘',Floor:'⭐',General:'🥋'};
  const filtered=SKILLS.filter(s=>(lv==='all'||s.level===lv)&&(ev==='all'||ev==='All'||s.event===ev));
  const grouped={};filtered.forEach(s=>{if(!grouped[s.event])grouped[s.event]=[];grouped[s.event].push(s);});
  const spotBadge=s=>s.spot==='TRUE SPOT'
    ?`<span style="background:rgba(155,58,47,0.15);color:var(--red);border:1px solid rgba(155,58,47,0.25);font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:4px;white-space:nowrap;">⚠️ True Spot</span>`
    :s.spot==='DO NOT SPOT'
    ?`<span style="background:rgba(0,0,0,0.06);color:var(--t3);border:1px solid var(--bdr);font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:4px;white-space:nowrap;">🚫 No Spot</span>`
    :`<span style="background:var(--g-soft);color:var(--green);border:1px solid rgba(42,107,42,0.2);font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:4px;white-space:nowrap;">✅ Form Spot</span>`;
  return`
  <div style="background:#1C1C1C;border-radius:14px;padding:20px 24px;margin-bottom:20px;">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:20px;color:#FAFAF8;">Skill Library</div>
      <div style="font-size:12px;color:rgba(250,250,248,0.4);margin-top:3px;">${filtered.length} skill${filtered.length!==1?'s':''} · USAG Reference</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${['All',...lvls].map(l=>{const active=(lv==='all'&&l==='All')||(lv===l);return`<button onclick="window.APP.libLevel='${l==='All'?'all':l}';window.K.nav('library')" style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 14px;border-radius:6px;cursor:pointer;border:1px solid ${active?'var(--gold)':'rgba(181,153,106,0.2)'};background:${active?'var(--gold)':'transparent'};color:${active?'var(--sb)':'rgba(250,250,248,0.5)'};transition:all 0.15s;">${l}</button>`;}).join('')}</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:14px;">${evts.map(e=>{const active=(ev==='all'&&e==='All')||(ev===e);const color=evColors[e]||'var(--gold)';return`<button onclick="window.APP.libEvent='${e==='All'?'all':e}';window.K.nav('library')" style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:7px 14px;border-radius:6px;cursor:pointer;border:1px solid ${active?color:'rgba(255,255,255,0.1)'};background:${active?color+'22':'transparent'};color:${active?color:'rgba(250,250,248,0.4)'};transition:all 0.15s;">${evIcons[e]||''} ${e}</button>`;}).join('')}</div>
  </div>
  ${filtered.length===0?`<div class="empty-state"><div class="es-icon">🔍</div><h3>No skills found</h3><p>Try a different filter.</p></div>`
  :Object.entries(grouped).map(([evt,skills])=>{
    const col=evColors[evt]||'var(--gold)';
    return`<div style="margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:32px;height:32px;border-radius:8px;background:${col}22;border:1px solid ${col}44;display:flex;align-items:center;justify-content:center;font-size:16px;">${evIcons[evt]||'🥋'}</div>
        <div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;">${evt}</div><div style="font-size:11px;color:var(--t3);">${skills.length} skill${skills.length!==1?'s':''}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">
        ${skills.map(s=>`<div onclick="window.K.nav('skill_${s.id}')" style="background:var(--panel);border:1px solid var(--bdr);border-left:3px solid ${col};border-radius:10px;padding:14px 16px;cursor:pointer;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)';this.style.borderColor='${col}'" onmouseout="this.style.transform='';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)';this.style.borderColor='var(--bdr)';this.style.borderLeftColor='${col}'">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
            <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;line-height:1.3;">${s.name}</div>
            <span style="color:${col};font-size:16px;flex-shrink:0;">→</span>
          </div>
          ${s.mantra?`<div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${col};margin-bottom:8px;">${s.mantra}</div>`:''}
          <div style="font-size:12px;color:var(--t2);line-height:1.5;margin-bottom:10px;">${s.correct}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            ${spotBadge(s)}
            <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--t3);">${s.level}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('')}`;
}

export function skillDetail(id){
  const s=SKILLS.find(x=>x.id===id);
  if(!s)return`<div class="alert warn">Skill not found.</div><button class="btn primary" onclick="window.K.nav('library')">← Library</button>`;
  const evColors={Vault:'#C25B30',Bars:'#2E5FA3',Beam:'#7B4FA0',Floor:'#2A6B2A',General:'#B5996A'};
  const evIcons={Vault:'🏃',Bars:'🤸',Beam:'🧘',Floor:'⭐',General:'🥋'};
  const col=evColors[s.event]||'var(--gold)';
  const isTrue=s.spot==='TRUE SPOT';
  const isNone=s.spot==='DO NOT SPOT';
  return`
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
    <button class="btn" onclick="window.K.nav('library')">← Library</button>
    <div style="display:flex;align-items:center;gap:8px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--t3);">
      <span style="color:${col};">${evIcons[s.event]||'🥋'} ${s.event}</span>
      <span>·</span><span>${s.level}</span>
    </div>
  </div>

  ${isTrue?`<div style="background:linear-gradient(135deg,#3A0A0A,#5A1010);border:2px solid rgba(155,58,47,0.5);border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:12px;"><span style="font-size:24px;">⚠️</span><div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;color:#FF8A80;">TRUE SPOT REQUIRED</div><div style="font-size:12px;color:rgba(255,138,128,0.7);margin-top:3px;">${s.spotWarning||'You are physically supporting this athlete.'}</div></div></div>`:''}
  ${isNone?`<div style="background:rgba(0,0,0,0.08);border:1px solid var(--bdr);border-radius:12px;padding:12px 18px;margin-bottom:16px;display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">🚫</span><div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--t3);">Do Not Spot This Skill</div></div>`:''}

  <div style="background:#1C1C1C;border-radius:14px;padding:22px 24px;margin-bottom:20px;position:relative;overflow:hidden;">
    <div style="position:absolute;right:-20px;top:-20px;width:100px;height:100px;border-radius:50%;background:${col}18;"></div>
    <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:26px;color:#FAFAF8;margin-bottom:6px;">${s.name}</div>
    ${s.mantra?`<div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:${col};margin-bottom:14px;">${s.mantra}</div>`:''}
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:14px 16px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(250,250,248,0.3);margin-bottom:6px;">Correct Position</div>
      <div style="font-size:14px;font-weight:600;color:#FAFAF8;line-height:1.65;">${s.correct}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
    <div style="background:linear-gradient(135deg,#FFF9F0,#FFF4E6);border:1px solid rgba(181,153,106,0.3);border-radius:12px;padding:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><div style="width:28px;height:28px;border-radius:8px;background:rgba(181,153,106,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;">💬</div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:12px;color:#7A5C2E;">Coaching Cues</div></div>
      ${s.cues.split('·').map(c=>`<div style="font-size:14px;color:#7A5C2E;font-weight:600;font-style:italic;padding:8px 0;border-bottom:1px solid rgba(181,153,106,0.2);">"${c.trim()}"</div>`).join('')}
    </div>
    <div style="background:var(--p2);border:1px solid var(--bdr);border-radius:12px;padding:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><div style="width:28px;height:28px;border-radius:8px;background:rgba(42,107,42,0.1);display:flex;align-items:center;justify-content:center;font-size:14px;">🏋️</div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:12px;">Teaching Drill</div></div>
      <div style="font-size:13px;color:var(--t2);line-height:1.7;">${s.drill}</div>
    </div>
  </div>

  <div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;overflow:hidden;margin-bottom:14px;">
    <div style="background:#1C1C1C;padding:12px 18px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:16px;">⚡</span>
      <span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;color:#FAFAF8;">Common Errors & Coaching Fixes</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;background:var(--p2);border-bottom:1px solid var(--bdr);">
      <div style="padding:8px 16px;font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--red);">Error / What You'll See</div>
      <div style="padding:8px 16px;font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--green);">Say This Instead</div>
    </div>
    ${s.errors.map((e,i)=>`<div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--bdr2);background:${i%2===0?'var(--panel)':'var(--p2)'};">
      <div style="padding:12px 16px;"><div style="font-size:13px;font-weight:700;color:var(--red);">${e.e}</div>${e.c?`<div style="font-size:11px;color:var(--t3);margin-top:4px;">Drill: ${e.c}</div>`:''}</div>
      <div style="padding:12px 16px;font-size:13px;color:var(--green);font-weight:600;font-style:italic;">"${e.f}"</div>
    </div>`).join('')}
  </div>

  ${s.deductions&&s.deductions.length?`
  <div style="background:linear-gradient(135deg,#1a0a0a,#2a1010);border:1px solid rgba(155,58,47,0.3);border-radius:12px;padding:16px 20px;margin-bottom:14px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,138,128,0.6);margin-bottom:10px;">⚖️ USAG Deductions</div>
    ${s.deductions.map(d=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(155,58,47,0.15);"><span style="font-size:12px;color:rgba(250,250,248,0.7);">${d.d}</span><span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;color:#FF8A80;">${d.v}</span></div>`).join('')}
  </div>`:''} 

  ${s.principle?`
  <div style="background:linear-gradient(135deg,${col}15,${col}08);border:1px solid ${col}30;border-radius:12px;padding:16px 20px;display:flex;align-items:flex-start;gap:14px;">
    <div style="width:36px;height:36px;border-radius:10px;background:${col}22;border:1px solid ${col}44;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">💡</div>
    <div><div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${col};opacity:0.7;margin-bottom:5px;">Coaching Principle</div>
    <div style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:14px;color:var(--t);">${s.principle}</div></div>
  </div>`:''} 

  ${s.safetyNote?`<div class="alert danger" style="margin-top:14px;"><strong>⚠️ Safety:</strong> ${s.safetyNote}</div>`:''}
  `;
}

export function lessonPlans(){
  const bc=BELT_COLORS;const sel=APP.lessonLevel||'Level 1';
  const lvls={'Foundation':['Pointed Toes & Strong Arms','Hollow Body & Lunge','Relevé & Stick','Vault Introduction','Bars Introduction','Beam Introduction','Floor Introduction','Assessment'],'Level 1':['Vault — Sprint & Approach','Vault — Punch & Hurdle','Bars — Pullover','Bars — Cast & BHC','Bars — Underswing Dismount','Beam — Straddle Mount','Beam — Arabesque','Beam — Jumps','Floor — Forward Roll','Floor — Cartwheel','Floor — Backward Roll','Assessment']};
  const weeks=lvls[sel]||Array.from({length:12},(_,i)=>`Week ${i+1}`);
  return`<div class="sec-hdr"><h3>Lesson Plans</h3></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">${Object.keys(bc).slice(0,6).map(l=>`<button class="btn ${sel===l?'primary':''}" onclick="window.APP.lessonLevel='${l}';window.K.nav('lessons')" style="display:flex;align-items:center;gap:5px;"><div style="width:8px;height:8px;border-radius:50%;background:${bc[l]};"></div>${l}</button>`).join('')}</div>
  <div class="g3">${weeks.map((t,i)=>`<div class="class-card" onclick="window.K.openModal('lpModal',{week:${i+1},level:'${sel}',title:'${t}'})"><div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:6px;">Week ${i+1}</div><div class="cn" style="font-size:13px;">${t}</div></div>`).join('')}</div>`;
}
