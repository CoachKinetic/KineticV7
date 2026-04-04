import { APP, SKILLS, BELT_COLORS, BELT_LEVELS, ini } from './firebase-config.js?v=800';

const fmt=n=>n?.toLocaleString('en-US')||'0';
const pct=(a,b)=>b>0?Math.round(a/b*100):0;
const ago=d=>{if(!d)return'';const m=Math.floor((Date.now()-new Date(d))/60000);return m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:`${Math.floor(m/1440)}d ago`;};

export function dirHome(){
  const aths=APP.allAthletes||[];
  const rev=aths.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  const coaches=APP.allCoaches||[];
  const classes=APP.allClasses||[];
  const pending=(APP.subRequests||[]).filter(r=>r.status==='pending').length;
  const claimed=(APP.subRequests||[]).filter(r=>r.status==='claimed').length;
  const tcP=(APP.allTimecards||[]).filter(t=>t.status==='pending').length;
  const injP=(APP.allInjuries||[]).filter(i=>i.status==='pending').length;
  const unread=(APP.messages||[]).filter(m=>m.fromId!==APP.user?.uid&&m.fromId!=='system'&&!m.read).length;
  const today=new Date().toLocaleDateString('en-US',{weekday:'long'});
  const todayClasses=classes.filter(c=>c.day===today);
  const paid=aths.filter(a=>a.tuitionStatus==='paid').length;
  const overdue=aths.filter(a=>a.tuitionStatus==='overdue').length;
  const concerns=APP.coachConcerns||[];
  const name=(APP.profile?.name||'Director').split(' ')[0];
  const h=new Date().getHours();
  const greeting=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  const gymName=APP.gymProfile?.name||'Your Gym';

  return `
  <div style="background:linear-gradient(135deg,#1C1C1C 0%,#242424 60%,#1a1a1a 100%);border-radius:16px;padding:24px 28px;margin-bottom:20px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(181,153,106,0.06);pointer-events:none;"></div>
    <div style="position:absolute;bottom:-60px;right:60px;width:120px;height:120px;border-radius:50%;background:rgba(181,153,106,0.04);pointer-events:none;"></div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(181,153,106,0.5);margin-bottom:6px;">${gymName} · Director Portal</div>
    <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:22px;color:#FAFAF8;margin-bottom:18px;">${h<12?'Good morning':'Good afternoon'}, ${name} 👋</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      ${[
        {label:'Athletes',val:fmt(aths.length),sub:`${paid} paid · ${overdue} overdue`,icon:'👧',color:'#B5996A',click:"window.K.nav('dirAthletes')"},
        {label:'Monthly Rev',val:'$'+fmt(rev),sub:`${aths.length} enrolled`,icon:'💰',color:'#5EC85E',click:''},
        {label:'Coaches',val:fmt(coaches.length),sub:`${classes.length} classes`,icon:'🧑‍🏫',color:'#60A5FA',click:"window.K.nav('dirCoaches')"},
        {label:'Today',val:fmt(todayClasses.length),sub:`classes on ${today}`,icon:'📅',color:'#F59E0B',click:"window.K.nav('dirSched')"},
      ].map(m=>`<div onclick="${m.click}" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;${m.click?'cursor:pointer;':''}transition:all 0.15s;" ${m.click?'onmouseover="this.style.background=\'rgba(181,153,106,0.1)\';this.style.borderColor=\'rgba(181,153,106,0.25)\'"onmouseout="this.style.background=\'rgba(255,255,255,0.05)\';this.style.borderColor=\'rgba(255,255,255,0.08)\'"':''}>
        <div style="font-size:20px;margin-bottom:8px;">${m.icon}</div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:24px;color:${m.color};line-height:1;">${m.val}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(250,250,248,0.35);margin-top:5px;">${m.label}</div>
        <div style="font-size:11px;color:rgba(250,250,248,0.25);margin-top:3px;">${m.sub}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="g2" style="margin-bottom:18px;">
    <div>
      <div class="sec-hdr"><h3>Today — ${today}</h3><button class="slink" onclick="window.K.nav('dirSched')">Full Schedule →</button></div>
      ${todayClasses.length===0?`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:28px;text-align:center;"><div style="font-size:36px;margin-bottom:10px;">🌴</div><div style="font-size:14px;font-weight:600;margin-bottom:4px;">No classes today</div><div style="font-size:12px;color:var(--t3);">Enjoy the day off.</div></div>`
      :todayClasses.map(c=>{const fill=pct((c.athletes||[]).length,c.cap||8);return`<div onclick="window.K.openModal('classModal',{classId:'${c.id}'})" style="background:var(--panel);border:1px solid var(--bdr);border-left:3px solid var(--gold);border-radius:12px;padding:14px 16px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';this.style.transform='translateY(-1px)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)';this.style.transform=''">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;">${c.name}</div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--gold);background:rgba(181,153,106,0.1);border:1px solid rgba(181,153,106,0.2);padding:3px 9px;border-radius:20px;">${c.time}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--t2);margin-bottom:8px;"><span>🧑‍🏫 ${c.coachName||'TBD'}</span><span>👧 ${(c.athletes||[]).length}/${c.cap||8}</span></div>
        <div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:4px;background:var(--bg);border-radius:2px;overflow:hidden;"><div style="height:100%;border-radius:2px;background:${fill>=90?'var(--red)':fill>=70?'var(--gold)':'var(--green)'};width:${fill}%;transition:width 0.5s;"></div></div><span style="font-size:10px;color:var(--t3);font-weight:600;">${fill}%</span></div>
      </div>`;}).join('')}
    </div>
    <div>
      ${(pending+claimed+tcP+injP)>0?`
      <div class="sec-hdr"><h3 style="color:var(--red);">Action Required</h3></div>
      <div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;overflow:hidden;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        ${pending?`<div onclick="window.K.nav('dirSubs')" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--bdr2);cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(181,153,106,0.04)'" onmouseout="this.style.background=''"><div style="width:34px;height:34px;border-radius:9px;background:var(--y-soft);border:1px solid rgba(181,130,30,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🔄</div><div style="flex:1;"><div style="font-size:13px;font-weight:700;">${pending} Sub Request${pending>1?'s':''}</div><div style="font-size:11px;color:var(--t3);">Awaiting your approval</div></div><span style="color:var(--gold);font-size:16px;">→</span></div>`:''}
        ${claimed?`<div onclick="window.K.nav('dirSubs')" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--bdr2);cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(181,153,106,0.04)'" onmouseout="this.style.background=''"><div style="width:34px;height:34px;border-radius:9px;background:var(--y-soft);border:1px solid rgba(181,130,30,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">✋</div><div style="flex:1;"><div style="font-size:13px;font-weight:700;">${claimed} Sub Volunteer${claimed>1?'s':''}</div><div style="font-size:11px;color:var(--t3);">Ready to confirm</div></div><span style="color:var(--gold);font-size:16px;">→</span></div>`:''}
        ${tcP?`<div onclick="window.K.nav('dirTimecards')" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--bdr2);cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(181,153,106,0.04)'" onmouseout="this.style.background=''"><div style="width:34px;height:34px;border-radius:9px;background:var(--b-soft);border:1px solid rgba(30,74,124,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">⏱️</div><div style="flex:1;"><div style="font-size:13px;font-weight:700;">${tcP} Timecard${tcP>1?'s':''} Pending</div><div style="font-size:11px;color:var(--t3);">Need review & approval</div></div><span style="color:var(--gold);font-size:16px;">→</span></div>`:''}
        ${injP?`<div onclick="window.K.nav('dirInjuries')" style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='rgba(155,58,47,0.04)'" onmouseout="this.style.background=''"><div style="width:34px;height:34px;border-radius:9px;background:var(--r-soft);border:1px solid rgba(155,58,47,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🚑</div><div style="flex:1;"><div style="font-size:13px;font-weight:700;color:var(--red);">${injP} Injury Report${injP>1?'s':''}</div><div style="font-size:11px;color:var(--t3);">Requires immediate attention</div></div><span style="color:var(--red);font-size:16px;">→</span></div>`:''}
      </div>`:``}

      ${concerns.length>0?`
      <div class="sec-hdr"><h3>Coach Concerns</h3></div>
      <div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;overflow:hidden;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        ${concerns.slice(0,3).map(n=>{const coach=APP.allCoaches.find(c=>c.id===n.coachId)||{name:'Coach'};const cls=APP.allClasses.find(c=>c.id===n.classId);return`<div style="padding:13px 16px;border-bottom:1px solid var(--bdr2);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;"><div style="display:flex;align-items:center;gap:8px;"><div class="mini-av" style="width:24px;height:24px;font-size:9px;">${ini(coach.name)}</div><span style="font-size:13px;font-weight:700;">${coach.name}</span>${cls?`<span style="font-size:11px;color:var(--t3);">· ${cls.name}</span>`:''}</div><button onclick="window.K.dismissConcern('${n.id}')" style="background:transparent;border:1px solid var(--bdr);border-radius:4px;padding:3px 8px;font-size:10px;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--t3);cursor:pointer;">Dismiss</button></div>
          <div style="font-size:12px;color:var(--t2);line-height:1.5;">${n.issueNotes}</div>
        </div>`;}).join('')}
      </div>`:``}

      <div class="sec-hdr"><h3>Quick Actions</h3></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${[
          {icon:'👧',label:'Add Athlete',click:"window.K.openModal('addAthModal')"},
          {icon:'🧑‍🏫',label:'Invite Coach',click:"window.K.openModal('inviteModal',{type:'coach'})"},
          {icon:'📅',label:'Add Class',click:"window.K.openModal('addClassModal')"},
          {icon:'📄',label:'Upload Doc',click:"window.K.openModal('uploadDocModal')"},
          {icon:'💬',label:'Message All',click:"window.K.openModal('newMsgModal',{role:'director'})"},
          {icon:'🎥',label:'Add Routine',click:"window.K.openModal('uploadRoutineModal')"},
        ].map(a=>`<div onclick="${a.click}" style="background:var(--panel);border:1px solid var(--bdr);border-radius:10px;padding:13px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.04);" onmouseover="this.style.borderColor='var(--gold)';this.style.background='rgba(181,153,106,0.04)'" onmouseout="this.style.borderColor='var(--bdr)';this.style.background='var(--panel)'">
          <span style="font-size:18px;">${a.icon}</span>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--t2);">${a.label}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

