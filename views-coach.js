import { APP, SKILLS, BELT_COLORS, BELT_LEVELS, ini } from './firebase-config.js';
import { msgInbox } from './views-director.js';

export function coachDash(){
  const my=APP.allClasses.filter(c=>(c.coaches||[]).includes(APP.user?.uid)||c.coachId===APP.user?.uid);
  const now=new Date();
  return `
  <div style="background:#1C1C1C;border-radius:10px;padding:20px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;">
    <div>
      <div id="liveClock" style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:34px;color:#FAFAF8;letter-spacing:-1px;">${now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>
      <div style="font-size:12px;color:rgba(250,250,248,0.4);margin-top:2px;">${now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
    </div>
    <div style="text-align:right;">
      ${APP.clockedIn
        ?`<div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5EC85E;display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-bottom:8px;"><div style="width:7px;height:7px;border-radius:50%;background:#5EC85E;animation:pulse 2s infinite;"></div>Clocked In · <span id="elapsedTime">0m</span></div>
           <button class="btn danger" onclick="window.K.clockOut()">Clock Out</button>`
        :`<div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(250,250,248,0.3);margin-bottom:8px;">Not Clocked In</div>
           <button class="btn primary" onclick="window.K.clockIn()">Clock In →</button>`}
    </div>
  </div>
  ${APP.clockedIn&&!APP.attSaved?`<div class="alert warn">⚠️ Take attendance to unlock skill tracking.</div>`:''}
  ${APP.clockedIn&&APP.attSaved&&!APP.notesSaved?`<div class="alert warn">📝 Notes required before clock-out.</div>`:''}
  ${APP.clockedIn&&APP.attSaved&&APP.notesSaved?`<div class="alert ok">✅ All tasks complete — clear to clock out.</div>`:''}
  ${APP.clockedIn?`<div class="ai-card" id="aiCard"><div class="ai-hdr"><span style="font-size:16px;">✨</span><span class="ai-title">Today's Lesson Suggestion</span><span class="ai-badge">AI · Claude</span></div><div id="aiContent"><div class="ai-loading">Reading last session notes<span>.</span><span>.</span><span>.</span></div></div></div>`:''}
  <div class="stats4">
    <div class="stat" onclick="window.K.nav('coachAtt')"><div class="si">📅</div><div class="sl">Classes</div><div class="sv">${my.length}</div></div>
    <div class="stat"><div class="si">✅</div><div class="sl">Attendance</div><div class="sv ${APP.attSaved?'gold':''}">${APP.attSaved?'Done':'—'}</div></div>
    <div class="stat"><div class="si">📝</div><div class="sl">Notes</div><div class="sv">${APP.notesSaved?'Done':'—'}</div></div>
    <div class="stat"><div class="si">🎓</div><div class="sl">My Belt</div><div class="sv gold">${APP.profile?.belt||'Foundation'}</div></div>
  </div>
  <div class="g4">
    <div class="tile ${!APP.clockedIn?'dim':''}" onclick="${APP.clockedIn?`window.K.nav('coachAtt')`:'window.toast(\"Clock in first\",\"warn\")'}"><div class="ti">✅</div><div class="tl">Attendance</div></div>
    <div class="tile ${!APP.clockedIn?'dim':''}" onclick="${APP.clockedIn?`window.K.nav('coachSkills')`:''}"><div class="ti">🥋</div><div class="tl">Skills</div></div>
    <div class="tile ${!APP.clockedIn?'dim':''}" onclick="${APP.clockedIn?`window.K.nav('coachNotes')`:''}"><div class="ti">📝</div><div class="tl">Notes</div></div>
    <div class="tile" onclick="window.K.nav('library')"><div class="ti">📚</div><div class="tl">Library</div></div>
  </div>
  <div class="sec-hdr"><h3>My Classes</h3><button class="slink" onclick="window.K.nav('coachSched')">Full Schedule →</button></div>
  ${my.length===0?`<div class="card"><div style="padding:28px;text-align:center;color:var(--t3);">No classes assigned yet. Your director will assign you.</div></div>`
  :`<div class="g3">${my.map(c=>`<div class="class-card" onclick="window.K.openModal('rosterModal',{classId:'${c.id}'})"><div class="cn">${c.name}</div><div class="ct">${c.day} · ${c.time}</div><div class="cm"><span>👧 ${(c.athletes||[]).length}/${c.cap||8}</span></div></div>`).join('')}</div>`}`;
}

export function coachAtt(){
  if(!APP.clockedIn) return locked('Clock in first.');
  const uid=APP.user?.uid;
  const myClasses=APP.allClasses.filter(c=>(c.coaches||[]).includes(uid)||c.coachId===uid);
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today=APP.attDay||new Date().toLocaleDateString('en-US',{weekday:'long'});
  const dayClasses=myClasses.filter(c=>c.day===today).sort((a,b)=>{
    const toMin=t=>{if(!t)return 0;const[h,m]=(t.match(/(\d+):(\d+)/)||[0,0,0]).slice(1).map(Number);return t.includes('PM')&&h!==12?h*60+m+720:h*60+m;};
    return toMin(a.time)-toMin(b.time);
  });
  const savedClasses=Object.keys(APP.attSavedClasses||{});
  const subConfirms=(APP.messages||[]).filter(m=>m.type==='sub_confirm_request'&&!m.read&&m.toId===uid);

  return `
  ${subConfirms.length?`<div class="alert warn" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;"><div>🔔 <strong>Sub Request:</strong> ${subConfirms[0].body?.split('\n')[0]}</div><button class="btn primary" style="font-size:11px;white-space:nowrap;" onclick="window.K.nav('coachMsgs')">View →</button></div>`:''}
  <div class="sec-hdr"><h3>Attendance</h3><button class="btn primary" onclick="window.K.nav('coachSkills')">Skills →</button></div>
  <div class="day-tabs">
    ${days.map(d=>`<button class="day-tab ${today===d?'on':''}" onclick="window.K.nav_attDay('${d}')">${d.slice(0,3)}</button>`).join('')}
  </div>
  ${dayClasses.length===0?`<div class="card"><div style="padding:28px;text-align:center;color:var(--t3);">No classes on ${today}.</div></div>`
  :dayClasses.map(cls=>{
    const aths=APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id));
    const clsState=APP.attState[cls.id]||{};
    aths.forEach((_,i)=>{if(!clsState[i])clsState[i]='present';});
    APP.attState[cls.id]=clsState;
    const p=Object.values(clsState).filter(v=>v==='present').length;
    const saved=savedClasses.includes(cls.id);
    return `<div class="card" style="margin-bottom:14px;">
      <div class="card-hdr">
        <div><h4>${cls.name}</h4><div style="font-size:11px;color:var(--t3);margin-top:2px;">${cls.time} · ${cls.level}</div></div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="pill present">${p} Present</span>
          <span class="pill absent">${aths.length-p} Absent</span>
          ${saved?`<span class="pill present">✓ Saved</span>`:``}
        </div>
      </div>
      <div style="padding:8px 14px;background:var(--p2);border-bottom:1px solid var(--bdr);display:flex;gap:6px;">
        <button class="btn" style="font-size:10px;padding:4px 10px;" onclick="window.K.markAll('${cls.id}','present')">All Present</button>
        <button class="btn" style="font-size:10px;padding:4px 10px;" onclick="window.K.markAll('${cls.id}','absent')">All Absent</button>
        <button class="btn primary" style="font-size:10px;padding:4px 10px;margin-left:auto;" onclick="window.K.saveAtt('${cls.id}')" ${saved?'disabled':''}>
          ${saved?'✓ Saved':'Save ☁️'}
        </button>
      </div>
      <div class="card-body">
        ${aths.length===0?`<div style="padding:24px;text-align:center;color:var(--t3);">No athletes in this class yet.</div>`
        :aths.map((a,i)=>`<div class="att-row" id="ar_${cls.id}_${i}">
          <div class="mini-av">${ini(a.name)}</div>
          <div class="att-name">${a.name}</div>
          <div class="att-meta">${a.level||'Level 1'}</div>
          <div class="att-btns">
            <button class="att-btn ${clsState[i]==='present'?'sel-p':''}" onclick="window.K.setAtt('${cls.id}',${i},'present')">Present</button>
            <button class="att-btn ${clsState[i]==='absent'?'sel-a':''}" onclick="window.K.setAtt('${cls.id}',${i},'absent')">Absent</button>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('')}
  ${Object.keys(APP.attSavedClasses||{}).length>0?`<button class="btn primary full" onclick="window.K.nav('coachSkills')">All Done — Continue to Skills →</button>`:''}`;
}

export function coachSkills(){
  if(!APP.clockedIn) return locked('Clock in first.');
  if(!APP.attSaved) return `<div class="alert warn">⚠️ Complete attendance first.</div><button class="btn primary" onclick="window.K.nav('coachAtt')">← Attendance</button>`;
  const cls=APP.selectedClass||{name:'Class',level:'Level 1',athleteObjects:[]};
  const aths=cls.athleteObjects||[];
  const ls=SKILLS.filter(s=>s.level===cls.level);
  const evts=[...new Set(ls.map(s=>s.event))];
  return `
  <div class="sec-hdr"><h3>Skill Tracker — ${cls.name}</h3><button class="btn primary" onclick="window.K.saveSkills()">Save ☁️</button></div>
  <div class="alert ok">✅ Tap NR / IP / ✓ to update each athlete's skills.</div>
  ${aths.length===0?`<div class="card"><div style="padding:24px;text-align:center;color:var(--t3);">No athletes in this class.</div></div>`
  :`<div class="g2">${aths.map((a,ai)=>{
    const s=APP.skillState[ai]||{};
    const m=ls.filter(sk=>s[sk.id]==='mastered').length;
    const pct=ls.length?Math.round(m/ls.length*100):0;
    return `<div class="card">
      <div class="card-hdr">
        <div style="display:flex;align-items:center;gap:9px;"><div class="mini-av">${ini(a.name)}</div><div><h4>${a.name}</h4><div style="font-size:11px;color:var(--t3);">${m}/${ls.length} mastered</div></div></div>
        <div class="prog-wrap" style="width:90px;"><div class="prog-bar"><div class="prog-fill" id="spb${ai}" style="width:${pct}%"></div></div><span class="prog-pct" id="spp${ai}">${pct}%</span></div>
      </div>
      <div class="card-body">
        ${evts.map(evt=>{
          const es=ls.filter(sk=>sk.event===evt);
          return `<div class="evt-hdr">${evt}</div>${es.map(sk=>{
            const st=s[sk.id]||'nr';
            return `<div class="skill-row"><span class="skill-nm" onclick="window.K.nav('skill_${sk.id}')">${sk.name}</span>
              <div class="ssbs">
                <button class="ssb ${st==='nr'?'sel-nr':''}" data-skill="${ai}_${sk.id}" data-status="nr" onclick="window.K.setSkill(${ai},'${sk.id}','nr')">NR</button>
                <button class="ssb ${st==='ip'?'sel-ip':''}" data-skill="${ai}_${sk.id}" data-status="ip" onclick="window.K.setSkill(${ai},'${sk.id}','ip')">IP</button>
                <button class="ssb ${st==='m'?'sel-m':''}" data-skill="${ai}_${sk.id}" data-status="m" onclick="window.K.setSkill(${ai},'${sk.id}','m')">✓</button>
              </div></div>`;
          }).join('')}`;
        }).join('')}
      </div>
    </div>`;
  }).join('')}</div>`}
  <button class="btn primary full" onclick="window.K.saveSkills();setTimeout(()=>window.K.nav('coachNotes'),600)">Save & Continue to Notes →</button>`;
}

export function coachNotes(){
  if(!APP.clockedIn) return locked('Clock in first.');
  if(!APP.attSaved) return `<div class="alert warn">⚠️ Complete attendance first.</div>`;
  const cls=APP.selectedClass||{name:'Class',athleteObjects:[]};
  return `
  <div class="alert info">📝 Class notes go to your director. Private notes are yours only. <strong>Notes train the AI for next session.</strong></div>
  <div class="g2">
    <div class="card">
      <div class="card-hdr"><h4>Class Notes</h4></div>
      <div style="padding:14px;">
        <div class="fg"><label class="fl">What did you work on today?</label><textarea class="ft" id="cnTa" placeholder="Today we worked on...">${APP.classNotes}</textarea></div>
        <div class="fg"><label class="fl">Concerns for director?</label><textarea class="ft" id="inTa" style="min-height:70px;" placeholder="Nothing to flag...">${APP.issueNotes}</textarea></div>
        <button class="btn primary full" onclick="window.K.saveNotes()" ${APP.notesSaved?'disabled':''}>${APP.notesSaved?'✓ Saved':'Save Notes ☁️'}</button>
      </div>
    </div>
    <div class="card">
      <div class="card-hdr"><h4>Private Athlete Notes</h4></div>
      <div style="padding:14px;">
        <p style="font-size:12px;color:var(--t3);margin-bottom:12px;">Only you can see these.</p>
        ${(cls.athleteObjects||[]).map((a,i)=>`<div class="fg">
          <label class="fl">${a.name}</label>
          <input class="fi" placeholder="Notes for ${a.name.split(' ')[0]}..." value="${APP.privateNotes[i]||''}" oninput="APP.privateNotes[${i}]=this.value">
        </div>`).join('')}
      </div>
    </div>
  </div>
  ${APP.notesSaved?`<button class="btn primary full" onclick="window.K.nav('coachDash')">✓ All Done — Return to Dashboard</button>`:''}`;
}

export function coachSched(){
  const uid=APP.user?.uid;
  const my=APP.allClasses.filter(c=>(c.coaches||[]).includes(uid)||c.coachId===uid);
  const open=(APP.subRequests||[]).filter(r=>r.status==='open');
  const myPending=(APP.subRequests||[]).filter(r=>r.requestedBy===uid&&r.status!=='confirmed'&&r.status!=='denied');
  return `
  <div class="sec-hdr"><h3>My Schedule</h3><button class="btn primary" onclick="window.K.openModal('subReqModal')">Request a Sub</button></div>
  <div class="g2">
    <div>
      <div class="sec-hdr"><h3>My Classes</h3></div>
      ${my.length===0?`<div class="card"><div style="padding:24px;text-align:center;color:var(--t3);">No classes assigned yet.</div></div>`
      :my.map(c=>{
        const isSubbing=c.subInfo&&c.subInfo.subCoachId===uid;
        const hasSub=c.subInfo&&c.subInfo.subCoachId&&c.subInfo.subCoachId!==uid;
        return `<div class="class-card" style="margin-bottom:10px;${isSubbing?'border-left-color:var(--gold);':''}" onclick="window.K.openModal('rosterModal',{classId:'${c.id}'})">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div class="cn">${c.name}${isSubbing?` <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);background:rgba(181,153,106,0.15);padding:2px 6px;border-radius:10px;margin-left:4px;">SUBBING</span>`:''}${hasSub?` <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--green);background:rgba(42,107,42,0.1);padding:2px 6px;border-radius:10px;margin-left:4px;">COVERED</span>`:''}</div>
            <span class="pill gold-p">${c.time}</span>
          </div>
          <div class="cm" style="margin-top:6px;"><span>📅 ${c.day}</span><span>👧 ${(c.athletes||[]).length}/${c.cap||8}</span></div>
          ${hasSub?`<div style="font-size:12px;color:var(--green);margin-top:6px;font-weight:600;">✓ ${c.subInfo.subCoachName} subbing on ${c.subInfo.date}</div>`:''}
          ${isSubbing?`<div style="font-size:12px;color:var(--gold);margin-top:6px;font-weight:600;">📋 You're covering this class on ${c.subInfo.date}</div>`:''}
        </div>`;
      }).join('')}
      ${myPending.length?`<div style="margin-top:8px;">${myPending.map(r=>`<div class="alert ${r.status==='pending'?'warn':'info'}" style="font-size:12px;">
        <div><strong>${r.className}</strong> — ${r.date}</div>
        <div style="margin-top:4px;">Status: <strong>${{pending:'Waiting for director',open:'Posted to board',claimed:'Director reviewing sub',awaiting_original:'Waiting for your response',confirmed:'Confirmed'}[r.status]||r.status}</strong></div>
      </div>`).join('')}</div>`:''}
    </div>
    <div>
      <div class="sec-hdr"><h3>Open Sub Board</h3></div>
      ${open.length===0?`<div class="card"><div style="padding:24px;text-align:center;color:var(--t3);">No open sub requests right now.</div></div>`
      :open.filter(r=>r.requestedBy!==uid).map(r=>{
        const myBelt=APP.profile?.belt||'Foundation';
        const belts=['Foundation','Level 1','Level 2','Level 3','Level 4','Level 5','Xcel Bronze','Xcel Silver','Xcel Gold','Xcel Platinum'];
        const myIdx=belts.indexOf(myBelt);
        const reqIdx=belts.indexOf(r.requiredBelt||'Level 1');
        const myCerts=APP.profile?.certifications||[];
        const canSub=myIdx>=reqIdx||myCerts.includes(r.requiredBelt||'Level 1');
        return `<div class="class-card" style="margin-bottom:10px;${!canSub?'opacity:0.6;':''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div class="cn">${r.className}</div>
            <span class="pill ${canSub?'gold-p':'absent'}">${canSub?r.time||'Open':'🔒 Locked'}</span>
          </div>
          <div class="cm" style="margin-top:6px;"><span>📅 ${r.date}</span><span>🎓 ${r.requiredBelt||'Level 1'}+</span></div>
          <div style="font-size:12px;color:var(--t2);margin-top:4px;">Requested by: <strong>${r.requestedByName||'Unknown'}</strong></div>
          ${!canSub?`<div class="alert danger" style="margin-top:8px;padding:8px 12px;font-size:12px;">🔒 Requires ${r.requiredBelt||'Level 1'} certification. Your belt: ${myBelt}.</div>`
          :`${r.reason?`<div style="font-size:12px;color:var(--t3);margin-top:4px;font-style:italic;">"${r.reason}"</div>`:''}<button class="btn primary full" style="margin-top:10px;" onclick="window.K.claimSub('${r.id}')">I'll Take This Class →</button>`}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

export function coachMsgs(){
  const uid=APP.user?.uid;
  const all=(APP.messages||[]).filter(m=>m.toId===uid||m.toRole==='coaches'||m.fromId===uid);
  const tab=APP.msgTab||'unread';

  // Sub confirm banners — always show at top regardless of tab
  const subConfirms=all.filter(m=>m.type==='sub_confirm_request'&&!m.read&&m.toId===uid);
  const banner=subConfirms.length?`<div style="margin-bottom:14px;">${subConfirms.map(m=>`
    <div class="alert warn" style="display:block;border-left:3px solid var(--gold);">
      <div style="font-weight:800;font-size:13px;margin-bottom:6px;">🔔 Sub Request — Your Approval Needed</div>
      <div style="font-size:13px;margin-bottom:12px;">${m.body?.split('\n')[0]||m.subject}</div>
      <div style="display:flex;gap:8px;">
        <button class="btn primary" style="flex:1;" onclick="window.K.confirmSubFromCoach('${m.subRequestId||''}')">✓ Yes — Approve</button>
        <button class="btn danger" style="flex:1;" onclick="window.K.denySubFinal('${m.subRequestId||''}')">Deny</button>
      </div>
    </div>`).join('')}</div>`:'';

  // Build parent list from my classes
  const myClasses=APP.allClasses.filter(c=>(c.coaches||[]).includes(uid)||c.coachId===uid);
  const myAthletes=APP.allAthletes.filter(a=>myClasses.some(c=>(c.athletes||[]).includes(a.id)));
  const parentOpts=myAthletes.map(a=>`<option value="parent_${a.id}">${a.name.split(' ')[0]}'s Parent (${a.name})</option>`).join('');

  const inbox=all.filter(m=>!m.read&&m.fromId!==uid&&m.fromId!=='system');
  const read=all.filter(m=>(m.read||m.fromId===uid)&&m.fromId!=='system');
  const sent=all.filter(m=>m.fromId===uid);
  const display=tab==='sent'?sent:tab==='read'?read:inbox;

  const tabs=`<div style="display:flex;gap:0;margin-bottom:12px;border:1px solid var(--bdr);border-radius:6px;overflow:hidden;">
    ${[['unread',`Inbox${inbox.length?` (${inbox.length})`:''}`,],['read','Read'],['sent','Sent']].map(([t,l])=>`
    <button onclick="window.APP.msgTab='${t}';window.K.nav('coachMsgs')"
      style="flex:1;padding:9px 6px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:none;border-right:1px solid var(--bdr);
      background:${tab===t?'var(--gold)':'var(--panel)'};color:${tab===t?'var(--sb)':'var(--t2)'};">${l}</button>`).join('')}
  </div>`;

  return banner + `
  <div class="sec-hdr"><h3>Messages</h3><button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'coach',parentOpts:'${encodeURIComponent(parentOpts)}'})">+ New Message</button></div>
  ${tabs}
  ${msgInbox(display,'coach')}`;
}

export function coachProfile(){
  const p=APP.profile||{};
  const h=APP.myTimecards||[];
  return `
  <div class="sec-hdr"><h3>My Profile</h3></div>
  <div class="g2">
    <div class="card">
      <div class="card-hdr"><h4>Coach Info</h4></div>
      <div style="padding:20px;text-align:center;">
        <div class="user-av" style="width:56px;height:56px;font-size:18px;margin:0 auto 12px;">${ini(p.name||'?')}</div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;margin-bottom:4px;">${p.name||'Coach'}</div>
        <div style="font-size:13px;color:var(--t2);margin-bottom:16px;">${p.email||''}</div>
        <div style="display:inline-flex;align-items:center;gap:8px;background:var(--p2);border:1px solid var(--bdr);border-radius:6px;padding:10px 18px;">
          <div style="width:18px;height:18px;border-radius:50%;background:${BELT_COLORS[p.belt||'Foundation']};border:2px solid rgba(0,0,0,0.1);"></div>
          <span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;">${p.belt||'Foundation'} Belt</span>
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--t3);">${p.gymName||APP.gymProfile?.name||''}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-hdr"><h4>Certifications</h4></div>
      <div style="padding:12px;">
        ${['Foundation','Level 1','Level 2','Level 3','Level 4','Level 5'].map(lv=>{
          const done=lv==='Foundation'||(p.certifications||[]).includes(lv);
          return `<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--bdr2);">
            <div style="width:12px;height:12px;border-radius:50%;background:${BELT_COLORS[lv]};flex-shrink:0;"></div>
            <span style="flex:1;font-size:13px;font-weight:600;">${lv}</span>
            <span class="pill ${done?'present':'not-r'}">${done?'Certified':'Not Started'}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>
  <div class="sec-hdr"><h3>Timecard History</h3></div>
  <div class="card"><div class="card-body">
    ${h.length===0?`<div style="padding:24px;text-align:center;color:var(--t3);">No sessions yet.</div>`
    :h.map(s=>{
      const ci=s.clockIn?new Date(s.clockIn).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'--';
      const co=s.clockOut?new Date(s.clockOut).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'Active';
      const ds=s.clockIn?new Date(s.clockIn).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):'--';
      return `<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--bdr2);">
        <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${ds}</div>
          <div style="font-size:11px;color:var(--t3);">${ci} → ${co}${s.className?` · ${s.className}`:''}</div>
          ${s.directorNote?`<div style="font-size:11px;color:var(--gold);font-style:italic;">"${s.directorNote}"</div>`:''}
        </div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:700;color:var(--gold);">${s.duration||'Active'}</div>
        <span class="pill ${s.status==='approved'?'present':s.status==='active'?'ip':'not-r'}">${s.status==='approved'?'Approved':s.status==='active'?'Active':'Pending'}</span>
      </div>`;
    }).join('')}
  </div></div>`;
}

export function library(lv='all',ev='all'){
  const lvls=['Foundation','Level 1'];
  const evts=['All','Vault','Bars','Beam','Floor','General'];
  const filtered=SKILLS.filter(s=>(lv==='all'||s.level===lv)&&(ev==='all'||ev==='All'||s.event===ev));
  return `
  <div class="sec-hdr"><h3>Skill Library</h3></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
    ${['All',...lvls].map(l=>`<button class="btn ${(lv==='all'&&l==='All')||(lv===l)?'primary':''}" onclick="APP.libLevel='${l==='All'?'all':l}';window.K.nav('library')">${l}</button>`).join('')}
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    ${evts.map(e=>`<button class="btn ${(ev==='all'&&e==='All')||(ev===e)?'primary':''}" onclick="APP.libEvent='${e==='All'?'all':e}';window.K.nav('library')">${e}</button>`).join('')}
  </div>
  <div class="card"><div class="card-body">
    ${filtered.map(s=>`<div class="ps-row" onclick="window.K.nav('skill_${s.id}')">
      <span style="font-size:16px;width:24px;">${{Vault:'🏃',Bars:'🤸',Beam:'🧘',Floor:'⭐',General:'🥋'}[s.event]||'🥋'}</span>
      <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${s.name}</div><div style="font-size:11px;color:var(--t3);">${s.level} · ${s.event}</div></div>
      <span class="pill ${s.spot==='TRUE SPOT'?'absent':s.spot==='DO NOT SPOT'?'not-r':'present'}" style="margin-right:8px;">${s.spot}</span>
      <span style="color:var(--gold);">→</span>
    </div>`).join('')}
  </div></div>`;
}

export function skillDetail(id){
  const s=SKILLS.find(x=>x.id===id);
  if(!s) return `<div class="alert warn">Skill not found.</div><button class="btn primary" onclick="window.K.nav('library')">← Library</button>`;
  const sc=s.spot==='TRUE SPOT'?'true':s.spot==='DO NOT SPOT'?'none':'form';
  const sCol={form:'var(--green)',true:'var(--red)',none:'#7A1A0F'};
  const sBg={form:'var(--g-soft)',true:'var(--r-soft)',none:'rgba(155,58,47,0.18)'};
  return `
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
    <button class="btn" onclick="window.K.nav('library')">← Library</button>
    <div><h2 style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:22px;">${s.name}</h2>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-top:2px;">${s.level} · ${s.event}</div></div>
  </div>
  ${s.mantra?`<div style="background:rgba(181,153,106,0.1);border:1px solid rgba(181,153,106,0.25);border-radius:6px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:12px;">
    <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);opacity:0.6;white-space:nowrap;">Mantra</span>
    <span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;letter-spacing:3px;color:var(--gold);text-transform:uppercase;">${s.mantra}</span>
  </div>`:''}
  <div style="background:#EDE0CB;border:1px solid var(--gold);border-radius:6px;padding:14px 18px;margin-bottom:14px;">
    <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(28,28,28,0.45);">Correct Position · </span>
    <span style="font-size:14px;font-weight:700;color:#1C1C1C;line-height:1.5;">${s.correct}</span>
  </div>
  <div class="g2">
    <div>
      <div class="card" style="margin-bottom:14px;"><div class="card-hdr" style="background:#1C1C1C;"><h4 style="color:var(--gold);">Coaching Cues</h4></div>
        <div style="padding:14px;background:#FFF9F0;">${s.cues.split('·').map(c=>`<div style="font-size:14px;color:#7A5C2E;font-style:italic;padding:4px 0;">"${c.trim()}"</div>`).join('')}</div>
      </div>
      <div class="card" style="margin-bottom:14px;"><div class="card-hdr" style="background:#1C1C1C;"><h4 style="color:var(--gold);">Teaching Drill</h4></div>
        <div style="padding:14px;font-size:13px;line-height:1.7;background:var(--p2);">${s.drill}</div>
      </div>
      ${s.principle?`<div class="card"><div class="card-hdr" style="background:#2A1A4A;"><h4 style="color:#C8A0E8;">KINETIC Principle</h4></div>
        <div style="padding:14px;font-size:13px;color:#5A3080;font-style:italic;background:#F8F0FF;line-height:1.6;">${s.principle}</div>
      </div>`:''}
    </div>
    <div>
      <div class="card" style="margin-bottom:14px;"><div class="card-hdr" style="background:#1C1C1C;"><h4 style="color:var(--gold);">Errors · Fixes · Conditioning</h4></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:var(--p2);">
            ${['Error','Fix — say this','Conditioning'].map(h=>`<div style="padding:8px 12px;font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);">${h}</div>`).join('')}
          </div>
          ${s.errors.map(e=>`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid var(--bdr2);">
            <div style="padding:9px 12px;font-size:12px;font-weight:700;">${e.e}</div>
            <div style="padding:9px 12px;font-size:12px;color:var(--green);font-weight:600;">${e.f}</div>
            <div style="padding:9px 12px;font-size:12px;color:#1E4A7C;font-style:italic;">${e.c||'—'}</div>
          </div>`).join('')}
        </div>
      </div>
      ${s.deductions?.length?`<div class="card" style="margin-bottom:14px;"><div class="card-hdr" style="background:#2A1A0A;"><h4 style="color:#D4A855;">📋 USAG Deductions</h4></div>
        <div style="background:#FFFBF5;">${s.deductions.map((d,i)=>`<div style="display:flex;justify-content:space-between;padding:9px 12px;border-bottom:1px solid rgba(181,153,106,0.1);${i%2?'background:rgba(181,153,106,0.04)':''}">
          <span style="font-size:12px;flex:1;">${d.d}</span>
          <span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:12px;color:var(--red);margin-left:12px;">${d.v}</span>
        </div>`).join('')}</div>
      </div>`:''}
      <div class="card">
        <div style="padding:10px 14px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;background:${sBg[sc]};color:${sCol[sc]};">${sc==='true'?'⚠️ TRUE SPOT':sc==='none'?'🚫 DO NOT SPOT':'✅ Form Spot'}</div>
        ${s.spotWarning?`<div style="padding:12px 14px;font-size:12px;font-weight:700;color:var(--red);background:var(--r-soft);border-left:3px solid var(--red);line-height:1.5;">${s.spotWarning}</div>`:''}
        ${s.safetyNote?`<div style="padding:12px 14px;font-size:12px;font-weight:600;color:var(--red);line-height:1.5;">⚠️ ${s.safetyNote}</div>`:''}
      </div>
    </div>
  </div>`;
}

export function lessonPlans(){
  const lvls={Foundation:['Pointed Toes & Strong Arms','Strong Legs & Hollow Body','Lunge & Lever','Relevé & Coupé','Stick & Salute','Vocabulary Review','Vault Intro','Bars Intro','Beam Intro','Floor Intro','Full Rotation','Foundations Assessment'],'Level 1':['Vault — Sprint & Approach','Vault — Punch & Hurdle','Bars — Front Support & Pullover','Bars — Cast & BHC','Bars — Underswing Dismount','Beam — Straddle Mount','Beam — Arabesque & Turn','Beam — Jumps & Dismount','Floor — Forward & Backward Roll','Floor — Cartwheel','Floor — Full Rotation','Level 1 Assessment']};
  const sel=APP.lessonLevel||'Level 1';
  const weeks=lvls[sel]||Array.from({length:12},(_,i)=>`Week ${i+1}`);
  const bc={Foundation:'#E8E8E8','Level 1':'#E8C84A','Level 2':'#E8894A','Level 3':'#4A9B6F','Level 4':'#4A7AB8','Level 5':'#7B5EA7','Xcel Bronze':'#CD8B4A','Xcel Silver':'#A8A9AD','Xcel Gold':'#B5996A','Xcel Platinum':'#8BA9BE'};
  return `
  <div class="sec-hdr"><h3>Lesson Plans</h3></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
    ${Object.keys(bc).map(l=>`<button class="btn ${sel===l?'primary':''}" onclick="APP.lessonLevel='${l}';window.K.nav('lessons')" style="display:flex;align-items:center;gap:5px;"><div style="width:8px;height:8px;border-radius:50%;background:${bc[l]};"></div>${l}</button>`).join('')}
  </div>
  <div class="g3">${weeks.map((t,i)=>`<div class="class-card" onclick="window.K.openModal('lpModal',{week:${i+1},level:'${sel}',title:'${t}'})">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:6px;">Week ${i+1}</div>
    <div class="cn" style="font-size:14px;">${t}</div>
  </div>`).join('')}</div>`;
}

function msgList(msgs, role){
  return `
  <div class="sec-hdr"><h3>Messages</h3>
    <button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'${role}'})">+ New Message</button>
  </div>
  <div class="card"><div class="card-body">
    ${msgs.length===0?`<div style="padding:24px;text-align:center;color:var(--t3);">No messages yet.</div>`
    :msgs.map((m,i)=>`<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid var(--bdr2);cursor:pointer;" onclick="window.K.openModal('msgViewModal',{idx:${i},role:'${role}'})">
      <div class="mini-av">${ini(m.from||'?')}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;">
          <div style="font-size:13px;font-weight:${!m.read?700:500};">${m.from||'Staff'} <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;text-transform:uppercase;color:var(--gold);opacity:0.7;">${m.fromRole||''}</span></div>
          <div style="font-size:11px;color:var(--t3);">${m.time||''}</div>
        </div>
        <div style="font-size:13px;font-weight:${!m.read?600:400};margin-top:2px;">${m.subject||''}</div>
        <div style="font-size:12px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${m.preview||m.body||''}</div>
      </div>
      ${!m.read&&m.fromId!==APP.user?.uid?`<div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:4px;"></div>`:''}
    </div>`).join('')}
  </div></div>`;
}

function locked(msg){return `<div class="alert warn">🔒 ${msg}</div><button class="btn primary" onclick="window.K.nav('coachDash')">← Dashboard</button>`;}
