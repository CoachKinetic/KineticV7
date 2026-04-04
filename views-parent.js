import { APP, SKILLS, BELT_COLORS, BELT_LEVELS, ini } from './firebase-config.js?v=800';

const pct=(a,b)=>b>0?Math.round(a/b*100):0;
const calcAge=dob=>{if(!dob)return null;const a=Math.floor((new Date()-new Date(dob+'T12:00'))/(365.25*24*3600*1000));return(a>2&&a<25)?a:null;};
const fmtDate=d=>{try{return new Date(d+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}catch{return d||'';}};

function noAthlete(){
  return`<div class="empty-state" style="margin-top:60px;">
    <div class="es-icon">👪</div>
    <h3>Account Not Linked Yet</h3>
    <p>Your director will connect your child's account. Check back soon, or send them a message.</p>
    <button class="btn primary" style="margin-top:16px;" onclick="window.K.openModal('newMsgModal',{role:'parent'})">Message Director →</button>
  </div>`;
}

function athleteSwitcher(idx,dest){
  const a=APP.parentAthletes||[];
  if(a.length<=1)return'';
  return`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">${a.map((ath,i)=>`<button onclick="window.APP.parentAthIdx=${i};window.K.nav('${dest}')" style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:20px;cursor:pointer;border:2px solid ${i===idx?'var(--gold)':'var(--bdr)'};background:${i===idx?'rgba(181,153,106,0.1)':'var(--panel)'};font-family:'Barlow',sans-serif;font-size:13px;font-weight:${i===idx?700:500};color:${i===idx?'var(--gold)':'var(--t2)'};transition:all 0.15s;"><div class="mini-av" style="width:22px;height:22px;font-size:9px;">${ini(ath.name)}</div>${ath.name.split(' ')[0]}</button>`).join('')}</div>`;
}

export function parentHome(){
  const aths=APP.parentAthletes||[];
  if(!aths.length)return noAthlete();
  const idx=Math.min(APP.parentAthIdx||0,aths.length-1);
  const ath=aths[idx];

  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const ip=skills.filter(s=>skillMap[s.id]==='ip').length;
  const skillPct=skills.length?Math.round(mastered/skills.length*100):0;

  const myClasses=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));
  const attData=APP.parentAttendance?.[ath.id]||{};
  const unread=(APP.messages||[]).filter(m=>!m.read&&m.fromId!==APP.user?.uid&&m.fromId!=='system').length;
  const docs=(APP.allDocuments||[]).filter(d=>docVisibleToParent(d,ath));
  const charges=(APP.parentCharges||[]).filter(c=>c.athId===ath.id||c.athId==='all');
  const age=calcAge(ath.dob);
  const tuitionStatus=ath.tuitionStatus||'pending';
  const updated=APP.parentSkillUpdated?.[ath.id];
  const pendingMakeups=(APP.makeupRequests||[]).filter(r=>r.athId===ath.id&&r.status==='pending').length;

  return`
  ${athleteSwitcher(idx,'parentHome')}

  <!-- Hero card -->
  <div style="background:linear-gradient(135deg,#1C1C1C 0%,#242424 100%);border-radius:16px;padding:24px;margin-bottom:16px;position:relative;overflow:hidden;">
    <div style="position:absolute;right:-30px;top:-30px;width:160px;height:160px;border-radius:50%;background:rgba(181,153,106,0.06);pointer-events:none;"></div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
      <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#7A5A2A);display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-weight:900;font-size:18px;color:#1C1C1C;flex-shrink:0;">${ini(ath.name)}</div>
      <div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:19px;color:#FAFAF8;">${ath.name}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
          <div style="width:9px;height:9px;border-radius:50%;background:${BELT_COLORS[ath.level||'Level 1']||'#E8C84A'};"></div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);">${ath.level||'Level 1'}</span>
          ${age?`<span style="font-size:11px;color:rgba(250,250,248,0.35);">· ${age} yrs old</span>`:''}
        </div>
        ${myClasses.length?`<div style="font-size:11px;color:rgba(250,250,248,0.3);margin-top:3px;">${myClasses.map(c=>c.name+' · '+c.day).join('  |  ')}</div>`:''}
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:14px 16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(250,250,248,0.35);">Skill Progress · ${ath.level||'Level 1'}</span>
        <span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:17px;color:var(--gold);">${skillPct}%${updated?`<span style="font-size:10px;font-weight:400;color:rgba(250,250,248,0.25);margin-left:6px;">updated ${fmtDate(updated)}</span>`:''}</span>
      </div>
      <div style="height:7px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;margin-bottom:10px;">
        <div style="height:100%;border-radius:4px;background:linear-gradient(90deg,var(--gold),#C8AE86);width:${skillPct}%;transition:width 1s;"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[{v:mastered,l:'Mastered',c:'#5EC85E'},{v:ip,l:'In Progress',c:'#F59E0B'},{v:skills.length-mastered-ip,l:'Not Yet',c:'rgba(250,250,248,0.25)'}].map(s=>`<div style="text-align:center;background:rgba(255,255,255,0.04);border-radius:7px;padding:8px 4px;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:${s.c};">${s.v}</div><div style="font-size:10px;color:rgba(250,250,248,0.3);margin-top:2px;">${s.l}</div></div>`).join('')}
      </div>
    </div>
  </div>

  <!-- Refresh button -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
    <button onclick="window._parentRefreshing=true;this.textContent='Refreshing...';this.disabled=true;loadParentData().then(()=>{window.K.nav('parentHome');}).catch(()=>window.K.nav('parentHome'));" style="background:transparent;border:1px solid var(--bdr);color:var(--t3);font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 12px;border-radius:5px;cursor:pointer;">↻ Refresh Data</button>
  </div>
  <!-- Nav tiles -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
    ${navTile({icon:'🥋',label:'View Skills',sub:`${mastered}/${skills.length} mastered · tap to see all`,nav:'parentSkills',accent:'var(--gold)'})}
    ${navTile({icon:'💳',label:'Tuition',sub:`$${ath.tuitionAmount||185}/mo · ${tuitionStatus==='paid'?'✓ Paid':tuitionStatus==='overdue'?'⚠️ Overdue':'Pending'}${charges.length?` · ${charges.length} charge${charges.length>1?'s':''}`:''} `,nav:'parentTuition',accent:tuitionStatus==='overdue'?'var(--red)':tuitionStatus==='paid'?'#5EC85E':'var(--gold)',danger:tuitionStatus==='overdue'})}
    ${navTile({icon:'💬',label:'Messages',sub:unread?`${unread} unread`:'All caught up',nav:'parentMsgs',badge:unread,accent:unread?'var(--red)':'var(--t2)'})}
    ${navTile({icon:'📄',label:'Documents',sub:`${docs.length} shared with you`,nav:'parentDocuments',accent:'var(--t2)'})}
  </div>

  <!-- Attendance & Makeup per class -->
  ${myClasses.length?`<div style="margin-bottom:8px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Class Attendance</div>
    ${myClasses.map(cls=>{
      const rec=attData[cls.id]||{total:0,present:0,absent:0};
      const p=rec.total>0?pct(rec.present,rec.total):null;
      const pColor=p===null?'var(--t3)':p>=90?'#5EC85E':p>=70?'var(--gold)':'var(--red)';
      const hasPending=(APP.makeupRequests||[]).some(r=>r.athId===ath.id&&r.originalClassId===cls.id&&r.status==='pending');
      const hasApproved=(APP.makeupRequests||[]).some(r=>r.athId===ath.id&&r.originalClassId===cls.id&&r.status==='approved');
      return`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:14px 16px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${p!==null?8:0}px;">
          <div><div style="font-size:14px;font-weight:700;">${cls.name}</div><div style="font-size:11px;color:var(--t3);">${cls.day} · ${cls.time}</div></div>
          <div style="text-align:right;">
            <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:${pColor};">${p!==null?p+'%':'—'}</div>
            <div style="font-size:11px;color:var(--t3);">${rec.total>0?rec.present+'/'+rec.total+' classes':''}</div>
          </div>
        </div>
        ${p!==null?`<div style="height:5px;background:var(--bg);border-radius:3px;overflow:hidden;margin-bottom:8px;"><div style="height:100%;border-radius:3px;background:${pColor};width:${p}%;"></div></div>`:''}
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
          ${p!==null&&rec.absent>0?`<span style="font-size:12px;color:var(--t2);">${rec.absent} absence${rec.absent!==1?'s':''} on record</span>`:`<span></span>`}
          ${hasPending?`<span style="background:var(--y-soft);color:#8A6010;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;border:1px solid rgba(181,130,30,0.2);">⏳ Makeup pending</span>`
          :hasApproved?`<span style="background:var(--g-soft);color:var(--green);font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;border:1px solid rgba(42,107,42,0.2);">✓ Makeup approved</span>`
          :`<button onclick="window._mkSel=null;window.K.openModal('makeupReqModal',{athId:'${ath.id}',athName:'${ath.name}',athLevel:'${ath.level||'Level 1'}',originalClassId:'${cls.id}',originalClassName:'${cls.name}'})" style="background:var(--gold);border:none;color:var(--sb);font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:6px 14px;border-radius:6px;cursor:pointer;">Request Makeup →</button>`}
        </div>
      </div>`;
    }).join('')}
  </div>`:''}

  <!-- Other kids on this account -->
  ${aths.length>1?`<div style="margin-top:8px;border-top:1px solid var(--bdr);padding-top:14px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--t3);margin-bottom:8px;">Also on this account</div>
    ${aths.filter((_,i)=>i!==idx).map(a=>{const ai=aths.indexOf(a);const as2=SKILLS.filter(s=>s.level===(a.level||'Level 1'));const am=as2.filter(s=>(APP.parentSkillData?.[a.id]||{})[s.id]==='m').length;return`<div onclick="window.APP.parentAthIdx=${ai};window.K.nav('parentHome')" style="background:var(--panel);border:1px solid var(--bdr);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:6px;transition:all 0.15s;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--bdr)'"><div class="mini-av">${ini(a.name)}</div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">${a.name}</div><div style="font-size:11px;color:var(--t2);">${a.level||'Level 1'} · ${am}/${as2.length} skills</div></div><span style="color:var(--gold);">→</span></div>`;}).join('')}
  </div>`:''}`;
}