export function dirSched(){
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const total=APP.allClasses.length;
  const totalAths=APP.allClasses.reduce((s,c)=>(c.athletes||[]).length+s,0);
  return `
  <div class="sec-hdr"><h3>Schedule</h3><button class="btn primary" onclick="window.K.openModal('addClassModal')">+ Add Class</button></div>
  <div class="stats4" style="margin-bottom:20px;">
    <div class="stat"><div class="si">📅</div><div class="sl">Classes</div><div class="sv">${total}</div></div>
    <div class="stat"><div class="si">👧</div><div class="sl">Athletes Placed</div><div class="sv gold">${totalAths}</div></div>
    <div class="stat" onclick="window.K.nav('dirSubs')" style="cursor:pointer;"><div class="si">🔄</div><div class="sl">Sub Requests</div><div class="sv">${(APP.subRequests||[]).filter(r=>r.status==='pending').length}</div></div>
    <div class="stat"><div class="si">✅</div><div class="sl">Confirmed Subs</div><div class="sv">${(APP.subRequests||[]).filter(r=>r.status==='confirmed').length}</div></div>
  </div>
  ${days.map(day=>{
    const dc=APP.allClasses.filter(c=>c.day===day);
    return`<div style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--gold);opacity:0.7;">${day}<span style="color:var(--t3);margin-left:8px;opacity:0.7;">${dc.length} class${dc.length!==1?'es':''}</span></div>
        <button class="slink" style="font-size:10px;" onclick="window.K.openModal('addClassModal',{day:'${day}'})">+ Add</button>
      </div>
      ${dc.length===0?`<div style="background:var(--panel);border:1px dashed var(--bdr);border-radius:10px;padding:16px;text-align:center;color:var(--t3);font-size:13px;">No classes — <button class="slink" onclick="window.K.openModal('addClassModal',{day:'${day}'})">add one</button></div>`
      :`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;">${dc.map(c=>{const fill=pct((c.athletes||[]).length,c.cap||8);return`<div style="background:var(--panel);border:1px solid var(--bdr);border-top:3px solid var(--gold);border-radius:10px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">
          <div onclick="window.K.openModal('classModal',{classId:'${c.id}'})" style="cursor:pointer;flex:1;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;margin-bottom:3px;">${c.name}</div>
          <div style="font-size:12px;color:var(--t2);">${c.time} · ${c.level}</div></div>
          <button class="btn" style="font-size:10px;padding:4px 9px;flex-shrink:0;margin-left:8px;" onclick="window.K.openModal('editClassModal',{classId:'${c.id}'})">Edit</button>
        </div>
        <div style="font-size:12px;color:var(--t3);margin-bottom:8px;">🧑‍🏫 ${c.coachName||'TBD'}</div>
        <div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:4px;background:var(--bg);border-radius:2px;overflow:hidden;"><div style="height:100%;border-radius:2px;background:${fill>=90?'var(--red)':fill>=70?'var(--gold)':'var(--green)'};width:${fill}%;"></div></div><span style="font-size:11px;font-weight:700;color:var(--t3);">${(c.athletes||[]).length}/${c.cap||8}</span></div>
      </div>`}).join('')}</div>`}
    </div>`;
  }).join('')}`;
}

