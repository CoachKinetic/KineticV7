import { APP, SKILLS, BELT_COLORS, ini } from './firebase-config.js?v=743';
import { msgInbox } from './views-director.js?v=743';

function switcher(idx, dest){
  const a=APP.parentAthletes||[];
  if(a.length<=1) return '';
  return `<div style="margin-bottom:20px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">My Athletes</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${a.map((ath,i)=>`<div onclick="window.APP.parentAthIdx=${i};window.K.nav('${dest}')"
        style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:8px;cursor:pointer;border:2px solid ${i===idx?'var(--gold)':'var(--bdr)'};background:${i===idx?'rgba(181,153,106,0.08)':'var(--panel)'};transition:all 0.15s;">
        <div class="mini-av" style="width:28px;height:28px;font-size:11px;">${ini(ath.name)}</div>
        <div><div style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:13px;">${ath.name}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${i===idx?'var(--gold)':'var(--t3)'};">${ath.level||'Level 1'}</div></div>
      </div>`).join('')}
    </div>
  </div>`;
}

export function parentHome(){
  const aths=APP.parentAthletes||[];
  const idx=APP.parentAthIdx||0;
  const ath=aths[idx];
  if(!ath) return `<div class="alert info">👪 Welcome to KINETIC! Your director will link your child's account shortly.</div>`;
  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const total=aths.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  return `
  ${switcher(idx,'parentHome')}
  <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:14px;opacity:0.7;">${ath.name}'s Dashboard</div>
  <div class="stats3">
    <div class="stat" onclick="window.K.nav('parentSkills')"><div class="si">🥋</div><div class="sl">Skills Mastered</div><div class="sv gold">${mastered}</div><div class="ssub">of ${skills.length} skills</div></div>
    <div class="stat"><div class="si">📅</div><div class="sl">Attendance</div><div class="sv">92%</div></div>
    <div class="stat"><div class="si">⭐</div><div class="sl">Pass-Off</div><div class="sv gold">${skills.length-mastered} left</div></div>
  </div>
  <div class="g2">
    <div>
      <div class="sec-hdr"><h3>Skills</h3><button class="slink" onclick="window.K.nav('parentSkills')">All →</button></div>
      <div class="card"><div class="card-body">
        ${skills.slice(0,7).map(s=>`<div class="ps-row">
          <span style="font-size:16px;">${skillMap[s.id]==='m'?'✅':skillMap[s.id]==='ip'?'🔄':'⬜'}</span>
          <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${s.name}</div><div style="font-size:11px;color:var(--t3);">${s.event}</div></div>
          <span class="pill ${skillMap[s.id]==='m'?'present':skillMap[s.id]==='ip'?'ip':'not-r'}">${skillMap[s.id]==='m'?'Mastered':skillMap[s.id]==='ip'?'In Progress':'Not Ready'}</span>
        </div>`).join('')}
      </div></div>
    </div>
    <div>
      <div class="sec-hdr"><h3>Tuition</h3><button class="slink" onclick="window.K.nav('parentTuition')">View All →</button></div>
      <div style="background:var(--panel);border:1px solid var(--bdr);border-radius:8px;padding:18px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:28px;">$${ath.tuitionAmount||185}.00</div>
            <div style="font-size:12px;color:var(--t3);margin-top:3px;">${ath.name.split(' ')[0]} · Monthly</div>
          </div>
          <button class="btn primary" onclick="window.toast('💳 Stripe coming soon!')">Pay →</button>
        </div>
        ${aths.length>1?`<div style="border-top:1px solid var(--bdr);padding-top:10px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:var(--t3);">Total for all athletes:</span>
          <span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;color:var(--gold);">$${total}/mo</span>
        </div>`:''}
      </div>
      <div class="alert ok">🎉 <strong>${ath.name.split(' ')[0]}</strong> has <strong>${skills.length-mastered} skills left</strong> before pass-off!</div>
    ${coachNames?`<div class="alert info" style="font-size:12px;">🧑‍🏫 ${ath.name.split(' ')[0]}'s Coach${coachNames.includes(',')?' Team':''}:<strong> ${coachNames}</strong></div>`:''}
    </div>
  </div>`;
}

export function parentSkills(){
  const aths=APP.parentAthletes||[];
  const idx=APP.parentAthIdx||0;
  const ath=aths[idx];
  if(!ath) return `<div class="alert info">No athlete linked yet.</div>`;
  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  // Find this athlete's index in their class for skill lookup
  // Coach names stored on athlete record by director when assigning
  const coachNames=(ath.coachNames||[]).join(', ')||'';
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const evts=[...new Set(skills.map(s=>s.event))];
  return `
  ${switcher(idx,'parentSkills')}
  <div class="sec-hdr"><h3>${ath.name}'s Skills — ${ath.level||'Level 1'}</h3></div>
  <div class="stats3">
    <div class="stat"><div class="sl">Mastered</div><div class="sv gold">${mastered}</div></div>
    <div class="stat"><div class="sl">In Progress</div><div class="sv" style="color:#8A6010;">${skills.filter(s=>s.def==='ip').length}</div></div>
    <div class="stat"><div class="sl">Not Ready</div><div class="sv" style="color:var(--t3);">${skills.filter(s=>s.def==='nr'||!s.def).length}</div></div>
  </div>
  <div class="card"><div class="card-body">
    ${evts.map(evt=>{
      const es=skills.filter(s=>s.event===evt);if(!es.length)return '';
      return `<div class="evt-hdr">${evt}</div>${es.map(s=>`<div class="ps-row">
        <span style="font-size:16px;">${sm[s.id]==='m'?'✅':sm[s.id]==='ip'?'🔄':'⬜'}</span>
        <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${s.name}</div></div>
        <span class="pill ${sm[s.id]==='m'?'present':sm[s.id]==='ip'?'ip':'not-r'}">${sm[s.id]==='m'?'Mastered':sm[s.id]==='ip'?'In Progress':'Not Ready'}</span>
      </div>`).join('')}`;
    }).join('')}
  </div></div>
  <div class="alert info">📅 When all skills are mastered: <strong>Ask your coach about the next pass-off day!</strong></div>`;
}

export function parentTuition(){
  const aths=APP.parentAthletes||[];
  const total=aths.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  return `
  <div class="sec-hdr"><h3>Tuition & Payments</h3></div>
  ${aths.length>1?`<div class="stat" style="margin-bottom:16px;"><div class="sl">Total Monthly — All Athletes</div><div class="sv gold">$${total}.00</div></div>`:''}
  ${aths.map(a=>`<div style="margin-bottom:16px;">
    ${aths.length>1?`<div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:8px;">${a.name}</div>`:''}
    <div style="background:var(--panel);border:1px solid var(--bdr);border-radius:8px;padding:18px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:28px;">$${a.tuitionAmount||185}.00</div>
        <div style="font-size:12px;color:var(--t3);margin-top:3px;">${a.billingCycle||'Monthly'} · ${a.level||'Level 1'}</div>
        <div style="margin-top:8px;"><span class="pill ${a.tuitionStatus==='paid'?'present':a.tuitionStatus==='overdue'?'absent':'gold-p'}">${a.tuitionStatus||'Upcoming'}</span></div>
      </div>
      <button class="btn primary" onclick="window.toast('💳 Stripe coming soon!')">Pay Now →</button>
    </div>
  </div>`).join('')}
  <div class="card"><div class="card-hdr"><h4>Payment History</h4></div>
    <div style="padding:24px;text-align:center;color:var(--t3);">Full payment history when Stripe is connected.</div>
  </div>`;
}

export function parentMsgs(){
  const uid=APP.user?.uid;
  const all=(APP.messages||[]).filter(m=>m.toId===uid||m.toRole==='parents'||m.fromId===uid);
  const tab=window.APP?.msgTab||'unread';
  const inbox=all.filter(m=>!m.read&&m.fromId!==uid&&m.fromId!=='system');
  const readM=all.filter(m=>(m.read||m.fromId===uid)&&m.fromId!=='system');
  const sent=all.filter(m=>m.fromId===uid);
  const display=tab==='sent'?sent:tab==='read'?readM:inbox;
  const tabs=`<div style="display:flex;gap:0;margin-bottom:12px;border:1px solid var(--bdr);border-radius:6px;overflow:hidden;">
    ${[['unread',`Inbox${inbox.length?` (${inbox.length})`:''}`,],['read','Read'],['sent','Sent']].map(([t,l])=>`
    <button onclick="window.APP.msgTab='${t}';window.K.nav('parentMsgs')"
      style="flex:1;padding:9px 6px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:none;border-right:1px solid var(--bdr);
      background:${tab===t?'var(--gold)':'var(--panel)'};color:${tab===t?'var(--sb)':'var(--t2)'};">${l}</button>`).join('')}
  </div>`;
  return `<div class="sec-hdr"><h3>Messages</h3><button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'parent'})">+ New</button></div>`+tabs+msgInbox(display,'parent');
}