function navTile({icon,label,sub,nav,accent,badge,danger}){
  return`<div onclick="window.K.nav('${nav}')" style="background:var(--panel);border:1px solid ${danger?'rgba(155,58,47,0.3)':'var(--bdr)'};border-top:3px solid ${badge||danger||accent==='var(--gold)'||accent==='#5EC85E'?accent:'var(--bdr)'};border-radius:12px;padding:16px;cursor:pointer;position:relative;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
    ${badge?`<div style="position:absolute;top:10px;right:10px;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;font-family:'Barlow Condensed',sans-serif;">${badge}</div>`:''}
    <div style="font-size:24px;margin-bottom:8px;">${icon}</div>
    <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;margin-bottom:3px;">${label}</div>
    <div style="font-size:11px;color:${danger?'var(--red)':accent==='var(--t2)'?'var(--t2)':accent};font-weight:${badge||danger?600:400};line-height:1.4;">${sub}</div>
  </div>`;
}

function docVisibleToParent(d,ath){
  if(!d)return false;
  if(d.sharedWith==='all')return true;
  if(d.sharedWith==='athlete'&&ath&&(d.sharedWithIds||[]).includes(ath.id))return true;
  if(d.sharedWith==='class'&&ath){
    const mc=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));
    return mc.some(c=>(d.sharedWithIds||[]).includes(c.id));
  }
  return false;
}