export function dirAthletes(tab='active'){
  const active=APP.allAthletes||[];const archived=APP.archivedAthletes||[];
  const list=tab==='archived'?archived:active;
  return `
  <div class="sec-hdr">
    <div style="display:flex;gap:8px;"><button class="btn ${tab!=='archived'?'primary':''}" onclick="window.K.nav('dirAthletes')">Active (${active.length})</button><button class="btn ${tab==='archived'?'primary':''}" onclick="window.K.nav('dirAthletes_arch')">Archived (${archived.length})</button></div>
    ${tab!=='archived'?`<button class="btn primary" onclick="window.K.openModal('addAthModal')">+ Add Athlete</button>`:''}
  </div>
  ${list.length===0?`<div class="empty-state"><div class="es-icon">${tab==='archived'?'📦':'👧'}</div><h3>${tab==='archived'?'No archived athletes':'No athletes yet'}</h3>${tab!=='archived'?`<p>Add your first athlete to get started.</p><button class="btn primary" style="margin-top:16px;" onclick="window.K.openModal('addAthModal')">Add Athlete →</button>`:''}</div>`
  :`<div class="card"><table class="table"><thead><tr><th>Athlete</th><th>Level</th><th>Parent</th><th>Tuition</th><th></th></tr></thead><tbody>${list.map(a=>`<tr>
    <td><div class="name-cell"><div class="mini-av">${ini(a.name)}</div><div><div>${a.name}</div>${a.medical?`<div style="font-size:10px;color:var(--red);margin-top:1px;">⚠️ Medical note</div>`:''}</div></div></td>
    <td><div class="belt-b"><div class="belt-d" style="background:${BELT_COLORS[a.level||'Level 1']};"></div>${a.level||'Level 1'}</div></td>
    <td style="font-size:12px;color:var(--t2);">${a.parentName||'—'}<div style="font-size:11px;color:var(--t3);">${a.parentEmail||''}</div></td>
    <td><span class="pill ${a.tuitionStatus==='paid'?'present':a.tuitionStatus==='overdue'?'absent':'ip'}">${a.tuitionStatus||'Pending'}</span></td>
    <td style="white-space:nowrap;"><button class="btn" style="font-size:10px;padding:3px 8px;margin-right:4px;" onclick="window.K.openModal('viewAthModal',{id:'${a.id}'})">View</button><button class="btn" style="font-size:10px;padding:3px 8px;margin-right:4px;" onclick="window.K.openModal('editAthModal',{id:'${a.id}'})">Edit</button>${tab==='archived'?`<button class="btn primary" style="font-size:10px;padding:3px 8px;" onclick="window.K.unarchiveAthlete('${a.id}')">Restore</button>`:`<button class="btn danger" style="font-size:10px;padding:3px 8px;" onclick="window.K.archiveAthlete('${a.id}','${a.name}')">Archive</button>`}</td>
  </tr>`).join('')}</tbody></table></div>`}`;
}

export function dirCoaches(){
  return `
  <div class="sec-hdr"><h3>Coaches</h3><button class="btn primary" onclick="window.K.openModal('inviteModal',{type:'coach'})">+ Invite Coach</button></div>
  ${APP.allCoaches.length===0?`<div class="empty-state"><div class="es-icon">🧑‍🏫</div><h3>No coaches yet</h3><p>Invite your first coach to get started.</p><button class="btn primary" style="margin-top:16px;" onclick="window.K.openModal('inviteModal',{type:'coach'})">Invite Coach →</button></div>`
  :`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">${APP.allCoaches.map(c=>{const cc=APP.allClasses.filter(cls=>(cls.coaches||[]).includes(c.id)||cls.coachId===c.id);const active=(APP.allTimecards||[]).some(t=>t.coachId===c.id&&t.status==='active');return`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.04);transition:all 0.15s;" onmouseover="this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="user-av" style="width:44px;height:44px;font-size:15px;position:relative;">${ini(c.name)}${active?`<div style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:#5EC85E;border:2px solid var(--panel);"></div>`:''}</div>
        <div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:15px;">${c.name}</div><div class="belt-b" style="margin-top:3px;"><div class="belt-d" style="background:${BELT_COLORS[c.belt||'Foundation']};"></div>${c.belt||'Foundation'}</div></div>
      </div>
      <button class="btn" style="font-size:10px;padding:5px 10px;" onclick="window.K.openModal('editCoachModal',{id:'${c.id}'})">Edit</button>
    </div>
    <div style="font-size:12px;color:var(--t3);margin-bottom:10px;">${c.email||''}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <span style="background:var(--p2);border:1px solid var(--bdr);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;">📅 ${cc.length} class${cc.length!==1?'es':''}</span>
      ${(c.certifications||[]).length>0?`<span style="background:rgba(181,153,106,0.1);border:1px solid rgba(181,153,106,0.2);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;color:var(--gold);">+${c.certifications.length} cert${c.certifications.length!==1?'s':''}</span>`:''}
      ${active?`<span style="background:rgba(94,200,94,0.1);border:1px solid rgba(94,200,94,0.2);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;color:#5EC85E;">● Clocked In</span>`:''}
    </div>
  </div>`;}).join('')}</div>`}`;
}

