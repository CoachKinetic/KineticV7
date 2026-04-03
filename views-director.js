import { APP, SKILLS, BELT_COLORS, BELT_LEVELS, ini } from './firebase-config.js?v=74';

export function dirHome(){
  const pending=(APP.subRequests||[]).filter(r=>r.status==='pending').length;
  const tcP=(APP.allTimecards||[]).filter(t=>t.status==='pending').length;
  const injP=(APP.allInjuries||[]).filter(i=>i.status==='pending').length;
  const rev=APP.allAthletes.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  return `
  <div class="stats4">
    <div class="stat" onclick="window.K.nav('dirAthletes')"><div class="si">👧</div><div class="sl">Athletes</div><div class="sv">${APP.allAthletes.length}</div></div>
    <div class="stat" onclick="window.K.nav('dirCoaches')"><div class="si">🧑‍🏫</div><div class="sl">Coaches</div><div class="sv">${APP.allCoaches.length}</div></div>
    <div class="stat"><div class="si">💰</div><div class="sl">Monthly Revenue</div><div class="sv gold">$${rev.toLocaleString()}</div></div>
    <div class="stat" onclick="window.K.nav('dirSched')"><div class="si">📅</div><div class="sl">Classes</div><div class="sv">${APP.allClasses.length}</div></div>
  </div>
  <div class="g2">
    <div>
      <div class="sec-hdr"><h3>Today's Classes</h3><button class="slink" onclick="window.K.nav('dirSched')">Full Schedule →</button></div>
      ${APP.allClasses.length===0?`<div class="card"><div style="padding:24px;text-align:center;color:var(--t3);">No classes yet. <button class="slink" onclick="window.K.openModal('addClassModal')">Add one →</button></div></div>`
      :APP.allClasses.slice(0,4).map(c=>`<div class="class-card" style="margin-bottom:8px;" onclick="window.K.openModal('classModal',{classId:'${c.id}'})">
        <div style="display:flex;justify-content:space-between;"><div class="cn">${c.name}</div><span class="pill gold-p">${c.time}</span></div>
        <div class="cm" style="margin-top:6px;"><span>🧑‍🏫 ${c.coachName||'TBD'}</span><span>👧 ${(c.athletes||[]).length}/${c.cap||8}</span><span>📅 ${c.day}</span></div>
      </div>`).join('')}
    </div>
    <div>
      ${(APP.coachConcerns||[]).length>0?`
  <div class="sec-hdr" style="margin-top:0;"><h3 style="color:var(--red);">⚠️ Coach Concerns</h3></div>
  ${(APP.coachConcerns||[]).slice(0,3).map(n=>{
    const cls=APP.allClasses.find(c=>c.id===n.classId);
    const coach=APP.allCoaches.find(c=>c.id===n.coachId)||{name:n.coachId||'Coach'};
    const ds=n.date?new Date(n.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
    return `<div class="alert warn" style="display:block;position:relative;padding-right:80px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
        <strong>${coach.name||'Coach'}</strong><span style="font-size:11px;color:var(--t3);">${ds} · ${cls?.name||'Class'}</span>
      </div>
      <div style="font-size:13px;">${n.issueNotes}</div>
      <button onclick="window.K.dismissConcern('${n.id}')" style="position:absolute;top:10px;right:10px;background:transparent;border:1px solid rgba(181,130,30,0.3);border-radius:4px;font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 8px;color:#8A6010;cursor:pointer;">Dismiss</button>
    </div>`;
  }).join('')}`:''}
  ${(()=>{
    const claimed=(APP.subRequests||[]).filter(r=>r.status==='claimed').length;
    const needsAction=pending+claimed;
    return needsAction>0||tcP>0||injP>0?`<div class="sec-hdr"><h3>Action Required</h3></div>
      ${pending>0?`<div class="alert warn" style="cursor:pointer;" onclick="window.K.nav('dirSubs')">🔄 <strong>${pending}</strong> sub request${pending>1?'s':''} need approval</div>`:''}
      ${claimed>0?`<div class="alert warn" style="cursor:pointer;" onclick="window.K.nav('dirSubs')">✋ <strong>${claimed}</strong> sub volunteer${claimed>1?'s':''} need your OK</div>`:''}
      ${tcP>0?`<div class="alert warn" style="cursor:pointer;" onclick="window.K.nav('dirTimecards')">⏱️ <strong>${tcP}</strong> timecard${tcP>1?'s':''} pending approval</div>`:''}
      ${injP>0?`<div class="alert danger" style="cursor:pointer;" onclick="window.K.nav('dirInjuries')">🚑 <strong>${injP}</strong> injury report${injP>1?'s':''} need review</div>`:''}
      `:'';
  })()}
  ${(APP.subRequests||[]).filter(r=>r.status==='confirmed').length>0?`
  <div class="sec-hdr" style="margin-top:4px;"><h3>✓ Confirmed Subs</h3></div>
  ${(APP.subRequests||[]).filter(r=>r.status==='confirmed').slice(0,3).map(r=>`
  <div class="class-card" style="border-left-color:var(--green);margin-bottom:8px;">
    <div class="cn">${r.className}</div>
    <div class="cm" style="margin-top:4px;"><span>📅 ${r.date}</span><span>Sub: <strong>${r.subCoachName}</strong></span></div>
    <span class="pill present" style="margin-top:6px;display:inline-flex;">Confirmed</span>
  </div>`).join('')}`:''}
      <div class="sec-hdr" style="margin-top:8px;"><h3>Quick Actions</h3></div>
      <div class="g2">
        <div class="tile" onclick="window.K.openModal('inviteModal',{type:'coach'})"><div class="ti">🧑‍🏫</div><div class="tl">Invite Coach</div></div>
        <div class="tile" onclick="window.K.openModal('addAthModal')"><div class="ti">👧</div><div class="tl">Add Athlete</div></div>
        <div class="tile" onclick="window.K.openModal('addClassModal')"><div class="ti">📅</div><div class="tl">Add Class</div></div>
        <div class="tile" onclick="window.K.openModal('inviteModal',{type:'parent'})"><div class="ti">👪</div><div class="tl">Invite Parent</div></div>
      </div>
    </div>
  </div>`;
}

export function dirSched(){
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return `
  <div class="sec-hdr"><h3>Schedule</h3><button class="btn primary" onclick="window.K.openModal('addClassModal')">+ Add Class</button></div>
  <div class="stats3">
    <div class="stat"><div class="sl">Total Classes</div><div class="sv">${APP.allClasses.length}</div></div>
    <div class="stat" onclick="window.K.nav('dirSubs')"><div class="sl">Sub Requests</div><div class="sv gold">${(APP.subRequests||[]).filter(r=>r.status==='pending').length}</div></div>
    <div class="stat"><div class="sl">Open on Board</div><div class="sv">${(APP.subRequests||[]).filter(r=>r.status==='open').length}</div></div>
  </div>
  ${days.map(day=>{
    const dc=APP.allClasses.filter(c=>c.day===day);
    return `<div style="margin-bottom:16px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--gold);opacity:0.7;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--bdr);">${day}</div>
      ${dc.length===0?`<div style="font-size:13px;color:var(--t3);">No classes — <button class="slink" onclick="window.K.openModal('addClassModal',{day:'${day}'})">+ Add one</button></div>`
      :`<div class="g3">${dc.map(c=>`<div class="class-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div onclick="window.K.openModal('classModal',{classId:'${c.id}'})" style="flex:1;cursor:pointer;">
            <div class="cn">${c.name}</div>
            <div class="cm" style="margin-top:6px;"><span>🧑‍🏫 ${c.coachName||'TBD'}</span><span>👧 ${(c.athletes||[]).length}/${c.cap||8}</span></div>
          </div>
          <button class="btn" style="font-size:10px;padding:4px 8px;margin-left:8px;flex-shrink:0;" onclick="window.K.openModal('editClassModal',{classId:'${c.id}'})">Edit</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;"><div class="prog-bar"><div class="prog-fill" style="width:${Math.min(100,Math.round((c.athletes||[]).length/(c.cap||8)*100))}%"></div></div><span style="font-size:11px;color:var(--t3);">${Math.min(100,Math.round((c.athletes||[]).length/(c.cap||8)*100))}%</span></div>
      </div>`).join('')}</div>`}
    </div>`;
  }).join('')}`;
}

export function dirAthletes(tab='active'){
  const active=APP.allAthletes||[];
  const archived=APP.archivedAthletes||[];
  const showArch=tab==='archived';
  return `
  <div class="sec-hdr">
    <div style="display:flex;">
      <button onclick="window.K.nav('dirAthletes')" style="padding:8px 18px;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:1px solid var(--bdr);border-right:none;border-radius:4px 0 0 4px;background:${!showArch?'var(--gold)':'var(--panel)'};color:${!showArch?'#1C1C1C':'var(--t2)'};">Active (${active.length})</button>
      <button onclick="window.K.nav('dirAthletes_arch')" style="padding:8px 18px;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:1px solid var(--bdr);border-radius:0 4px 4px 0;background:${showArch?'var(--gold)':'var(--panel)'};color:${showArch?'#1C1C1C':'var(--t2)'};">Archived (${archived.length})</button>
    </div>
    ${!showArch?`<button class="btn primary" onclick="window.K.openModal('addAthModal')">+ Add Athlete</button>`:''}
  </div>
  ${showArch
    ? archived.length===0
      ? `<div class="card"><div style="padding:40px;text-align:center;color:var(--t3);"><div style="font-size:44px;margin-bottom:12px;">📦</div><h3 style="font-weight:800;font-size:18px;margin-bottom:8px;">No archived athletes</h3><p>Archived athletes appear here. Their data is fully preserved.</p></div></div>`
      : `<div class="card"><div class="card-body"><table class="table">
          <thead><tr><th>Athlete</th><th>Level</th><th>Parent</th><th>Archived</th><th>Action</th></tr></thead>
          <tbody>${archived.map(a=>`<tr>
            <td><div class="name-cell"><div class="mini-av">${ini(a.name)}</div>${a.name}</div></td>
            <td><div class="belt-b"><div class="belt-d" style="background:${BELT_COLORS[a.level]||'#E8C84A'};"></div>${a.level||'Level 1'}</div></td>
            <td style="font-size:12px;color:var(--t3);">${a.parentEmail||'—'}</td>
            <td style="font-size:12px;color:var(--t3);">${a.archivedAt?new Date(a.archivedAt).toLocaleDateString():'—'}</td>
            <td><button class="btn primary" style="font-size:10px;padding:4px 10px;" onclick="window.K.unarchiveAthlete('${a.id}')">Restore</button></td>
          </tr>`).join('')}</tbody>
        </table></div></div>`
    : active.length===0
      ? `<div class="card"><div style="padding:40px;text-align:center;"><div style="font-size:44px;margin-bottom:12px;">👧</div><h3 style="font-weight:800;font-size:18px;margin-bottom:8px;">No athletes yet</h3><p style="font-size:14px;color:var(--t2);margin-bottom:16px;">Add athletes to start tracking skills and tuition.</p><button class="btn primary" onclick="window.K.openModal('addAthModal')">+ Add First Athlete</button></div></div>`
      : `<div class="card"><div class="card-body"><table class="table">
          <thead><tr><th>Athlete</th><th>Level</th><th>Classes</th><th>Parent</th><th>Tuition</th><th>Actions</th></tr></thead>
          <tbody>${active.map(a=>{
            const cls=APP.allClasses.filter(c=>(c.athletes||[]).includes(a.id));
            return `<tr>
              <td><div class="name-cell"><div class="mini-av">${ini(a.name)}</div>${a.name}</div></td>
              <td><div class="belt-b"><div class="belt-d" style="background:${BELT_COLORS[a.level]||'#E8C84A'};"></div>${a.level||'Level 1'}</div></td>
              <td style="font-size:12px;color:var(--t2);">${cls.length?cls.map(c=>c.name).join(', '):'None'}</td>
              <td style="font-size:12px;color:var(--t3);">${a.parentEmail||'—'}</td>
              <td><span class="pill ${a.tuitionStatus==='paid'?'present':a.tuitionStatus==='overdue'?'absent':'gold-p'}">$${a.tuitionAmount||185}/mo</span></td>
              <td style="white-space:nowrap;">
                <button class="btn" style="font-size:10px;padding:4px 8px;margin-right:4px;" onclick="window.K.openModal('editAthModal',{id:'${a.id}'})">Edit</button>
                <button class="btn" style="font-size:10px;padding:4px 8px;margin-right:4px;" onclick="window.K.openModal('viewAthModal',{id:'${a.id}'})">View</button>
                <button class="btn" style="font-size:10px;padding:4px 8px;color:var(--red);border-color:rgba(155,58,47,0.3);" onclick="window.K.archiveAthlete('${a.id}','${a.name}')">Archive</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div></div>`}`;
}

export function dirCoaches(){
  return `
  <div class="sec-hdr"><h3>Coaching Staff — ${APP.allCoaches.length} coaches</h3>
    <button class="btn primary" onclick="window.K.openModal('inviteModal',{type:'coach'})">+ Invite Coach</button>
  </div>
  ${APP.allCoaches.length===0
    ?`<div class="card"><div style="padding:40px;text-align:center;"><div style="font-size:44px;margin-bottom:12px;">🧑‍🏫</div><h3 style="font-weight:800;font-size:18px;margin-bottom:8px;">No coaches yet</h3><button class="btn primary" onclick="window.K.openModal('inviteModal',{type:'coach'})">+ Invite First Coach</button></div></div>`
    :`<div class="card"><div class="card-body"><table class="table">
      <thead><tr><th>Coach</th><th>Belt</th><th>Certifications</th><th>Classes</th><th>Status</th><th></th></tr></thead>
      <tbody>${APP.allCoaches.map(c=>{
        const cc=APP.allClasses.filter(cl=>(cl.coaches||[]).includes(c.id)||cl.coachId===c.id);
        return `<tr>
          <td><div class="name-cell"><div class="mini-av">${ini(c.name)}</div><div><div>${c.name}</div><div style="font-size:11px;color:var(--t3);">${c.email||''}</div></div></div></td>
          <td><div class="belt-b"><div class="belt-d" style="background:${BELT_COLORS[c.belt||'Foundation']};"></div>${c.belt||'Foundation'}</div></td>
          <td style="font-size:12px;color:var(--t2);">${(c.certifications||[]).length?(c.certifications||[]).join(', '):'Foundation only'}</td>
          <td>${cc.length}</td>
          <td><span class="pill present">Active</span></td>
          <td><button class="btn" style="font-size:10px;padding:4px 10px;" onclick="window.K.openModal('editCoachModal',{id:'${c.id}'})">Edit</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div></div>`}`;
}

export function dirTimecards(){
  const all=APP.allTimecards||[];
  const view=window.APP?.tcView||'cards';
  const now=new Date();
  const weekAgo=new Date(now-7*86400000).toISOString();
  const monthAgo=new Date(now-30*86400000).toISOString();
  // Calculate hours
  const calcHours=(tcs)=>{const m=tcs.filter(t=>t.duration).reduce((s,t)=>{const pts=t.duration?.match(/(\d+)h\s*(\d+)m/);if(pts)return s+parseInt(pts[1])*60+parseInt(pts[2]);const pm=t.duration?.match(/(\d+)m/);return s+(pm?parseInt(pm[1]):0);},0);return `${Math.floor(m/60)}h ${m%60}m`;};
  const approved=all.filter(t=>t.status==='approved');
  return `
  <div class="sec-hdr"><h3>Timecards & Hours</h3>
    <div style="display:flex;gap:8px;">
      <button class="btn" onclick="window.K.exportTimecards()">⬇ Export CSV</button>
    </div>
  </div>
  <div class="stats4">
    <div class="stat"><div class="sl">Pending</div><div class="sv gold">${all.filter(t=>t.status==='pending').length}</div></div>
    <div class="stat"><div class="sl">Today's Hours</div><div class="sv">${calcHours(all.filter(t=>t.clockIn>=now.toISOString().split('T')[0]))}</div></div>
    <div class="stat"><div class="sl">This Week</div><div class="sv gold">${calcHours(all.filter(t=>t.clockIn>=weekAgo))}</div></div>
    <div class="stat"><div class="sl">This Month</div><div class="sv">${calcHours(all.filter(t=>t.clockIn>=monthAgo))}</div></div>
  </div>
  <div class="sec-hdr"><h3>By Coach — This Month</h3></div>
  <div class="card" style="margin-bottom:14px;"><div class="card-body">
    ${[...new Set(all.map(t=>t.coachId))].map(cid=>{
      const coach=APP.allCoaches.find(c=>c.id===cid)||{name:all.find(t=>t.coachId===cid)?.coachName||'Unknown'};
      const myTcs=all.filter(t=>t.coachId===cid&&t.clockIn>=monthAgo);
      const hrs=calcHours(myTcs);
      return `<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--bdr2);">
        <div class="mini-av">${ini(coach.name)}</div>
        <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${coach.name}</div><div style="font-size:11px;color:var(--t3);">${myTcs.length} sessions</div></div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:700;color:var(--gold);">${hrs}</div>
      </div>`;
    }).join('')}
  </div></div>
  <div class="sec-hdr"><h3>All Timecards</h3></div>
  <div class="card"><div class="card-body">
    ${all.length===0?`<div style="padding:32px;text-align:center;color:var(--t3);">No timecards yet. Coaches appear here when they clock in.</div>`
    :`<table class="table">
      <thead><tr><th>Coach</th><th>Date</th><th>In</th><th>Out</th><th>Duration</th><th>Class</th><th>Note</th><th></th></tr></thead>
      <tbody>${all.map(t=>{
        const ci=t.clockIn?new Date(t.clockIn).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'--';
        const co=t.clockOut?new Date(t.clockOut).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'Active';
        const ds=t.clockIn?new Date(t.clockIn).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'--';
        return `<tr id="tc_${t.id}">
          <td><div class="name-cell"><div class="mini-av">${ini(t.coachName||'?')}</div>${t.coachName||'Coach'}</div></td>
          <td style="font-size:12px;">${ds}</td>
          <td style="font-size:12px;">${ci}</td>
          <td style="font-size:12px;">${co}</td>
          <td style="font-family:'Montserrat',sans-serif;font-weight:700;color:var(--gold);">${t.duration||'Active'}</td>
          <td style="font-size:12px;color:var(--t2);">${t.className||'—'}</td>
          <td style="font-size:11px;color:var(--t3);font-style:italic;max-width:120px;">${t.directorNote||'—'}</td>
          <td id="tca_${t.id}" style="white-space:nowrap;">
            ${t.status==='pending'?`<button class="btn primary" style="font-size:10px;padding:4px 8px;margin-right:4px;" onclick="window.K.approveTC('${t.id}')">✓ Approve</button>`
            :`<span class="pill ${t.status==='approved'?'present':t.status==='active'?'ip':'not-r'}" style="margin-right:4px;">${t.status==='approved'?'Approved':t.status==='active'?'Active':'Pending'}</span>`}
            <button class="btn" style="font-size:10px;padding:4px 8px;" onclick="window.K.openModal('editTCModal',{id:'${t.id}'})">Edit</button>
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table>`}
  </div></div>`;
}

export function dirMsgs(){
  const tab=window.APP?.msgTab||'unread';
  const folder=window.APP?.msgFolder||'mine'; // 'mine' or 'staff'
  const all=APP.messages||[];
  const me=APP.user?.uid;

  // Staff messages = coach↔parent conversations (not involving director)
  const isStaffMsg=m=>m.fromRole==='coach'&&m.toRole==='parents'||
                       m.fromRole==='parent'&&m.toRole==='coaches'||
                       (m.fromRole==='coach'&&m.toId&&APP.allAthletes?.find(a=>a.parentEmail&&m.toId!==me));

  // My messages = anything sent TO me or BY me
  const isMyMsg=m=>m.toId===me||m.fromId===me||m.toRole==='director';

  const myMsgs=all.filter(m=>!m.fromId==='system'&&isMyMsg(m)&&!isStaffMsg(m));
  const staffMsgs=all.filter(m=>isStaffMsg(m));
  const activeMsgs=folder==='staff'?staffMsgs:myMsgs;

  const unread=activeMsgs.filter(m=>!m.read&&m.fromId!==me&&m.fromId!=='system');
  const read=activeMsgs.filter(m=>(m.read||m.fromId===me)&&m.fromId!=='system');
  const sent=activeMsgs.filter(m=>m.fromId===me);
  const counts={unread:unread.length,read:read.length,sent:sent.length,staff:staffMsgs.filter(m=>!m.read).length};
  const displayMsgs=tab==='sent'?sent:tab==='read'?read:unread;

  // Find indices in master array
  const withIdx=displayMsgs.map(m=>({msg:m,idx:all.indexOf(m)}));

  return `
  <div class="sec-hdr"><h3>Messages</h3><button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'director'})">+ New Message</button></div>

  <div style="display:flex;gap:0;margin-bottom:16px;border:1px solid var(--bdr);border-radius:6px;overflow:hidden;">
    ${[['unread','Inbox',counts.unread],['read','Read',counts.read],['sent','Sent',counts.sent]].map(([t,label,cnt])=>`
    <button onclick="window.APP.msgTab='${t}';window.K.nav('dirMsgs')"
      style="flex:1;padding:10px 8px;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:none;border-right:1px solid var(--bdr);transition:all 0.15s;
      background:${tab===t?'var(--gold)':'var(--panel)'};color:${tab===t?'var(--sb)':'var(--t2)'};">
      ${label}${cnt>0&&t==='unread'?` <span style="background:var(--red);color:#fff;border-radius:10px;padding:1px 6px;font-size:9px;">${cnt}</span>`:''}
    </button>`).join('')}
  </div>

  <div style="display:flex;gap:6px;margin-bottom:12px;">
    ${[['all','All'],['coaches','Coaches 🧑‍🏫'],['parents','Parents 👪']].map(([f,label])=>`
    <button onclick="window.APP.msgFilter='${f}';window.K.nav('dirMsgs')"
      class="btn ${filter===f?'primary':''}" style="font-size:10px;padding:5px 12px;">${label}</button>`).join('')}
  </div>

  ${withIdx.length===0?`<div class="card"><div style="padding:32px;text-align:center;color:var(--t3);">
    <div style="font-size:32px;margin-bottom:10px;">${tab==='unread'?'📬':tab==='sent'?'📤':'📭'}</div>
    <div>${tab==='unread'?'No new messages':'No messages here yet'}</div>
  </div></div>`:`<div class="card"><div class="card-body">
    ${withIdx.map(({msg:m,idx:i})=>{
      const isMine=m.fromId===me;
      const isUnread=!m.read&&!isMine;
      const preview=isMine?`You: ${m.preview||m.body||''}`:m.preview||m.body||'';
      const stripRe=s=>(s||'').replace(/^(Re:\s*)+/i,'').trim().toLowerCase();
      const tid=m.threadId||(m.subRequestId?'sub_'+m.subRequestId:null)||stripRe(m.subject)||String(i);
      const threadCount=(all.filter(x=>{const xt=x.threadId||(x.subRequestId?'sub_'+x.subRequestId:null)||stripRe(x.subject)||'_';return xt===tid;})).length;
      return `<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid var(--bdr2);cursor:pointer;${isUnread?'background:rgba(181,153,106,0.04);':''}" onclick="window.K.openModal('msgViewModal',{idx:${i},role:'director',tid:'${tid.replace(/['"]/g,'')}'})" >
        <div class="mini-av" style="${isUnread?'background:linear-gradient(135deg,var(--gold),#7A5A2A);color:var(--sb);':''}">${ini(m.from||'?')}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:13px;font-weight:${isUnread?700:500};">${isMine?`To: ${m.toRole||'recipient'}`:m.from||'Unknown'} <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;text-transform:uppercase;color:var(--gold);opacity:0.7;">${m.fromRole||''}</span></div>
            <div style="display:flex;align-items:center;gap:6px;">${threadCount>1?`<span style="font-size:9px;color:var(--t3);border:1px solid var(--bdr);border-radius:10px;padding:1px 6px;">${threadCount}</span>`:''}<span style="font-size:11px;color:var(--t3);">${m.time||''}</span></div>
          </div>
          <div style="font-size:13px;font-weight:${isUnread?600:400};margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.subject||''}</div>
          <div style="font-size:12px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;">${preview}</div>
        </div>
        ${isUnread?`<div style="width:7px;height:7px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:5px;"></div>`:''}
      </div>`;
    }).join('')}
  </div></div>`}`;
}

export function dirBilling(){
  const total=APP.allAthletes.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  return `
  <div class="sec-hdr"><h3>Tuition & Billing</h3><button class="btn primary" onclick="window.K.openModal('addChargeModal')">+ Add Charge</button></div>
  <div class="alert info">💳 Stripe integration coming soon. All data is ready.</div>
  <div class="stats3">
    <div class="stat"><div class="si">💰</div><div class="sl">Monthly Revenue</div><div class="sv gold">$${total.toLocaleString()}</div></div>
    <div class="stat"><div class="si">⚠️</div><div class="sl">Overdue</div><div class="sv" style="color:var(--red);">${APP.allAthletes.filter(a=>a.tuitionStatus==='overdue').length}</div></div>
    <div class="stat"><div class="si">📋</div><div class="sl">Pending</div><div class="sv">${APP.allAthletes.filter(a=>a.tuitionStatus==='pending').length}</div></div>
  </div>
  <div class="card"><div class="card-body">
    ${APP.allAthletes.length===0?`<div style="padding:24px;text-align:center;color:var(--t3);">No athletes yet.</div>`
    :`<table class="table">
      <thead><tr><th>Athlete</th><th>Level</th><th>Monthly</th><th>Cycle</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>${APP.allAthletes.map(a=>`<tr id="bil_${a.id}">
        <td><div class="name-cell"><div class="mini-av">${ini(a.name)}</div>${a.name}</div></td>
        <td><div class="belt-b"><div class="belt-d" style="background:${BELT_COLORS[a.level]||'#E8C84A'};"></div>${a.level||'Level 1'}</div></td>
        <td style="font-weight:600;">$${a.tuitionAmount||185}.00</td>
        <td style="color:var(--t2);">${a.billingCycle||'Monthly'}</td>
        <td><span class="pill ${a.tuitionStatus==='paid'?'present':a.tuitionStatus==='overdue'?'absent':'gold-p'}">${a.tuitionStatus||'Pending'}</span></td>
        <td style="white-space:nowrap;">
          <button class="btn" style="font-size:10px;padding:4px 8px;margin-right:4px;" onclick="window.K.openModal('editTuitionModal',{id:'${a.id}'})">Edit</button>
          <button class="btn" style="font-size:10px;padding:4px 8px;color:var(--blue);border-color:rgba(30,74,124,0.3);" onclick="window.K.sendTuitionReminder('${a.id}')">📨 Remind</button>
        </td>
      </tr>`).join('')}</tbody>
    </table>`}
  </div></div>`;
}

export function dirSubs(){
  const pending=(APP.subRequests||[]).filter(r=>r.status==='pending');
  const claimed=(APP.subRequests||[]).filter(r=>r.status==='claimed');
  const awaiting=(APP.subRequests||[]).filter(r=>r.status==='awaiting_original');
  const open=(APP.subRequests||[]).filter(r=>r.status==='open');
  const confirmed=(APP.subRequests||[]).filter(r=>r.status==='confirmed');
  const needsAction=pending.length+claimed.length;
  return `
  <div class="sec-hdr"><h3>Sub Requests</h3></div>
  <div class="stats4">
    <div class="stat"><div class="sl">Needs Action</div><div class="sv ${needsAction>0?'gold':''}">${needsAction}</div></div>
    <div class="stat"><div class="sl">Open on Board</div><div class="sv">${open.length}</div></div>
    <div class="stat"><div class="sl">Awaiting Coach OK</div><div class="sv">${awaiting.length}</div></div>
    <div class="stat"><div class="sl">Confirmed</div><div class="sv">${confirmed.length}</div></div>
  </div>

  ${pending.length?`
  <div class="sec-hdr"><h3>Step 1 — Approve to Post</h3></div>
  ${pending.map(r=>`<div class="class-card" style="margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div><div class="cn">${r.className}</div>
      <div class="cm" style="margin-top:4px;"><span>📅 ${r.date}</span><span>🧑‍🏫 ${r.requestedByName||'Coach'}</span></div></div>
      <span class="pill ip">Pending</span>
    </div>
    ${r.reason?`<div style="font-size:12px;color:var(--t3);margin-top:6px;font-style:italic;border-left:2px solid var(--bdr);padding-left:8px;">"${r.reason}"</div>`:''}
    <div style="display:flex;gap:8px;margin-top:10px;">
      <button class="btn primary" style="flex:1;font-size:11px;" onclick="window.K.approveSubReq('${r.id}')">✓ Approve & Post to Board</button>
      <button class="btn danger" style="font-size:11px;padding:7px 14px;" onclick="window.K.denySubReq('${r.id}')">Deny</button>
    </div>
  </div>`).join('')}`:''}

  ${claimed.length?`
  <div class="sec-hdr"><h3>Step 3 — Sub Volunteered — Approve?</h3></div>
  ${claimed.map(r=>`<div class="class-card" style="margin-bottom:10px;border-left-color:var(--gold);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div><div class="cn">${r.className}</div>
      <div class="cm" style="margin-top:4px;"><span>📅 ${r.date}</span></div></div>
      <span class="pill gold-p">Sub Volunteered</span>
    </div>
    <div style="background:rgba(181,153,106,0.08);border-radius:6px;padding:10px 12px;margin-top:8px;">
      <div style="font-size:11px;color:var(--t3);margin-bottom:4px;">SUB COACH</div>
      <div style="font-size:14px;font-weight:700;">${r.subCoachName}</div>
    </div>
    <div style="font-size:12px;color:var(--t3);margin-top:8px;">Approve this sub → original coach will be asked to confirm.</div>
    <div style="display:flex;gap:8px;margin-top:10px;">
      <button class="btn primary" style="flex:1;font-size:11px;" onclick="window.K.approveSubClaim('${r.id}')">✓ Approve & Ask Original Coach</button>
      <button class="btn danger" style="font-size:11px;padding:7px 14px;" onclick="window.K.denySubReq('${r.id}')">Deny</button>
    </div>
  </div>`).join('')}`:''}

  ${awaiting.length?`
  <div class="sec-hdr"><h3>Waiting on Original Coach</h3></div>
  ${awaiting.map(r=>`<div class="class-card" style="margin-bottom:10px;border-left-color:var(--blue,#1E4A7C);">
    <div class="cn">${r.className}</div>
    <div class="cm" style="margin-top:6px;"><span>📅 ${r.date}</span><span>Sub: ${r.subCoachName}</span></div>
    <span class="pill ip" style="margin-top:8px;display:inline-flex;">Waiting for ${r.requestedByName||'Coach'} to confirm</span>
  </div>`).join('')}`:''}

  <div class="sec-hdr" style="margin-top:4px;"><h3>Open Sub Board</h3></div>
  ${open.length===0?`<div class="card"><div style="padding:20px;text-align:center;color:var(--t3);">No open sub requests right now.</div></div>`
  :open.map(r=>`<div class="class-card" style="margin-bottom:10px;">
    <div class="cn">${r.className}</div><div class="ct">${r.date}</div>
    <div class="cm" style="margin-top:6px;"><span>Original: ${r.requestedByName||'Coach'}</span><span>🎓 ${r.requiredBelt||'Level 1'}+</span></div>
    <span class="pill not-r" style="margin-top:8px;display:inline-flex;">Waiting for a coach to volunteer...</span>
  </div>`).join('')}

  ${confirmed.length?`
  <div class="sec-hdr" style="margin-top:16px;"><h3>✓ Confirmed</h3></div>
  ${confirmed.map(r=>`<div class="class-card" style="margin-bottom:10px;border-left-color:var(--green);">
    <div class="cn">${r.className}</div><div class="ct">${r.date}</div>
    <div class="cm" style="margin-top:6px;"><span>Sub: <strong>${r.subCoachName||'TBD'}</strong></span></div>
    <span class="pill present" style="margin-top:8px;display:inline-flex;">Confirmed</span>
  </div>`).join('')}`:''}`;
}

export function dirInjuries(){
  const all=APP.allInjuries||[];
  const active=all.filter(i=>i.status!=='resolved');
  const resolved=all.filter(i=>i.status==='resolved');
  const showResolved=window.APP?.showResolvedInjuries||false;
  const renderRow=i=>{
    const ds=i.date?new Date(i.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'--';
    return `<tr><td style="font-size:12px;">${ds}</td>
      <td><div class="name-cell"><div class="mini-av">${ini(i.coachName||'?')}</div>${i.coachName||'Coach'}</div></td>
      <td style="font-size:12px;">${i.className||'—'}</td>
      <td style="font-size:12px;color:var(--t2);">${i.details||'Auto-logged'}</td>
      <td><span class="pill ${i.status==='resolved'?'present':i.status==='reviewed'?'ip':'absent'}">${i.status||'Pending'}</span></td>
      <td>${i.status!=='resolved'?`<button class="btn primary" style="font-size:10px;padding:4px 10px;" onclick="window.K.resolveInjury('${i.id}')">Resolve</button>`:'—'}</td>
    </tr>`;
  };
  return `
  <div class="sec-hdr"><h3>Injury Log</h3></div>
  <div class="stats2">
    <div class="stat ${showResolved?'':''}" style="cursor:pointer;" onclick="window.APP.showResolvedInjuries=false;window.K.nav('dirInjuries')"><div class="sl" style="color:${!showResolved?'var(--gold)':'var(--t3)'};">Active Reports ${!showResolved?'◀':''}</div><div class="sv ${active.length?'gold':''}">${active.length}</div></div>
    <div class="stat" onclick="window.APP.showResolvedInjuries=true;window.K.nav('dirInjuries')" style="cursor:pointer;"><div class="sl" style="color:${showResolved?'var(--gold)':'var(--t3)'};">Resolved Archive ${showResolved?'◀':''}</div><div class="sv">${resolved.length}</div></div>
  </div>
  ${active.length===0?`<div class="card"><div style="padding:32px;text-align:center;color:var(--t3);"><div style="font-size:40px;margin-bottom:12px;">✅</div><p>No active injury reports.</p></div></div>`
  :`<div class="card"><div class="card-body"><table class="table">
    <thead><tr><th>Date</th><th>Coach</th><th>Class</th><th>Details</th><th>Status</th><th></th></tr></thead>
    <tbody>${active.map(renderRow).join('')}</tbody>
  </table></div></div>`}
  ${showResolved&&resolved.length?`
  <div class="sec-hdr" style="margin-top:16px;">
    <h3 style="color:var(--t3);">✓ Resolved Archive (${resolved.length})</h3>
    <button class="slink" onclick="window.APP.showResolvedInjuries=false;window.K.nav('dirInjuries')">Hide</button>
  </div>
  <div class="card"><div class="card-body"><table class="table">
    <thead><tr><th>Date</th><th>Coach</th><th>Class</th><th>Details</th><th>Status</th><th></th></tr></thead>
    <tbody>${resolved.map(renderRow).join('')}</tbody>
  </table></div></div>`:''}`;
}

function msgInbox(allMsgs, role){
  // Group into threads. threadId > shared subject root > individual message
  const stripRe=s=>(s||'').replace(/^(Re:\s*)+/i,'').trim().toLowerCase();
  const threads={};
  allMsgs.forEach((m,i)=>{
    // Use explicit threadId, or normalize subject as thread key
    const tid=m.threadId||(m.subRequestId?'sub_'+m.subRequestId:null)||stripRe(m.subject)||m.id||String(i);
    if(!threads[tid]){threads[tid]={msgs:[],tid,latestIdx:i,latestCreated:m.createdAt||''};}
    threads[tid].msgs.push({msg:m,idx:i});
    if(new Date(m.createdAt||0)>new Date(threads[tid].latestCreated||0)){
      threads[tid].latestIdx=i;threads[tid].latestCreated=m.createdAt||'';
    }
  });
  // Each thread shows its latest message, count of replies
  const threadList=Object.values(threads).map(t=>{
    const latest=t.msgs.find(x=>x.idx===t.latestIdx)||t.msgs[t.msgs.length-1];
    return {msg:latest.msg,idx:latest.idx,tid:t.tid,count:t.msgs.length,
      hasUnread:t.msgs.some(x=>!x.msg.read&&x.msg.fromId!==APP.user?.uid)};
  }).sort((a,b)=>new Date(b.msg.createdAt||0)-new Date(a.msg.createdAt||0));
  const unread=threadList.filter(t=>t.hasUnread);
  const read=threadList.filter(t=>!t.hasUnread);
  const renderRow=(t)=>{
    const m=t.msg,i=t.idx;
    const isMine=m.fromId===APP.user?.uid;
    const isUnread=t.hasUnread;
    const preview=isMine?`You: ${m.preview||m.body||''}`:m.preview||m.body||'';
    const replyBadge=t.count>1?`<span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;background:var(--bg);border:1px solid var(--bdr);border-radius:10px;padding:2px 7px;color:var(--t3);white-space:nowrap;">${t.count} msgs</span>`:'';
    return `<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid var(--bdr2);cursor:pointer;${isUnread?'background:rgba(181,153,106,0.04);':''}" onclick="window.K.openModal('msgViewModal',{idx:${i},role:'${role}',tid:'${t.tid.replace(/'/g,'')}'})">
      <div class="mini-av" style="${isUnread?'background:linear-gradient(135deg,var(--gold),#7A5A2A);color:var(--sb);':''}">${ini(m.from||'?')}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:13px;font-weight:${isUnread?700:500};">${isMine?`To: ${m.toRole||'them'}`:m.from||'Unknown'} <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;text-transform:uppercase;color:var(--gold);opacity:0.7;">${m.fromRole||''}</span></div>
          <div style="display:flex;align-items:center;gap:6px;">${replyBadge}<span style="font-size:11px;color:var(--t3);">${m.time||''}</span></div>
        </div>
        <div style="font-size:13px;font-weight:${isUnread?600:400};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.subject||''}</div>
        <div style="font-size:12px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${preview}</div>
      </div>
      ${isUnread?`<div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:5px;"></div>`:''}
    </div>`;
  }
  return `
  <div class="sec-hdr"><h3>Messages</h3>
    <button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'${role}'})">+ New Message</button>
  </div>
  ${unread.length>0?`
  <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold);margin-bottom:8px;">New — ${unread.length}</div>
  <div class="card" style="margin-bottom:16px;border-color:rgba(181,153,106,0.3);">
    <div class="card-body">${unread.map(renderRow).join('')}</div>
  </div>`:''}
  ${read.length>0?`
  <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:8px;">Read</div>
  <div class="card"><div class="card-body">${read.map(renderRow).join('')}</div></div>`:''}
  ${allMsgs.length===0?`<div class="card"><div style="padding:24px;text-align:center;color:var(--t3);">No messages yet.</div></div>`:''}`;
}
export { msgInbox };

export function dirAttendance(){
  const today=new Date().toISOString().split('T')[0];
  const viewDate=window.APP?.attViewDate||today;
  const viewDateObj=new Date(viewDate+'T12:00');
  const dayName=viewDateObj.toLocaleDateString('en-US',{weekday:'long'});
  const isToday=viewDate===today;
  const dayClasses=APP.allClasses.filter(c=>c.day===dayName);
  // Use loaded attendance data (APP.attRecords loaded in loadAll or on demand)
  const records=APP.attRecords||{};

  return `
  <div class="sec-hdr"><h3>Attendance Records</h3>
    <div style="display:flex;gap:8px;align-items:center;">
      <button class="btn" onclick="window.APP.attViewDate=new Date(new Date('${viewDate}T12:00')-86400000).toISOString().split('T')[0];window.K.loadAttendanceRecords();window.K.nav('dirAttendance')">‹ Prev</button>
      <input type="date" class="fi" style="width:auto;font-size:12px;padding:5px 10px;" value="${viewDate}" onchange="window.APP.attViewDate=this.value;window.K.loadAttendanceRecords();window.K.nav('dirAttendance')">
      <button class="btn ${isToday?'primary':''}" onclick="window.APP.attViewDate=null;window.K.loadAttendanceRecords();window.K.nav('dirAttendance')">Today</button>
      <button class="btn" onclick="window.APP.attViewDate=new Date(new Date('${viewDate}T12:00')+86400000).toISOString().split('T')[0];window.K.loadAttendanceRecords();window.K.nav('dirAttendance')" ${isToday?'disabled':''}>Next ›</button>
    </div>
  </div>
  <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--t2);margin-bottom:14px;">
    ${viewDateObj.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
  </div>
  ${dayClasses.length===0?`<div class="card"><div style="padding:28px;text-align:center;color:var(--t3);">No classes scheduled on ${dayName}s.</div></div>`
  :`<div class="g2">${dayClasses.map(cls=>{
    const recKey=viewDate+'_'+cls.id;
    const rec=records[recKey];
    const aths=APP.allAthletes.filter(a=>(cls.athletes||[]).includes(a.id));
    const presentIds=rec?.presentIds||[];
    const absentIds=rec?.absentIds||[];
    const hasData=rec&&(presentIds.length||absentIds.length);
    const pCount=hasData?presentIds.length:0;
    const aCount=hasData?absentIds.length:0;
    return `<div class="card">
      <div class="card-hdr" style="background:${hasData?'var(--p2)':'rgba(0,0,0,0.03)'}">
        <div><h4>${cls.name}</h4><div style="font-size:11px;color:var(--t3);">${cls.time} · ${cls.coachName||'TBD'}</div></div>
        ${hasData?`<div style="display:flex;gap:5px;"><span class="pill present">${pCount} Present</span><span class="pill absent">${aCount} Absent</span></div>`
        :`<span class="pill not-r" style="font-size:9px;">No Record</span>`}
      </div>
      ${aths.length===0?`<div style="padding:14px;font-size:13px;color:var(--t3);">No athletes in class.</div>`
      :`<div class="card-body">${aths.map(a=>{
        const isPresent=!hasData||presentIds.includes(a.id);
        const isAbsent=hasData&&absentIds.includes(a.id);
        return `<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--bdr2);">
          <div class="mini-av">${ini(a.name)}</div>
          <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${a.name}</div><div style="font-size:11px;color:var(--t3);">${a.level||'Level 1'}</div></div>
          ${hasData
            ?`<div style="display:flex;gap:5px;">
                <button style="width:32px;height:28px;border-radius:5px;border:1.5px solid ${isPresent?'var(--green)':'var(--bdr)'};background:${isPresent?'var(--g-soft)':'transparent'};cursor:pointer;font-size:14px;" title="Present" onclick="window.K.editAttRecord('${viewDate}','${cls.id}','${a.id}','present')">✅</button>
                <button style="width:32px;height:28px;border-radius:5px;border:1.5px solid ${isAbsent?'var(--red)':'var(--bdr)'};background:${isAbsent?'var(--r-soft)':'transparent'};cursor:pointer;font-size:14px;" title="Absent" onclick="window.K.editAttRecord('${viewDate}','${cls.id}','${a.id}','absent')">❌</button>
              </div>`
            :`<span class="pill not-r" style="font-size:9px;">Not Taken</span>`}
        </div>`;
      }).join('')}</div>`}
    </div>`;
  }).join('')}</div>`}
  ${(()=>{
    const absent=[];
    dayClasses.forEach(cls=>{
      const rec=records[viewDate+'_'+cls.id];
      if(rec?.absentIds?.length){rec.absentIds.forEach(id=>{const a=APP.allAthletes.find(x=>x.id===id);if(a)absent.push({ath:a,cls});});}
    });
    if(!absent.length)return'';
    return `<div class="sec-hdr" style="margin-top:8px;"><h3 style="color:var(--red);">⚠️ Absent — Eligible for Makeup (${absent.length})</h3></div>
    <div class="card"><div class="card-body">${absent.map(({ath,cls})=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--bdr2);">
      <div class="mini-av">${ini(ath.name)}</div>
      <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${ath.name}</div><div style="font-size:11px;color:var(--t3);">Absent from ${cls.name}</div></div>
      <span class="pill ${ath.level}">${ath.level||'Level 1'}</span>
    </div>`).join('')}</div></div>`;
  })()}`;
}