export function parentSkills(){
  const aths=APP.parentAthletes||[];
  if(!aths.length)return noAthlete();
  const idx=Math.min(APP.parentAthIdx||0,aths.length-1);
  const ath=aths[idx];
  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const skillPct=pct(mastered,skills.length);
  const evColors={Vault:'#C25B30',Bars:'#2E5FA3',Beam:'#7B4FA0',Floor:'#2A6B2A',General:'#B5996A'};
  const events=[...new Set(skills.map(s=>s.event))];
  const updated=APP.parentSkillUpdated?.[ath.id];

  return`
  ${athleteSwitcher(idx,'parentSkills')}
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><h2 style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:18px;">Skills</h2><button class="btn" onclick="window.K.refreshParentData()" style="font-size:10px;padding:5px 12px;">⟳ Refresh</button></div>
  <div style="background:linear-gradient(135deg,#1C1C1C,#242424);border-radius:14px;padding:20px 22px;margin-bottom:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:15px;color:#FAFAF8;">${ath.name} · Skills</div>
      <div style="font-size:11px;color:rgba(250,250,248,0.4);margin-top:2px;">${ath.level||'Level 1'}${updated?` · Updated ${fmtDate(updated)}`:' · Coach updates these after each class'}</div></div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:34px;color:var(--gold);">${skillPct}%</div>
    </div>
    <div style="height:7px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;margin-bottom:10px;">
      <div style="height:100%;border-radius:4px;background:linear-gradient(90deg,var(--gold),#C8AE86);width:${skillPct}%;transition:width 1s;"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
      ${[{v:mastered,l:'Mastered',c:'#5EC85E'},{v:skills.filter(s=>skillMap[s.id]==='ip').length,l:'In Progress',c:'#F59E0B'},{v:skills.filter(s=>!skillMap[s.id]||skillMap[s.id]==='nr').length,l:'Not Yet',c:'rgba(250,250,248,0.25)'}].map(s=>`<div style="background:rgba(255,255,255,0.05);border-radius:7px;padding:9px;text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:${s.c};">${s.v}</div><div style="font-size:10px;color:rgba(250,250,248,0.35);margin-top:2px;">${s.l}</div></div>`).join('')}
    </div>
  </div>

  ${skills.length===0?`<div class="empty-state compact"><div class="es-icon">🥋</div><h3>No skills found for ${ath.level||'Level 1'}</h3></div>`:''}

  ${events.map(evt=>{
    const es=skills.filter(s=>s.event===evt);
    const em=es.filter(s=>skillMap[s.id]==='m').length;
    const col=evColors[evt]||'var(--gold)';
    return`<div style="background:var(--panel);border:1px solid var(--bdr);border-top:3px solid ${col};border-radius:12px;overflow:hidden;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
      <div style="padding:11px 16px;display:flex;align-items:center;justify-content:space-between;background:var(--p2);border-bottom:1px solid var(--bdr);">
        <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;">${{Vault:'🏃 Vault',Bars:'🤸 Bars',Beam:'🧘 Beam',Floor:'⭐ Floor',General:'🥋 General'}[evt]||evt}</div>
        <div style="display:flex;align-items:center;gap:8px;"><div style="width:55px;height:4px;background:var(--bg);border-radius:2px;overflow:hidden;"><div style="height:100%;border-radius:2px;background:${col};width:${pct(em,es.length)}%;"></div></div><span style="font-size:11px;font-weight:700;color:var(--t3);">${em}/${es.length}</span></div>
      </div>
      ${es.map(sk=>{
        const st=skillMap[sk.id]||'nr';
        const cfg={m:{bg:'var(--g-soft)',c:'var(--green)',b:'rgba(42,107,42,0.3)',icon:'✓',lbl:'Mastered'},ip:{bg:'var(--y-soft)',c:'#8A6010',b:'rgba(181,130,30,0.3)',icon:'~',lbl:'In Progress'},nr:{bg:'rgba(0,0,0,0.03)',c:'var(--t3)',b:'var(--bdr)',icon:'—',lbl:'Not Yet'}}[st]||{bg:'rgba(0,0,0,0.03)',c:'var(--t3)',b:'var(--bdr)',icon:'—',lbl:'Not Yet'};
        return`<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--bdr2);">
          <div style="flex:1;font-size:13px;font-weight:600;">${sk.name}</div>
          <div style="display:flex;align-items:center;gap:6px;"><div style="width:28px;height:28px;border-radius:50%;background:${cfg.bg};border:1.5px solid ${cfg.b};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${cfg.c};">${cfg.icon}</div><span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${cfg.c};">${cfg.lbl}</span></div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('')}`;
}

export function parentTuition(){
  const aths=APP.parentAthletes||[];
  if(!aths.length)return noAthlete();
  const idx=Math.min(APP.parentAthIdx||0,aths.length-1);
  const ath=aths[idx];
  const total=aths.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  const charges=(APP.parentCharges||[]).filter(c=>c.athId===ath.id||c.athId==='all');
  const chargeTotal=charges.reduce((s,c)=>s+(c.amount||0),0);

  return`
  ${athleteSwitcher(idx,'parentTuition')}
  <div style="background:linear-gradient(135deg,#1C1C1C,#242424);border-radius:16px;padding:22px 24px;margin-bottom:16px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(181,153,106,0.5);margin-bottom:5px;">Monthly Total</div>
    <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:40px;color:var(--gold);letter-spacing:-1px;margin-bottom:10px;">$${(total+chargeTotal).toLocaleString()}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
      ${[{n:'Tuition',v:'$'+total,c:'var(--gold)'},{n:'Charges',v:chargeTotal?'$'+chargeTotal:'None',c:chargeTotal?'#FF8A80':'rgba(250,250,248,0.3)'},{n:'Status',v:ath.tuitionStatus==='paid'?'✓ Paid':ath.tuitionStatus==='overdue'?'⚠️ Overdue':'Pending',c:ath.tuitionStatus==='paid'?'#5EC85E':ath.tuitionStatus==='overdue'?'#FF8A80':'var(--gold)'}].map(s=>`<div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;color:${s.c};">${s.v}</div><div style="font-size:10px;color:rgba(250,250,248,0.35);margin-top:3px;">${s.n}</div></div>`).join('')}
    </div>
  </div>

  <!-- Tuition per athlete -->
  ${aths.map(a=>`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="display:flex;align-items:center;gap:10px;"><div class="mini-av">${ini(a.name)}</div><div><div style="font-size:14px;font-weight:700;">${a.name}</div><div style="font-size:11px;color:var(--t2);">${a.billingCycle||'Monthly'} · ${a.level||''}</div></div></div>
    <div style="text-align:right;"><div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:18px;">$${a.tuitionAmount||185}</div><span class="pill ${a.tuitionStatus==='paid'?'present':a.tuitionStatus==='overdue'?'absent':'ip'}" style="margin-top:3px;">${a.tuitionStatus==='paid'?'✓ Paid':a.tuitionStatus==='overdue'?'⚠️ Overdue':'Pending'}</span></div>
  </div>`).join('')}

  <!-- Additional charges -->
  ${charges.length>0?`<div style="margin-top:14px;"><div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--t3);margin-bottom:8px;">Additional Charges</div>
  ${charges.map(c=>`<div style="background:var(--panel);border:1px solid var(--bdr);border-left:3px solid ${c.type==='Late Fee'?'var(--red)':'var(--gold)'};border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><div><div style="font-size:13px;font-weight:700;">${c.type||'Charge'}</div><div style="font-size:12px;color:var(--t2);">${c.desc||''}${c.createdAt?' · '+fmtDate(c.createdAt.split('T')[0]):''}</div></div><span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;color:${c.type==='Late Fee'?'var(--red)':'var(--t)'};">$${c.amount||0}</span></div>`).join('')}
  </div>`:''}

  <div class="alert info" style="margin-top:12px;font-size:13px;">Questions about your balance? <button onclick="window.K.openModal('newMsgModal',{role:'parent'})" style="background:transparent;border:none;color:var(--gold);font-weight:600;cursor:pointer;font-size:13px;text-decoration:underline;">Message your director →</button></div>`;
}

export function parentMsgs(){
  const uid=APP.user?.uid;
  const all=(APP.messages||[]).filter(m=>m.toId===uid||m.toRole==='parents'||m.fromId===uid);
  const tab=APP.msgTab||'unread';
  const inbox=all.filter(m=>!m.read&&m.fromId!==uid&&m.fromId!=='system');
  const display=tab==='sent'?all.filter(m=>m.fromId===uid):tab==='read'?all.filter(m=>(m.read||m.fromId===uid)&&m.fromId!=='system'):inbox;
  return`
  <div class="sec-hdr"><h3>Messages</h3><button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'parent'})">+ New</button></div>
  <div class="tab-bar">${[['unread','Inbox'+(inbox.length?` (${inbox.length})`:'')] ,['read','Read'],['sent','Sent']].map(([t,l])=>`<button class="tab-btn ${tab===t?'on':''}" onclick="window.APP.msgTab='${t}';window.K.nav('parentMsgs')">${l}</button>`).join('')}</div>
  ${display.length===0?`<div class="empty-state compact"><div class="es-icon">📬</div><h3>${tab==='unread'?'No new messages':'Nothing here'}</h3></div>`:msgList(display,uid,'parent')}`;
}

export function parentDocuments(){
  const aths=APP.parentAthletes||[];
  if(!aths.length)return noAthlete();
  const idx=Math.min(APP.parentAthIdx||0,aths.length-1);
  const ath=aths[idx];
  const docs=(APP.allDocuments||[]).filter(d=>docVisibleToParent(d,ath)).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const icons={'pdf':'📄','image':'🖼️','video':'🎥','form':'📋','link':'🔗','other':'📎'};
  return`
  ${aths.length>1?athleteSwitcher(idx,'parentDocuments'):''}
  <div class="sec-hdr"><h3>Documents</h3></div>
  ${docs.length===0?`<div class="empty-state"><div class="es-icon">📄</div><h3>No documents yet</h3><p>Your gym will share schedules, forms, and important documents here.</p></div>`
  :`<div style="display:flex;flex-direction:column;gap:8px;">${docs.map(d=>`<div onclick="${d.fileUrl?`window.open('${d.fileUrl}','_blank')`:'void(0)'}" style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;${d.fileUrl?'cursor:pointer;':''}box-shadow:0 1px 4px rgba(0,0,0,0.04);transition:all 0.15s;" onmouseover="${d.fileUrl?"this.style.borderColor='var(--gold)'":""}" onmouseout="this.style.borderColor='var(--bdr)'">
    <div style="width:44px;height:44px;border-radius:10px;background:rgba(181,153,106,0.1);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${icons[d.fileType||'other']||'📎'}</div>
    <div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:700;">${d.name||'Document'}</div>${d.description?`<div style="font-size:12px;color:var(--t2);margin-top:2px;">${d.description}</div>`:''}<div style="font-size:11px;color:var(--t3);margin-top:3px;">${d.createdAt?fmtDate(d.createdAt.split('T')[0]):''}</div></div>
    ${d.fileUrl?`<span style="color:var(--gold);font-size:18px;">↗</span>`:''}
  </div>`).join('')}</div>`}`;
}

export function parentRoutines(){
  const routines=(APP.allRoutines||[]).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  return`
  <div class="sec-hdr"><h3>Routines & Media</h3></div>
  ${routines.length===0?`<div class="empty-state"><div class="es-icon">🎬</div><h3>No routines yet</h3><p>Your gym will share routine videos and floor music here.</p></div>`
  :`<div style="display:flex;flex-direction:column;gap:8px;">${routines.map(r=>`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="width:44px;height:44px;border-radius:10px;background:rgba(99,102,241,0.1);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🎬</div>
    <div style="flex:1;"><div style="font-size:14px;font-weight:700;">${r.name}</div><div style="font-size:12px;color:var(--t2);">${r.className||'All Classes'}${r.level?' · '+r.level:''}</div></div>
    <div style="display:flex;flex-direction:column;gap:5px;">${r.videoUrl?`<a href="${r.videoUrl}" target="_blank" class="btn primary" style="font-size:10px;padding:5px 10px;">▶ Watch</a>`:''} ${r.audioUrl?`<a href="${r.audioUrl}" target="_blank" class="btn" style="font-size:10px;padding:5px 10px;">♪ Listen</a>`:''}</div>
  </div>`).join('')}</div>`}`;
}

function msgList(msgs,uid,role){
  return`<div style="display:flex;flex-direction:column;gap:6px;">${msgs.map(m=>{
    const isMine=m.fromId===uid;const isUnread=!m.read&&!isMine;
    const all=window.APP?.messages||[];const i=all.findIndex(x=>x===m||x.id===m.id);
    return`<div onclick="window.K.openModal('msgViewModal',{idx:${i},role:'${role}'})" style="background:var(--panel);border:1px solid var(--bdr);border-left:3px solid ${isUnread?'var(--gold)':'transparent'};border-radius:10px;padding:13px 14px;cursor:pointer;display:flex;align-items:flex-start;gap:10px;box-shadow:0 1px 4px rgba(0,0,0,0.04);transition:all 0.15s;" onmouseover="this.style.boxShadow='0 4px 14px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
      <div class="mini-av" style="${isUnread?'background:linear-gradient(135deg,var(--gold),#7A5A2A);color:var(--sb);':''}">${ini(m.from||'?')}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span style="font-size:13px;font-weight:${isUnread?700:500};">${isMine?'You →':m.from||'Unknown'}</span><span style="font-size:11px;color:var(--t3);">${m.time||''}</span></div>
        <div style="font-size:13px;font-weight:${isUnread?600:400};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.subject||''}</div>
        <div style="font-size:12px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.preview||m.body||''}</div>
      </div>
      ${isUnread?`<div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:4px;"></div>`:''}
    </div>`;
  }).join('')}</div>`;
}
