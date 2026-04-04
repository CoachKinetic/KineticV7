import { APP, SKILLS, BELT_COLORS, ini } from './firebase-config.js?v=800';

function switcher(idx,dest){
  const a=APP.parentAthletes||[];if(a.length<=1)return'';
  return `<div style="margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap;">${a.map((ath,i)=>`<div onclick="window.APP.parentAthIdx=${i};window.K.nav('${dest}')" style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:20px;cursor:pointer;border:2px solid ${i===idx?'var(--gold)':'var(--bdr)'};background:${i===idx?'rgba(181,153,106,0.1)':'var(--panel)'};transition:all 0.15s;"><div class="mini-av" style="width:24px;height:24px;font-size:9px;">${ini(ath.name)}</div><span style="font-size:13px;font-weight:${i===idx?700:500};color:${i===idx?'var(--gold)':'var(--t2)'};">${ath.name.split(' ')[0]}</span></div>`).join('')}</div>`;
}

export function parentHome(){
  const aths=APP.parentAthletes||[];
  const idx=APP.parentAthIdx||0;
  const ath=aths[idx];
  if(!ath)return`<div class="empty-state"><div class="es-icon">👪</div><h3>Welcome to KINETIC</h3><p>Your director will link your child's account shortly.</p></div>`;
  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const ip=skills.filter(s=>skillMap[s.id]==='ip').length;
  const pct=skills.length?Math.round(mastered/skills.length*100):0;
  const tuitionAmt=ath.tuitionAmount||185;
  const tuitionStatus=ath.tuitionStatus||'pending';
  const unread=(APP.messages||[]).filter(m=>!m.read&&m.fromId!==APP.user?.uid&&m.fromId!=='system').length;
  const docs=(APP.allDocuments||[]).filter(d=>d.sharedWith==='all'||(d.sharedWithIds||[]).includes(ath.id));
  return `
  ${switcher(idx,'parentHome')}
  <div style="background:linear-gradient(135deg,#1C1C1C,#2A2A2A);border-radius:16px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden;">
    <div style="position:absolute;right:-20px;top:-20px;width:120px;height:120px;border-radius:50%;background:rgba(181,153,106,0.08);"></div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#7A5A2A);display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;color:#1C1C1C;">${ini(ath.name)}</div>
      <div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:#FAFAF8;">${ath.name}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:3px;"><div style="width:8px;height:8px;border-radius:50%;background:${BELT_COLORS[ath.level||'Level 1']};"></div><span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);">${ath.level||'Level 1'}</span></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:14px;text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:24px;color:var(--gold);">${pct}%</div><div style="font-size:11px;color:rgba(250,250,248,0.5);margin-top:3px;text-transform:uppercase;letter-spacing:1px;">Progress</div></div>
      <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:14px;text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:24px;color:#5EC85E;">${mastered}</div><div style="font-size:11px;color:rgba(250,250,248,0.5);margin-top:3px;text-transform:uppercase;letter-spacing:1px;">Mastered</div></div>
      <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:14px;text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:24px;color:#F5A623;">${ip}</div><div style="font-size:11px;color:rgba(250,250,248,0.5);margin-top:3px;text-transform:uppercase;letter-spacing:1px;">In Progress</div></div>
    </div>
  </div>
  <div class="g2">
    <div class="dash-tile" onclick="window.K.nav('parentSkills')"><div class="dt-icon">🥋</div><div class="dt-label">Skills</div><div class="dt-sub">${mastered}/${skills.length} mastered</div></div>
    <div class="dash-tile" onclick="window.K.nav('parentTuition')"><div class="dt-icon">💳</div><div class="dt-label">Tuition</div><div class="dt-sub ${tuitionStatus==='overdue'?'red':tuitionStatus==='paid'?'green':''}">${tuitionStatus==='paid'?'✓ Paid':tuitionStatus==='overdue'?'⚠️ Overdue':'$'+tuitionAmt+'/mo'}</div></div>
    <div class="dash-tile" onclick="window.K.nav('parentMsgs')" style="position:relative;">${unread?`<div style="position:absolute;top:10px;right:10px;background:var(--red);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;">${unread}</div>`:''}  <div class="dt-icon">💬</div><div class="dt-label">Messages</div><div class="dt-sub">${unread?unread+' unread':'All caught up'}</div></div>
    <div class="dash-tile" onclick="window.K.nav('parentDocuments')"><div class="dt-icon">📄</div><div class="dt-label">Documents</div><div class="dt-sub">${docs.length} shared</div></div>
  </div>`;
}

