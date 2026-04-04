import { APP, SKILLS, BELT_COLORS, ini } from './firebase-config.js?v=800';

function switcher(idx,dest){
  const a=APP.parentAthletes||[];if(a.length<=1)return'';
  return`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">${a.map((ath,i)=>`<div onclick="window.APP.parentAthIdx=${i};window.K.nav('${dest}')" style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:20px;cursor:pointer;border:2px solid ${i===idx?'var(--gold)':'var(--bdr)'};background:${i===idx?'rgba(181,153,106,0.1)':'var(--panel)'};transition:all 0.15s;"><div class="mini-av" style="width:24px;height:24px;font-size:9px;">${ini(ath.name)}</div><span style="font-size:13px;font-weight:${i===idx?700:500};color:${i===idx?'var(--gold)':'var(--t2)'};">${ath.name.split(' ')[0]}</span></div>`).join('')}</div>`;
}

export function parentHome(){
  const aths=APP.parentAthletes||[];const idx=APP.parentAthIdx||0;const ath=aths[idx];
  if(!ath)return`<div class="empty-state" style="margin-top:60px;"><div class="es-icon">👪</div><h3>Welcome to KINETIC</h3><p>Your director will link your child's account shortly.</p></div>`;
  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const ip=skills.filter(s=>skillMap[s.id]==='ip').length;
  const pct=skills.length?Math.round(mastered/skills.length*100):0;
  const tuitionAmt=ath.tuitionAmount||185;
  const tuitionStatus=ath.tuitionStatus||'pending';
  const unread=(APP.messages||[]).filter(m=>!m.read&&m.fromId!==APP.user?.uid&&m.fromId!=='system').length;
  const docs=(APP.allDocuments||[]).filter(d=>{if(d.sharedWith==='all')return true;if(d.sharedWith==='athlete'&&(d.sharedWithIds||[]).includes(ath.id))return true;if(d.sharedWith==='class'){const myClasses=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));return myClasses.some(c=>(d.sharedWithIds||[]).includes(c.id));}return false;});
  const myClasses=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));
  return`
  ${switcher(idx,'parentHome')}
  <div style="background:linear-gradient(135deg,#1C1C1C 0%,#242424 60%,#1a1a1a 100%);border-radius:16px;padding:24px;margin-bottom:20px;position:relative;overflow:hidden;">
    <div style="position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(181,153,106,0.06);pointer-events:none;"></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#7A5A2A);display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-weight:900;font-size:20px;color:#1C1C1C;flex-shrink:0;">${ini(ath.name)}</div>
      <div><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:20px;color:#FAFAF8;">${ath.name}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:5px;"><div style="width:10px;height:10px;border-radius:50%;background:${BELT_COLORS[ath.level||'Level 1']};"></div><span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);">${ath.level||'Level 1'}</span></div>
      ${myClasses.length?`<div style="font-size:12px;color:rgba(250,250,248,0.4);margin-top:2px;">${myClasses.map(c=>c.name).join(' · ')}</div>`:''}</div>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:14px 16px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(250,250,248,0.4);">Skill Progress</span><span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:var(--gold);">${pct}%</span></div>
      <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;margin-bottom:10px;"><div style="height:100%;border-radius:4px;background:linear-gradient(90deg,var(--gold),#C8AE86);width:${pct}%;transition:width 1s ease;"></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        ${[{v:mastered,l:'Mastered',c:'#5EC85E'},{v:ip,l:'In Progress',c:'#F59E0B'},{v:skills.length-(mastered+ip),l:'Not Started',c:'rgba(250,250,248,0.3)'}].map(s=>`<div style="text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:${s.c};">${s.v}</div><div style="font-size:10px;color:rgba(250,250,248,0.35);margin-top:2px;">${s.l}</div></div>`).join('')}
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    ${[
      {icon:'🥋',label:'Skills',sub:`${mastered}/${skills.length} mastered`,nav:'parentSkills',accent:'var(--gold)'},
      {icon:'💳',label:'Tuition',sub:tuitionStatus==='paid'?'✓ Paid this month':tuitionStatus==='overdue'?'⚠️ Payment overdue':'$'+tuitionAmt+'/mo',nav:'parentTuition',accent:tuitionStatus==='paid'?'#5EC85E':tuitionStatus==='overdue'?'var(--red)':'var(--t2)',danger:tuitionStatus==='overdue'},
      {icon:'💬',label:'Messages',sub:unread?unread+' unread message'+(unread>1?'s':''):'All caught up',nav:'parentMsgs',accent:unread?'var(--gold)':'var(--t2)',badge:unread},
      {icon:'📄',label:'Documents',sub:docs.length+' shared with you',nav:'parentDocuments',accent:'var(--t2)'},
    ].map(t=>`<div onclick="window.K.nav('${t.nav}')" style="background:var(--panel);border:1px solid ${t.danger?'rgba(155,58,47,0.3)':'var(--bdr)'};border-top:3px solid ${t.accent==='var(--gold)'||t.accent==='#5EC85E'||t.badge?t.accent:'var(--bdr)'};border-radius:12px;padding:18px 16px;cursor:pointer;position:relative;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
      ${t.badge?`<div style="position:absolute;top:10px;right:10px;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;font-family:'Barlow Condensed',sans-serif;">${t.badge}</div>`:''}
      <div style="font-size:26px;margin-bottom:10px;">${t.icon}</div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;margin-bottom:4px;">${t.label}</div>
      <div style="font-size:12px;color:${t.danger?'var(--red)':t.accent==='var(--t2)'?'var(--t2)':t.accent};font-weight:${t.badge||t.danger?600:400};">${t.sub}</div>
    </div>`).join('')}
  </div>`;
}