export function dirTimecards(){
  const all=APP.allTimecards||[];
  const now=new Date();
  const weekAgo=new Date(now-7*86400000).toISOString();
  const calcMins=tcs=>tcs.filter(t=>t.duration).reduce((s,t)=>{const p=t.duration?.match(/(\d+)h\s*(\d+)m/);if(p)return s+parseInt(p[1])*60+parseInt(p[2]);const q=t.duration?.match(/(\d+)m/);return s+(q?parseInt(q[1]):0);},0);
  const fmt=m=>`${Math.floor(m/60)}h ${m%60}m`;
  const active=all.filter(t=>t.status==='active');
  return `
  <div class="sec-hdr"><h3>Timecards</h3><button class="btn" onclick="window.K.exportTimecards()">⬇ Export CSV</button></div>
  ${active.length>0?`<div style="background:linear-gradient(135deg,#0D2A0D,#0F3A0F);border:1px solid rgba(94,200,94,0.25);border-radius:12px;padding:16px 20px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><div style="width:8px;height:8px;border-radius:50%;background:#5EC85E;animation:pulse 2s infinite;"></div><span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(94,200,94,0.7);">Currently Clocked In</span></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">${active.map(t=>{const m=t.clockIn?Math.floor((Date.now()-new Date(t.clockIn).getTime())/60000):0;return`<div style="background:rgba(94,200,94,0.08);border:1px solid rgba(94,200,94,0.2);border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;"><div class="mini-av">${ini(t.coachName||'?')}</div><div><div style="font-size:13px;font-weight:700;color:#FAFAF8;">${t.coachName||'Coach'}</div><div style="font-size:11px;color:rgba(94,200,94,0.7);">⏱ ${m>=60?Math.floor(m/60)+'h '+(m%60)+'m':m+'m'}</div></div></div>`;}).join('')}</div>
  </div>`:''}
  <div class="stats4" style="margin-bottom:20px;">
    <div class="stat"><div class="sl">Pending</div><div class="sv gold">${all.filter(t=>t.status==='pending').length}</div></div>
    <div class="stat"><div class="sl">This Week</div><div class="sv">${fmt(calcMins(all.filter(t=>t.clockIn>=weekAgo)))}</div></div>
    <div class="stat"><div class="sl">Approved</div><div class="sv">${all.filter(t=>t.status==='approved').length}</div></div>
    <div class="stat"><div class="sl">Active Now</div><div class="sv" style="color:#5EC85E;">${active.length}</div></div>
  </div>
  <div class="card">${all.length===0?`<div style="padding:32px;text-align:center;color:var(--t3);">No timecards yet.</div>`:`<table class="table"><thead><tr><th>Coach</th><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Duration</th><th>Status</th><th></th></tr></thead><tbody>${all.slice(0,50).map(t=>{const ci=t.clockIn?new Date(t.clockIn).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'—';const co=t.clockOut?new Date(t.clockOut).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'Active';const ds=t.clockIn?new Date(t.clockIn).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—';return`<tr><td><div class="name-cell"><div class="mini-av">${ini(t.coachName||'?')}</div>${t.coachName||'Coach'}</div></td><td style="font-size:12px;">${ds}</td><td style="font-size:12px;">${ci}</td><td style="font-size:12px;color:${t.status==='active'?'#5EC85E':'var(--t2)'};">${co}</td><td><span style="font-family:'Montserrat',sans-serif;font-weight:700;color:var(--gold);">${t.duration||'—'}</span></td><td><span class="pill ${t.status==='approved'?'present':t.status==='active'?'ip':'gold-p'}">${t.status||'pending'}</span></td><td style="white-space:nowrap;">${t.status==='pending'?`<button class="btn primary" style="font-size:10px;padding:4px 8px;margin-right:4px;" onclick="window.K.approveTC('${t.id}')">✓</button>`:''}<button class="btn" style="font-size:10px;padding:4px 8px;" onclick="window.K.openModal('editTCModal',{id:'${t.id}'})">Edit</button></td></tr>`;}).join('')}</tbody></table>`}</div>`;
}

export function dirMsgs(){
  const tab=window.APP?.msgTab||'unread';
  const all=APP.messages||[];const me=APP.user?.uid||'';
  const inbox=all.filter(m=>m.fromId!==me&&m.fromId!=='system'&&!m.read);
  const readMsgs=all.filter(m=>(m.read||m.fromId===me)&&m.fromId!=='system');
  const sent=all.filter(m=>m.fromId===me);
  const display=tab==='sent'?sent:tab==='read'?readMsgs:inbox;
  return `
  <div class="sec-hdr"><h3>Messages</h3><button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'director'})">+ New Message</button></div>
  <div class="tab-bar">${[['unread',`Inbox${inbox.length?` (${inbox.length})`:''}`,],['read','Read'],['sent','Sent']].map(([t,l])=>`<button class="tab-btn ${tab===t?'on':''}" onclick="window.APP.msgTab='${t}';window.K.nav('dirMsgs')">${l}</button>`).join('')}</div>
  ${display.length===0?`<div class="empty-state compact"><div class="es-icon">${tab==='unread'?'📬':'📭'}</div><h3>${tab==='unread'?'No new messages':'Nothing here yet'}</h3></div>`
  :msgList(display,me,'director')}`;
}

export function dirBilling(){
  const aths=APP.allAthletes||[];
  const total=aths.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  const paid=aths.filter(a=>a.tuitionStatus==='paid');
  const overdue=aths.filter(a=>a.tuitionStatus==='overdue');
  const pending=aths.filter(a=>!a.tuitionStatus||a.tuitionStatus==='pending');
  return `
  <div class="sec-hdr"><h3>Tuition</h3><button class="btn primary" onclick="window.K.openModal('addChargeModal')">+ Add Charge</button></div>
  <div style="background:linear-gradient(135deg,#1C1C1C,#242424);border-radius:14px;padding:22px 26px;margin-bottom:20px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(181,153,106,0.5);margin-bottom:8px;">Monthly Revenue</div>
    <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:42px;color:var(--gold);letter-spacing:-1px;margin-bottom:16px;">$${fmt(total)}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      ${[{n:'Paid',v:paid.length,c:'#5EC85E',bg:'rgba(94,200,94,0.1)'},{n:'Pending',v:pending.length,c:'var(--gold)',bg:'rgba(181,153,106,0.1)'},{n:'Overdue',v:overdue.length,c:'#FF8A80',bg:'rgba(155,58,47,0.15)'}].map(s=>`<div style="background:${s.bg};border-radius:8px;padding:12px;text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:24px;color:${s.c};">${s.v}</div><div style="font-size:11px;color:rgba(250,250,248,0.4);margin-top:3px;">${s.n}</div></div>`).join('')}
    </div>
  </div>
  <div class="card"><table class="table"><thead><tr><th>Athlete</th><th>Amount</th><th>Cycle</th><th>Status</th><th></th></tr></thead><tbody>${aths.map(a=>`<tr>
    <td><div class="name-cell"><div class="mini-av">${ini(a.name)}</div><div><div>${a.name}</div><div style="font-size:11px;color:var(--t3);">${a.level||'Level 1'}</div></div></div></td>
    <td><span style="font-family:'Montserrat',sans-serif;font-weight:700;">$${a.tuitionAmount||185}</span></td>
    <td style="font-size:12px;color:var(--t2);">${a.billingCycle||'Monthly'}</td>
    <td><span class="pill ${a.tuitionStatus==='paid'?'present':a.tuitionStatus==='overdue'?'absent':'ip'}">${a.tuitionStatus||'Pending'}</span></td>
    <td style="white-space:nowrap;"><button class="btn" style="font-size:10px;padding:3px 8px;margin-right:4px;" onclick="window.K.openModal('editTuitionModal',{id:'${a.id}'})">Edit</button><button class="btn" style="font-size:10px;padding:3px 8px;" onclick="window.K.sendTuitionReminder('${a.id}')">📨</button></td>
  </tr>`).join('')}</tbody></table></div>`;
}

export function dirSubs(){
  const all=APP.subRequests||[];
  const steps=[
    {key:'pending',label:'Awaiting Your Approval',color:'#F59E0B',bg:'rgba(245,158,11,0.1)',action:r=>`<div style="display:flex;gap:6px;margin-top:10px;"><button class="btn primary" style="flex:1;font-size:11px;" onclick="window.K.approveSubReq('${r.id}')">✓ Approve & Post</button><button class="btn danger" style="flex:1;font-size:11px;" onclick="window.K.denySubReq('${r.id}')">Deny</button></div>`},
    {key:'open',label:'Posted — Waiting for Sub',color:'#60A5FA',bg:'rgba(96,165,250,0.1)',action:()=>''},
    {key:'claimed',label:'Sub Volunteered — Review',color:'var(--gold)',bg:'rgba(181,153,106,0.1)',action:r=>`<div style="display:flex;gap:6px;margin-top:10px;"><button class="btn primary" style="flex:1;font-size:11px;" onclick="window.K.approveSubClaim('${r.id}')">✓ Send to ${r.subCoachName||'Coach'}</button><button class="btn danger" style="flex:1;font-size:11px;" onclick="window.K.denySubReq('${r.id}')">Deny</button></div>`},
    {key:'awaiting_original',label:'Awaiting Original Coach',color:'#60A5FA',bg:'rgba(96,165,250,0.1)',action:()=>''},
    {key:'confirmed',label:'✓ Confirmed',color:'#5EC85E',bg:'rgba(94,200,94,0.1)',action:()=>''},
  ];
  return `
  <div class="sec-hdr"><h3>Sub Requests</h3></div>
  ${all.length===0?`<div class="empty-state"><div class="es-icon">🔄</div><h3>No sub requests</h3><p>When coaches need substitutes, requests will appear here.</p></div>`
  :steps.map(step=>{const reqs=all.filter(r=>r.status===step.key);if(!reqs.length)return'';return`<div style="margin-bottom:20px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><div style="width:8px;height:8px;border-radius:50%;background:${step.color};"></div><div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${step.color};">${step.label}</div><span style="background:${step.bg};color:${step.color};font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid ${step.color}44;">${reqs.length}</span></div>
    ${reqs.map(r=>`<div style="background:var(--panel);border:1px solid var(--bdr);border-left:3px solid ${step.color};border-radius:10px;padding:14px 16px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;">${r.className}</div><span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;background:${step.bg};color:${step.color};padding:3px 10px;border-radius:6px;border:1px solid ${step.color}33;">${r.date}</span></div>
      <div style="display:flex;gap:12px;font-size:12px;color:var(--t2);margin-bottom:4px;"><span>👤 ${r.requestedByName||'Coach'}</span><span>🎓 ${r.requiredBelt||'Level 1'}+</span></div>
      ${r.reason?`<div style="font-size:12px;color:var(--t3);font-style:italic;margin-top:4px;">"${r.reason}"</div>`:''}
      ${r.subCoachName&&r.status!=='pending'?`<div style="font-size:12px;color:var(--t2);margin-top:4px;padding:6px 10px;background:var(--p2);border-radius:6px;">Sub: <strong>${r.subCoachName}</strong></div>`:''}
      ${step.action(r)}
    </div>`).join('')}</div>`;}).join('')}`;
}

export function dirInjuries(){
  const all=APP.allInjuries||[];
  const active=all.filter(i=>i.status!=='resolved');
  const resolved=all.filter(i=>i.status==='resolved');
  const showRes=window.APP?.showResolvedInjuries||false;
  const list=showRes?resolved:active;
  return `
  <div class="sec-hdr"><h3>Injury Log</h3></div>
  <div class="stats2" style="margin-bottom:20px;">
    <div class="stat" style="cursor:pointer;border:2px solid ${!showRes?'var(--gold)':'var(--bdr)'}" onclick="window.APP.showResolvedInjuries=false;window.K.nav('dirInjuries')"><div class="si">🚑</div><div class="sl">Active</div><div class="sv ${active.length?'red':''}">${active.length}</div><div class="ssub">${!showRes?'Currently viewing':''}</div></div>
    <div class="stat" style="cursor:pointer;border:2px solid ${showRes?'var(--green)':'var(--bdr)'}" onclick="window.APP.showResolvedInjuries=true;window.K.nav('dirInjuries')"><div class="si">✅</div><div class="sl">Resolved</div><div class="sv">${resolved.length}</div><div class="ssub">${showRes?'Currently viewing':''}</div></div>
  </div>
  ${list.length===0?`<div class="empty-state"><div class="es-icon">${showRes?'📋':'✅'}</div><h3>${showRes?'No resolved reports':'No active injuries'}</h3>${!showRes?'<p>Great news — all clear.</p>':''}</div>`
  :`<div style="display:flex;flex-direction:column;gap:8px;">${list.map(i=>{const ds=i.date?new Date(i.date).toLocaleDateString('en-US',{month:'long',day:'numeric'}):'-';return`<div style="background:var(--panel);border:1px solid var(--bdr);border-left:3px solid ${i.status==='resolved'?'var(--green)':'var(--red)'};border-radius:10px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <div style="display:flex;align-items:center;gap:10px;"><div class="mini-av">${ini(i.coachName||'?')}</div><div><div style="font-size:13px;font-weight:700;">${i.coachName||'Coach'}</div><div style="font-size:11px;color:var(--t3);">${i.className||'—'} · ${ds}</div></div></div>
      <div style="display:flex;align-items:center;gap:8px;"><span class="pill ${i.status==='resolved'?'present':'absent'}">${i.status||'Pending'}</span>${i.status!=='resolved'?`<button class="btn primary" style="font-size:10px;padding:5px 10px;" onclick="window.K.resolveInjury('${i.id}')">Resolve</button>`:''}</div>
    </div>
    <div style="font-size:12px;color:var(--t2);">${i.details||'Auto-logged at clock-out'}</div>
  </div>`;}).join('')}</div>`}`;
}

export function dirAttendance(){
  const today=new Date().toISOString().split('T')[0];
  const viewDate=window.APP?.attViewDate||today;
  const viewDateObj=new Date(viewDate+'T12:00');
  const dayName=viewDateObj.toLocaleDateString('en-US',{weekday:'long'});
  const isToday=viewDate===today;
  const dayClasses=APP.allClasses.filter(c=>c.day===dayName);
  const records=APP.attRecords||{};
  return `
  <div class="sec-hdr"><h3>Attendance</h3>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
      <button class="btn" onclick="window.APP.attViewDate=new Date(new Date('${viewDate}T12:00')-86400000).toISOString().split('T')[0];window.K.loadAttendanceRecords();window.K.nav('dirAttendance')">‹</button>
      <input type="date" class="fi" style="width:auto;font-size:12px;padding:5px 10px;" value="${viewDate}" onchange="window.APP.attViewDate=this.value;window.K.loadAttendanceRecords();window.K.nav('dirAttendance')">
      <button class="btn ${isToday?'primary':''}" onclick="window.APP.attViewDate=null;window.K.loadAttendanceRecords();window.K.nav('dirAttendance')">Today</button>
      <button class="btn" onclick="window.APP.attViewDate=new Date(new Date('${viewDate}T12:00').getTime()+86400000).toISOString().split('T')[0];window.K.loadAttendanceRecords();window.K.nav('dirAttendance')" ${isToday?'disabled':''}>›</button>
    </div>
  </div>
  <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--t2);margin-bottom:16px;">${viewDateObj.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div>
  ${dayClasses.length===0?`<div class="empty-state compact"><div class="es-icon">📅</div><h3>No classes on ${dayName}s</h3></div>`
  :`<div class="g2">${dayClasses.map(cls=>{const recKey=viewDate+'_'+cls.id;const rec=records[recKey];const aths=APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id));const presentIds=rec?.presentIds||[];const absentIds=rec?.absentIds||[];const hasData=rec&&(presentIds.length||absentIds.length);const pctPresent=hasData&&aths.length?Math.round(presentIds.length/aths.length*100):0;return`<div class="card"><div class="card-hdr"><div><h4>${cls.name}</h4><div style="font-size:11px;color:var(--t3);">${cls.time} · ${cls.coachName||'TBD'}</div></div>${hasData?`<div style="display:flex;align-items:center;gap:6px;"><span class="pill present">${presentIds.length}</span><span class="pill absent">${absentIds.length}</span></div>`:`<span class="pill not-r">No Record</span>`}</div>
    ${hasData?`<div style="padding:8px 14px 4px;background:var(--p2);border-bottom:1px solid var(--bdr);"><div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:4px;background:var(--bg);border-radius:2px;overflow:hidden;"><div style="height:100%;border-radius:2px;background:${pctPresent>=80?'var(--green)':'var(--gold)'};width:${pctPresent}%;"></div></div><span style="font-size:10px;font-weight:700;color:var(--t3);">${pctPresent}%</span></div></div>`:''}
    <div>${aths.map(a=>{const isP=!hasData||presentIds.includes(a.id);const isA=hasData&&absentIds.includes(a.id);return`<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--bdr2);"><div class="mini-av">${ini(a.name)}</div><div style="flex:1;font-size:13px;font-weight:600;">${a.name}</div>${hasData?`<div style="display:flex;gap:4px;"><button style="width:32px;height:28px;border-radius:5px;border:1.5px solid ${isP?'var(--green)':'var(--bdr)'};background:${isP?'var(--g-soft)':'transparent'};cursor:pointer;font-size:13px;transition:all 0.15s;" onclick="window.K.editAttRecord('${viewDate}','${cls.id}','${a.id}','present')">✅</button><button style="width:32px;height:28px;border-radius:5px;border:1.5px solid ${isA?'var(--red)':'var(--bdr)'};background:${isA?'var(--r-soft)':'transparent'};cursor:pointer;font-size:13px;transition:all 0.15s;" onclick="window.K.editAttRecord('${viewDate}','${cls.id}','${a.id}','absent')">❌</button></div>`:`<span class="pill not-r" style="font-size:9px;">—</span>`}</div>`;}).join('')}</div>
  </div>`;}).join('')}</div>`}`;
}

export function dirDocuments(){
  const docs=(APP.allDocuments||[]).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const icons={'pdf':'📄','image':'🖼️','video':'🎥','form':'📋','link':'🔗','other':'📎'};
  return `
  <div class="sec-hdr"><h3>Documents</h3><button class="btn primary" onclick="window.K.openModal('uploadDocModal')">+ Upload</button></div>
  <div style="background:linear-gradient(135deg,rgba(181,153,106,0.08),rgba(181,153,106,0.03));border:1px solid rgba(181,153,106,0.2);border-radius:12px;padding:14px 18px;margin-bottom:16px;font-size:13px;color:var(--t2);">
    📎 Upload links to Google Drive, Dropbox, or any URL. Parents see documents shared with their child in their portal.
  </div>
  ${docs.length===0?`<div class="empty-state"><div class="es-icon">📄</div><h3>No documents yet</h3><p>Upload forms, schedules, and policies to share with parents.</p><button class="btn primary" style="margin-top:16px;" onclick="window.K.openModal('uploadDocModal')">Upload First Document →</button></div>`
  :`<div style="display:flex;flex-direction:column;gap:8px;">${docs.map(d=>{const sharedLabel=d.sharedWith==='all'?'All Parents':d.sharedWith==='class'?`${(d.sharedWithIds||[]).length} class(es)`:`${(d.sharedWithIds||[]).length} athlete(s)`;return`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="width:46px;height:46px;border-radius:12px;background:rgba(181,153,106,0.1);border:1px solid rgba(181,153,106,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${icons[d.fileType||'other']||'📎'}</div>
    <div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.name||'Document'}</div>
    ${d.description?`<div style="font-size:12px;color:var(--t2);margin-top:2px;">${d.description}</div>`:''}
    <div style="font-size:11px;color:var(--t3);margin-top:4px;display:flex;align-items:center;gap:10px;"><span>👥 ${sharedLabel}</span><span>${d.createdAt?new Date(d.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''}</span></div></div>
    <div style="display:flex;gap:6px;flex-shrink:0;">${d.fileUrl?`<a href="${d.fileUrl}" target="_blank" class="btn" style="font-size:10px;padding:5px 10px;">View ↗</a>`:''}<button class="btn danger" style="font-size:10px;padding:5px 10px;" onclick="window.K.deleteDocument('${d.id}')">Delete</button></div>
  </div>`;}).join('')}</div>`}`;
}

export function dirRoutines(){
  const routines=(APP.allRoutines||[]).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  return `
  <div class="sec-hdr"><h3>Routines & Media</h3><button class="btn primary" onclick="window.K.openModal('uploadRoutineModal')">+ Add Routine</button></div>
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(99,102,241,0.25);border-radius:14px;padding:22px 24px;margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
      <div style="width:48px;height:48px;border-radius:12px;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.3);display:flex;align-items:center;justify-content:center;font-size:22px;">🎥</div>
      <div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;color:#a5b4fc;">Video & Audio Library</div><div style="font-size:12px;color:rgba(165,180,252,0.5);margin-top:3px;">Share routine videos and floor music with parents and athletes</div></div>
      <span style="margin-left:auto;background:rgba(99,102,241,0.15);color:#818cf8;font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:10px;border:1px solid rgba(99,102,241,0.3);flex-shrink:0;">KINETIC 2.0</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(99,102,241,0.15);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;margin-bottom:8px;">🎬</div><div style="font-size:13px;color:rgba(165,180,252,0.8);font-weight:600;">Routine Videos</div><div style="font-size:11px;color:rgba(165,180,252,0.4);margin-top:4px;">Upload YouTube or Drive links</div></div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(99,102,241,0.15);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:28px;margin-bottom:8px;">🎵</div><div style="font-size:13px;color:rgba(165,180,252,0.8);font-weight:600;">Floor Music</div><div style="font-size:11px;color:rgba(165,180,252,0.4);margin-top:4px;">Share audio files for floor routines</div></div>
    </div>
  </div>
  ${routines.length===0?`<div class="empty-state"><div class="es-icon">🎬</div><h3>No routines yet</h3><p>Add video and audio links to share with athletes.</p></div>`
  :`<div style="display:flex;flex-direction:column;gap:8px;">${routines.map(r=>`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="width:46px;height:46px;border-radius:12px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;font-size:22px;">🎬</div>
    <div style="flex:1;"><div style="font-size:14px;font-weight:700;">${r.name||'Routine'}</div><div style="font-size:12px;color:var(--t2);margin-top:2px;">${r.className||'All Classes'} ${r.level?'· '+r.level:''}</div></div>
    <div style="display:flex;gap:6px;">${r.videoUrl?`<a href="${r.videoUrl}" target="_blank" class="btn primary" style="font-size:10px;padding:5px 10px;">▶ Video</a>`:''} ${r.audioUrl?`<a href="${r.audioUrl}" target="_blank" class="btn" style="font-size:10px;padding:5px 10px;">♪ Audio</a>`:''}<button class="btn danger" style="font-size:10px;padding:5px 10px;" onclick="window.K.deleteRoutine('${r.id}')">Delete</button></div>
  </div>`).join('')}</div>`}`;
}

function msgList(msgs,me,role){
  return`<div style="display:flex;flex-direction:column;gap:6px;">${msgs.map(m=>{const isMine=m.fromId===me;const isUnread=!m.read&&!isMine;const all=window.APP?.messages||[];const idx=all.findIndex(x=>x===m||x.id===m.id);return`<div onclick="window.K.openModal('msgViewModal',{idx:${idx},role:'${role}'})" style="background:var(--panel);border:1px solid var(--bdr);border-left:3px solid ${isUnread?'var(--gold)':'transparent'};border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:flex-start;gap:12px;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
    <div class="mini-av" style="${isUnread?'background:linear-gradient(135deg,var(--gold),#7A5A2A);color:var(--sb);':''}">${ini(m.from||'?')}</div>
    <div style="flex:1;min-width:0;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;"><span style="font-size:13px;font-weight:${isUnread?700:500};">${isMine?'→ '+(m.toRole||'recipient'):m.from||'Unknown'}</span><span style="font-size:11px;color:var(--t3);">${m.time||''}</span></div>
    <div style="font-size:13px;font-weight:${isUnread?600:400};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.subject||''}</div>
    <div style="font-size:12px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${m.preview||m.body||''}</div></div>
    ${isUnread?`<div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:4px;"></div>`:''}
  </div>`;}).join('')}</div>`;
}

export function msgInbox(msgs,role){
  const uid=window.APP?.user?.uid||'';
  const me=uid;
  if(!msgs||msgs.length===0)return`<div class="empty-state compact"><div class="es-icon">📭</div><h3>Nothing here yet</h3></div>`;
  return msgList(msgs,me,role);
}

export function dirAnalytics(){
  const aths=APP.allAthletes||[];
  const coaches=APP.allCoaches||[];
  const classes=APP.allClasses||[];
  const timecards=APP.allTimecards||[];
  const messages=APP.messages||[];
  const now=new Date();
  const monthAgo=new Date(now-30*86400000).toISOString();
  const weekAgo=new Date(now-7*86400000).toISOString();

  // Revenue breakdown
  const rev=aths.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  const paid=aths.filter(a=>a.tuitionStatus==='paid');
  const overdue=aths.filter(a=>a.tuitionStatus==='overdue');
  const collectionRate=aths.length?Math.round(paid.length/aths.length*100):0;

  // Hours this month
  const calcMins=tcs=>tcs.filter(t=>t.duration).reduce((s,t)=>{const p=t.duration?.match(/(\d+)h\s*(\d+)m/);if(p)return s+parseInt(p[1])*60+parseInt(p[2]);const q=t.duration?.match(/(\d+)m/);return s+(q?parseInt(q[1]):0);},0);
  const monthMins=calcMins(timecards.filter(t=>t.clockIn>=monthAgo));
  const weekMins=calcMins(timecards.filter(t=>t.clockIn>=weekAgo));
  const fmtH=m=>`${Math.floor(m/60)}h ${m%60}m`;

  // Class capacity
  const totalCap=classes.reduce((s,c)=>s+(c.cap||8),0);
  const totalFilled=classes.reduce((s,c)=>s+(c.athletes||[]).length,0);
  const fillRate=totalCap?Math.round(totalFilled/totalCap*100):0;

  // Coach hours breakdown
  const coachHours=coaches.map(c=>{const tcs=timecards.filter(t=>t.coachId===c.id&&t.clockIn>=monthAgo);const m=calcMins(tcs);return{...c,mins:m,sessions:tcs.length};}).sort((a,b)=>b.mins-a.mins);

  // Level breakdown
  const levels={};aths.forEach(a=>{const l=a.level||'Level 1';levels[l]=(levels[l]||0)+1;});

  return`
  <div class="sec-hdr"><h3>Analytics</h3><span style="font-size:12px;color:var(--t3);">Last 30 days</span></div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
    ${[
      {l:'Collection Rate',v:collectionRate+'%',sub:`${paid.length}/${aths.length} paid`,c:collectionRate>=80?'var(--green)':collectionRate>=60?'var(--gold)':'var(--red)'},
      {l:'Monthly Revenue',v:'$'+fmt(rev),sub:`${overdue.length} overdue`,c:'var(--gold)'},
      {l:'Roster Fill Rate',v:fillRate+'%',sub:`${totalFilled}/${totalCap} spots filled`,c:fillRate>=80?'var(--green)':'var(--gold)'},
      {l:'Coach Hours / Mo',v:fmtH(monthMins),sub:`${fmtH(weekMins)} this week`,c:'#60A5FA'},
    ].map(s=>`<div class="stat"><div class="sl">${s.l}</div><div class="sv" style="font-size:22px;color:${s.c};">${s.v}</div><div class="ssub">${s.sub}</div></div>`).join('')}
  </div>

  <div class="g2">
    <div>
      <div class="card" style="margin-bottom:14px;">
        <div class="card-hdr"><h4>Athletes by Level</h4></div>
        <div style="padding:16px;">${Object.entries(levels).sort((a,b)=>b[1]-a[1]).map(([l,n])=>{const pct=aths.length?Math.round(n/aths.length*100):0;return`<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:5px;"><div style="display:flex;align-items:center;gap:6px;"><div class="belt-d" style="background:${BELT_COLORS[l]||'#E8E8E8'};width:10px;height:10px;"></div><span style="font-size:13px;font-weight:600;">${l}</span></div><span style="font-size:13px;font-weight:700;">${n}</span></div><div style="height:5px;background:var(--bg);border-radius:3px;overflow:hidden;"><div style="height:100%;border-radius:3px;background:${BELT_COLORS[l]||'var(--gold)'};width:${pct}%;"></div></div></div>`;}).join('')}</div>
      </div>
    </div>
    <div>
      <div class="card">
        <div class="card-hdr"><h4>Coach Hours This Month</h4></div>
        <div>${coachHours.length===0?`<div style="padding:24px;text-align:center;color:var(--t3);">No data yet.</div>`
        :coachHours.map((c,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--bdr2);">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;color:var(--t3);width:18px;">${i+1}</div>
          <div class="mini-av">${ini(c.name)}</div>
          <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${c.name}</div><div style="font-size:11px;color:var(--t3);">${c.sessions} session${c.sessions!==1?'s':''}</div></div>
          <span style="font-family:'Montserrat',sans-serif;font-weight:700;color:var(--gold);">${fmtH(c.mins)}</span>
        </div>`).join('')}</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-hdr"><h4>Class Performance</h4></div>
    <table class="table"><thead><tr><th>Class</th><th>Coach</th><th>Day</th><th>Roster Fill</th><th>Level</th></tr></thead><tbody>
      ${classes.sort((a,b)=>pct((b.athletes||[]).length,b.cap||8)-pct((a.athletes||[]).length,a.cap||8)).map(c=>{const f=pct((c.athletes||[]).length,c.cap||8);return`<tr><td style="font-weight:600;">${c.name}</td><td style="font-size:12px;">${c.coachName||'TBD'}</td><td style="font-size:12px;">${c.day}</td><td><div style="display:flex;align-items:center;gap:8px;"><div style="width:80px;height:5px;background:var(--bg);border-radius:3px;overflow:hidden;"><div style="height:100%;border-radius:3px;background:${f>=90?'var(--red)':f>=70?'var(--gold)':'var(--green)'};width:${f}%;"></div></div><span style="font-size:12px;font-weight:700;color:var(--t2);">${(c.athletes||[]).length}/${c.cap||8}</span></div></td><td><div class="belt-b"><div class="belt-d" style="background:${BELT_COLORS[c.level||'Level 1']};"></div>${c.level||'—'}</div></td></tr>`;}).join('')}
    </tbody></table>
  </div>`;
}