export function parentSkills(){
  const aths=APP.parentAthletes||[];
  const idx=APP.parentAthIdx||0;
  const ath=aths[idx];
  if(!ath)return`<div class="empty-state"><div class="es-icon">🥋</div><h3>No athlete linked yet</h3></div>`;
  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const events=[...new Set(skills.map(s=>s.event))];
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const pct=skills.length?Math.round(mastered/skills.length*100):0;
  const updated=APP.parentSkillUpdated?.[ath.id];
  return `
  ${switcher(idx,'parentSkills')}
  <div class="sec-hdr"><h3>Skill Progress — ${ath.name.split(' ')[0]}</h3>${updated?`<span style="font-size:11px;color:var(--t3);">Updated ${new Date(updated+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>`:''}</div>
  <div class="progress-hero">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:32px;color:var(--gold);">${pct}%</div><div style="font-size:12px;color:var(--t3);">Overall Progress — ${ath.level||'Level 1'}</div></div>
      <div style="text-align:right;"><div style="font-size:13px;font-weight:700;color:var(--green);">${mastered} Mastered</div><div style="font-size:12px;color:var(--t2);">${skills.filter(s=>skillMap[s.id]==='ip').length} In Progress</div><div style="font-size:12px;color:var(--t3);">${skills.filter(s=>!skillMap[s.id]||skillMap[s.id]==='nr').length} Not Started</div></div>
    </div>
    <div class="prog-bar" style="height:8px;border-radius:4px;"><div class="prog-fill" style="width:${pct}%;border-radius:4px;"></div></div>
  </div>
  ${events.map(evt=>{
    const es=skills.filter(s=>s.event===evt);
    const em=es.filter(s=>skillMap[s.id]==='m').length;
    return`<div class="card" style="margin-bottom:14px;">
      <div class="card-hdr"><h4>${{Vault:'🏃 Vault',Bars:'🤸 Bars',Beam:'🧘 Beam',Floor:'⭐ Floor',General:'🥋 General'}[evt]||evt}</h4><span style="font-size:12px;color:var(--t3);">${em}/${es.length}</span></div>
      <div class="card-body">${es.map(sk=>{const st=skillMap[sk.id]||'nr';return`<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--bdr2);">
        <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${sk.name}</div></div>
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;${st==='m'?'background:var(--g-soft);color:var(--green);border:1.5px solid rgba(42,107,42,0.3);':st==='ip'?'background:var(--y-soft);color:#8A6010;border:1.5px solid rgba(181,130,30,0.3);':'background:rgba(0,0,0,0.04);color:var(--t3);border:1.5px solid var(--bdr);'}">${st==='m'?'✓':st==='ip'?'~':'—'}</div><span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${st==='m'?'var(--green)':st==='ip'?'#8A6010':'var(--t3)'};">${st==='m'?'Mastered':st==='ip'?'In Progress':'Not Ready'}</span></div>
      </div>`}).join('')}</div>
    </div>`;
  }).join('')}`;
}

export function parentTuition(){
  const aths=APP.parentAthletes||[];
  const total=aths.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  return `
  <div class="sec-hdr"><h3>Tuition</h3></div>
  <div class="stats2" style="margin-bottom:20px;">
    <div class="stat"><div class="sl">Monthly Total</div><div class="sv gold">$${total}</div></div>
    <div class="stat"><div class="sl">Status</div><div class="sv" style="font-size:18px;">${aths[0]?.tuitionStatus==='paid'?'✓ Paid':aths[0]?.tuitionStatus==='overdue'?'⚠️ Overdue':'Pending'}</div></div>
  </div>
  <div class="card"><div class="card-body">
    ${aths.map(a=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--bdr2);">
      <div style="display:flex;align-items:center;gap:10px;"><div class="mini-av">${ini(a.name)}</div><div><div style="font-size:14px;font-weight:700;">${a.name}</div><div style="font-size:12px;color:var(--t2);">${a.billingCycle||'Monthly'} · ${a.level||'Level 1'}</div></div></div>
      <div style="text-align:right;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;">$${a.tuitionAmount||185}</div><span class="pill ${a.tuitionStatus==='paid'?'present':a.tuitionStatus==='overdue'?'absent':'gold-p'}">${a.tuitionStatus||'Pending'}</span></div>
    </div>`).join('')}
  </div></div>
  <div class="alert info">Questions about your account? Send a message to your director.</div>`;
}

export function parentMsgs(){
  const uid=APP.user?.uid;
  const all=(APP.messages||[]).filter(m=>m.toId===uid||m.toRole==='parents'||m.fromId===uid);
  const tab=window.APP?.msgTab||'unread';
  const inbox=all.filter(m=>!m.read&&m.fromId!==uid&&m.fromId!=='system');
  const readM=all.filter(m=>(m.read||m.fromId===uid)&&m.fromId!=='system');
  const sent=all.filter(m=>m.fromId===uid);
  const display=tab==='sent'?sent:tab==='read'?readM:inbox;
  return `
  <div class="sec-hdr"><h3>Messages</h3><button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'parent'})">+ New</button></div>
  <div class="tab-bar">
    ${[['unread',`Inbox${inbox.length?` (${inbox.length})`:''}`,],['read','Read'],['sent','Sent']].map(([t,l])=>`<button class="tab-btn ${tab===t?'on':''}" onclick="window.APP.msgTab='${t}';window.K.nav('parentMsgs')">${l}</button>`).join('')}
  </div>
  ${msgInboxRender(display,'parent')}`;
}

export function parentDocuments(){
  const aths=APP.parentAthletes||[];
  const idx=APP.parentAthIdx||0;
  const ath=aths[idx];
  const docs=(APP.allDocuments||[]).filter(d=>{
    if(d.sharedWith==='all')return true;
    if(d.sharedWith==='athlete'&&ath&&(d.sharedWithIds||[]).includes(ath.id))return true;
    if(d.sharedWith==='class'&&ath){
      const myClasses=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));
      return myClasses.some(c=>(d.sharedWithIds||[]).includes(c.id));
    }
    return false;
  }).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const icons={'pdf':'📄','image':'🖼️','video':'🎥','form':'📋','other':'📎'};
  return `
  ${switcher(idx,'parentDocuments')}
  <div class="sec-hdr"><h3>Documents</h3></div>
  ${docs.length===0?`<div class="empty-state"><div class="es-icon">📄</div><h3>No documents yet</h3><p>Your gym director will share documents here — forms, schedules, and more.</p></div>`
  :`<div class="card"><div class="card-body">${docs.map(d=>`<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-bottom:1px solid var(--bdr2);cursor:pointer;" onclick="window.open('${d.fileUrl||'#'}','_blank')">
    <div style="width:44px;height:44px;border-radius:10px;background:rgba(181,153,106,0.1);border:1px solid rgba(181,153,106,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icons[d.fileType||'other']||'📎'}</div>
    <div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.name||'Document'}</div>
    <div style="font-size:12px;color:var(--t2);margin-top:3px;">${d.description||''}</div>
    <div style="font-size:11px;color:var(--t3);margin-top:3px;">${d.createdAt?new Date(d.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''}</div></div>
    <span style="color:var(--gold);font-size:18px;">→</span>
  </div>`).join('')}</div></div>`}`;
}

function msgInboxRender(msgs,role){
  const uid=window.APP?.user?.uid||'';
  if(!msgs||msgs.length===0)return`<div class="empty-state"><div class="es-icon">${role==='parent'?'📬':'📭'}</div><h3>Nothing here yet</h3></div>`;
  return`<div class="card"><div class="card-body">${msgs.map(m=>{
    const isMine=m.fromId===uid;const isUnread=!m.read&&!isMine;
    const all=window.APP?.messages||[];const idx=all.findIndex(x=>x===m||x.id===m.id);
    return`<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid var(--bdr2);cursor:pointer;${isUnread?'background:rgba(181,153,106,0.04);':''}" onclick="window.K.openModal('msgViewModal',{idx:${idx},role:'${role}'})">
      <div class="mini-av" style="${isUnread?'background:linear-gradient(135deg,var(--gold),#7A5A2A);color:var(--sb);':''}">${ini(m.from||'?')}</div>
      <div style="flex:1;min-width:0;"><div style="display:flex;justify-content:space-between;"><span style="font-size:13px;font-weight:${isUnread?700:500};">${isMine?'→ Director':m.from||'Unknown'}</span><span style="font-size:11px;color:var(--t3);">${m.time||''}</span></div>
      <div style="font-size:13px;font-weight:${isUnread?600:400};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.subject||''}</div>
      <div style="font-size:12px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.preview||m.body||''}</div></div>
      ${isUnread?`<div style="width:7px;height:7px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:6px;"></div>`:''}
    </div>`;
  }).join('')}</div></div>`;
}