export function parentSkills(){
  const aths=APP.parentAthletes||[];const idx=APP.parentAthIdx||0;const ath=aths[idx];
  if(!ath)return`<div class="empty-state"><div class="es-icon">🥋</div><h3>No athlete linked</h3></div>`;
  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const events=[...new Set(skills.map(s=>s.event))];
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const pct=skills.length?Math.round(mastered/skills.length*100):0;
  const evColors={Vault:'#C25B30',Bars:'#2E5FA3',Beam:'#7B4FA0',Floor:'#2A6B2A',General:'#B5996A'};
  const updated=APP.parentSkillUpdated?.[ath.id];
  return`
  ${switcher(idx,'parentSkills')}
  <div style="background:linear-gradient(135deg,#1C1C1C,#242424);border-radius:14px;padding:20px 24px;margin-bottom:20px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;color:#FAFAF8;">${ath.name}'s Skills</div><div style="font-size:12px;color:rgba(250,250,248,0.4);margin-top:3px;">${ath.level||'Level 1'}${updated?` · Updated ${new Date(updated+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}`:''}</div></div>
      <div style="text-align:right;"><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:36px;color:var(--gold);line-height:1;">${pct}%</div><div style="font-size:10px;color:rgba(250,250,248,0.35);text-transform:uppercase;letter-spacing:1px;">progress</div></div>
    </div>
    <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;margin-bottom:12px;"><div style="height:100%;border-radius:4px;background:linear-gradient(90deg,var(--gold),#C8AE86);width:${pct}%;transition:width 1s ease;"></div></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
      ${[{v:mastered,l:'Mastered',c:'#5EC85E'},{v:skills.filter(s=>skillMap[s.id]==='ip').length,l:'In Progress',c:'#F59E0B'},{v:skills.filter(s=>!skillMap[s.id]||skillMap[s.id]==='nr').length,l:'Not Yet',c:'rgba(250,250,248,0.3)'}].map(s=>`<div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:${s.c};">${s.v}</div><div style="font-size:10px;color:rgba(250,250,248,0.35);margin-top:2px;">${s.l}</div></div>`).join('')}
    </div>
  </div>
  ${events.map(evt=>{
    const es=skills.filter(s=>s.event===evt);const em=es.filter(s=>skillMap[s.id]==='m').length;const col=evColors[evt]||'var(--gold)';
    return`<div style="background:var(--panel);border:1px solid var(--bdr);border-top:3px solid ${col};border-radius:12px;overflow:hidden;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
      <div style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;background:var(--p2);border-bottom:1px solid var(--bdr);">
        <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;">${{Vault:'🏃 Vault',Bars:'🤸 Bars',Beam:'🧘 Beam',Floor:'⭐ Floor',General:'🥋 General'}[evt]||evt}</div>
        <div style="display:flex;align-items:center;gap:8px;"><div style="width:60px;height:4px;background:var(--bg);border-radius:2px;overflow:hidden;"><div style="height:100%;border-radius:2px;background:${col};width:${Math.round(em/es.length*100)}%;"></div></div><span style="font-size:11px;font-weight:700;color:var(--t3);">${em}/${es.length}</span></div>
      </div>
      <div>${es.map(sk=>{const st=skillMap[sk.id]||'nr';const statusDef={m:{bg:'var(--g-soft)',c:'var(--green)',border:'rgba(42,107,42,0.3)',icon:'✓',label:'Mastered'},ip:{bg:'var(--y-soft)',c:'#8A6010',border:'rgba(181,130,30,0.3)',icon:'~',label:'In Progress'},nr:{bg:'rgba(0,0,0,0.03)',c:'var(--t3)',border:'var(--bdr)',icon:'—',label:'Not Yet'}};const def=statusDef[st]||statusDef.nr;return`<div style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--bdr2);">
        <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${sk.name}</div></div>
        <div style="display:flex;align-items:center;gap:7px;"><div style="width:30px;height:30px;border-radius:50%;background:${def.bg};border:1.5px solid ${def.border};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:${def.c};">${def.icon}</div><span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${def.c};">${def.label}</span></div>
      </div>`;}).join('')}</div>
    </div>`;
  }).join('')}`;
}

export function parentTuition(){
  const aths=APP.parentAthletes||[];
  const total=aths.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  const status=aths[0]?.tuitionStatus||'pending';
  return`
  <div style="background:linear-gradient(135deg,#1C1C1C,#242424);border-radius:16px;padding:24px;margin-bottom:20px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(181,153,106,0.5);margin-bottom:6px;">Monthly Total</div>
    <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:44px;color:${status==='paid'?'#5EC85E':status==='overdue'?'#FF8A80':'var(--gold)'};letter-spacing:-1px;margin-bottom:8px;">$${total.toLocaleString()}</div>
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:10px;height:10px;border-radius:50%;background:${status==='paid'?'#5EC85E':status==='overdue'?'var(--red)':'var(--gold)'}"></div>
      <span style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(250,250,248,0.5);">${status==='paid'?'Paid — Thank you!':status==='overdue'?'Payment Overdue':'Payment Pending'}</span>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">${aths.map(a=>`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="display:flex;align-items:center;gap:12px;"><div class="mini-av" style="width:40px;height:40px;font-size:14px;">${ini(a.name)}</div><div><div style="font-size:15px;font-weight:700;">${a.name}</div><div style="font-size:12px;color:var(--t2);margin-top:2px;">${a.billingCycle||'Monthly'} · ${a.level||'Level 1'}</div></div></div>
    <div style="text-align:right;"><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:20px;">$${a.tuitionAmount||185}</div><span class="pill ${a.tuitionStatus==='paid'?'present':a.tuitionStatus==='overdue'?'absent':'gold-p'}" style="margin-top:4px;">${a.tuitionStatus||'Pending'}</span></div>
  </div>`).join('')}</div>
  <div class="alert info" style="font-size:13px;">Questions about your balance? Send a message to your director and they'll get back to you.</div>`;
}

export function parentMsgs(){
  const uid=APP.user?.uid;
  const all=(APP.messages||[]).filter(m=>m.toId===uid||m.toRole==='parents'||m.fromId===uid);
  const tab=window.APP?.msgTab||'unread';
  const inbox=all.filter(m=>!m.read&&m.fromId!==uid&&m.fromId!=='system');
  const readM=all.filter(m=>(m.read||m.fromId===uid)&&m.fromId!=='system');
  const sent=all.filter(m=>m.fromId===uid);
  const display=tab==='sent'?sent:tab==='read'?readM:inbox;
  return`
  <div class="sec-hdr"><h3>Messages</h3><button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'parent'})">+ New</button></div>
  <div class="tab-bar">${[['unread',`Inbox${inbox.length?` (${inbox.length})`:''}`,],['read','Read'],['sent','Sent']].map(([t,l])=>`<button class="tab-btn ${tab===t?'on':''}" onclick="window.APP.msgTab='${t}';window.K.nav('parentMsgs')">${l}</button>`).join('')}</div>
  ${display.length===0?`<div class="empty-state compact"><div class="es-icon">📬</div><h3>${tab==='unread'?'No new messages':'Nothing here yet'}</h3></div>`
  :msgList(display,uid,'parent')}`;
}

export function parentDocuments(){
  const aths=APP.parentAthletes||[];const idx=APP.parentAthIdx||0;const ath=aths[idx];
  const docs=(APP.allDocuments||[]).filter(d=>{if(d.sharedWith==='all')return true;if(d.sharedWith==='athlete'&&ath&&(d.sharedWithIds||[]).includes(ath.id))return true;if(d.sharedWith==='class'&&ath){const myClasses=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));return myClasses.some(c=>(d.sharedWithIds||[]).includes(c.id));}return false;}).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const icons={'pdf':'📄','image':'🖼️','video':'🎥','form':'📋','link':'🔗','other':'📎'};
  const typeColors={'pdf':'rgba(220,38,38,0.1)','image':'rgba(59,130,246,0.1)','video':'rgba(124,58,237,0.1)','form':'rgba(16,185,129,0.1)','link':'rgba(245,158,11,0.1)','other':'rgba(107,114,128,0.1)'};
  return`
  ${switcher(idx,'parentDocuments')}
  <div class="sec-hdr"><h3>Documents</h3></div>
  ${docs.length===0?`<div class="empty-state"><div class="es-icon">📄</div><h3>No documents yet</h3><p>Your gym will share forms, schedules, and important documents here.</p></div>`
  :`<div style="display:flex;flex-direction:column;gap:8px;">${docs.map(d=>`<div onclick="${d.fileUrl?`window.open('${d.fileUrl}','_blank')`:'return'}" style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;${d.fileUrl?'cursor:pointer;':''}transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="${d.fileUrl?"this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';this.style.borderColor='var(--gold)'":""}" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)';this.style.borderColor='var(--bdr)'">
    <div style="width:48px;height:48px;border-radius:12px;background:${typeColors[d.fileType||'other']||'rgba(107,114,128,0.1)'};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${icons[d.fileType||'other']||'📎'}</div>
    <div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.name||'Document'}</div>
    ${d.description?`<div style="font-size:12px;color:var(--t2);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.description}</div>`:''}
    <div style="font-size:11px;color:var(--t3);margin-top:5px;">${d.createdAt?new Date(d.createdAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):''}</div></div>
    ${d.fileUrl?`<div style="color:var(--gold);font-size:20px;flex-shrink:0;">↗</div>`:''}
  </div>`).join('')}</div>`}`;
}

function msgList(msgs,uid,role){
  return`<div style="display:flex;flex-direction:column;gap:6px;">${msgs.map(m=>{const isMine=m.fromId===uid;const isUnread=!m.read&&!isMine;const all=window.APP?.messages||[];const idx=all.findIndex(x=>x===m||x.id===m.id);return`<div onclick="window.K.openModal('msgViewModal',{idx:${idx},role:'${role}'})" style="background:var(--panel);border:1px solid var(--bdr);border-left:3px solid ${isUnread?'var(--gold)':'transparent'};border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:flex-start;gap:12px;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
    <div class="mini-av" style="${isUnread?'background:linear-gradient(135deg,var(--gold),#7A5A2A);color:var(--sb);':''}">${ini(m.from||'?')}</div>
    <div style="flex:1;min-width:0;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;"><span style="font-size:13px;font-weight:${isUnread?700:500};">${isMine?'You →':m.from||'Unknown'}</span><span style="font-size:11px;color:var(--t3);">${m.time||''}</span></div>
    <div style="font-size:13px;font-weight:${isUnread?600:400};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.subject||''}</div>
    <div style="font-size:12px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${m.preview||m.body||''}</div></div>
    ${isUnread?`<div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:4px;"></div>`:''}
  </div>`;}).join('')}</div>`;
}

export function parentRoutines(){
  const routines=(APP.allRoutines||[]).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  return`<div class="sec-hdr"><h3>Routines & Media</h3></div>
  ${routines.length===0?`<div class="empty-state"><div class="es-icon">🎬</div><h3>No routines yet</h3><p>Your gym will share routine videos and floor music here.</p></div>`
  :`<div style="display:flex;flex-direction:column;gap:8px;">${routines.map(r=>`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="width:48px;height:48px;border-radius:12px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🎬</div>
    <div style="flex:1;"><div style="font-size:15px;font-weight:700;">${r.name||'Routine'}</div><div style="font-size:12px;color:var(--t2);margin-top:2px;">${r.className||'All Classes'}${r.level?' · '+r.level:''}</div>${r.notes?`<div style="font-size:12px;color:var(--t3);margin-top:3px;">${r.notes}</div>`:''}</div>
    <div style="display:flex;flex-direction:column;gap:6px;">${r.videoUrl?`<a href="${r.videoUrl}" target="_blank" class="btn primary" style="font-size:10px;padding:6px 12px;white-space:nowrap;">▶ Watch</a>`:''} ${r.audioUrl?`<a href="${r.audioUrl}" target="_blank" class="btn" style="font-size:10px;padding:6px 12px;white-space:nowrap;">♪ Audio</a>`:''}</div>
  </div>`).join('')}</div>`}`;
}
