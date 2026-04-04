import { APP, SKILLS, BELT_COLORS, BELT_LEVELS, ini } from './firebase-config.js?v=800';

// Self-contained helpers so nothing is undefined
const calcAge=dob=>{if(!dob)return null;const a=Math.floor((new Date()-new Date(dob))/(365.25*24*3600*1000));return(a>0&&a<25)?a:null;};
const pct=(a,b)=>b>0?Math.round(a/b*100):0;
const fmtDate=d=>{try{return new Date(d+'T12:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}catch{return d;}};

// Multi-athlete switcher
function switcher(idx,dest){
  const a=APP.parentAthletes||[];
  if(a.length<=1)return'';
  return`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
    ${a.map((ath,i)=>`<div onclick="window.APP.parentAthIdx=${i};window.K.nav('${dest}')" style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:20px;cursor:pointer;border:2px solid ${i===idx?'var(--gold)':'var(--bdr)'};background:${i===idx?'rgba(181,153,106,0.1)':'var(--panel)'};transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <div class="mini-av" style="width:24px;height:24px;font-size:9px;">${ini(ath.name)}</div>
      <span style="font-size:13px;font-weight:${i===idx?700:500};color:${i===idx?'var(--gold)':'var(--t2)'};">${ath.name.split(' ')[0]}</span>
    </div>`).join('')}
  </div>`;
}

export function parentHome(){
  const aths=APP.parentAthletes||[];
  if(!aths||aths.length===0){
    return`<div class="empty-state" style="margin-top:60px;">
      <div class="es-icon">👪</div>
      <h3>Welcome to KINETIC!</h3>
      <p>Your child's account hasn't been linked yet.<br>Your gym director will connect it shortly.</p>
    </div>`;
  }

  const idx=APP.parentAthIdx||0;
  const ath=aths[Math.min(idx,aths.length-1)];
  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const inProgress=skills.filter(s=>skillMap[s.id]==='ip').length;
  const skillPct=pct(mastered,skills.length);
  const unread=(APP.messages||[]).filter(m=>!m.read&&m.fromId!==APP.user?.uid&&m.fromId!=='system').length;
  const docs=(APP.allDocuments||[]).filter(d=>{
    if(d.sharedWith==='all')return true;
    if(d.sharedWith==='athlete'&&(d.sharedWithIds||[]).includes(ath.id))return true;
    if(d.sharedWith==='class'){const mc=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));return mc.some(c=>(d.sharedWithIds||[]).includes(c.id));}
    return false;
  });
  const myClasses=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));
  const age=calcAge(ath.dob);
  const tuitionStatus=ath.tuitionStatus||'pending';
  const updated=APP.parentSkillUpdated?.[ath.id];

  return`
  ${switcher(idx,'parentHome')}

  <div style="background:linear-gradient(135deg,#1C1C1C 0%,#242424 100%);border-radius:16px;padding:24px;margin-bottom:18px;position:relative;overflow:hidden;">
    <div style="position:absolute;right:-30px;top:-30px;width:160px;height:160px;border-radius:50%;background:rgba(181,153,106,0.06);pointer-events:none;"></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#7A5A2A);display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-weight:900;font-size:20px;color:#1C1C1C;flex-shrink:0;">${ini(ath.name)}</div>
      <div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:20px;color:#FAFAF8;">${ath.name}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
          <div style="width:10px;height:10px;border-radius:50%;background:${BELT_COLORS[ath.level||'Level 1']||'#E8C84A'};"></div>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);">${ath.level||'Level 1'}</span>
          ${age!==null?`<span style="font-size:11px;color:rgba(250,250,248,0.35);">· ${age} years old</span>`:''}
        </div>
        ${myClasses.length?`<div style="font-size:11px;color:rgba(250,250,248,0.3);margin-top:3px;">${myClasses.map(c=>c.name+' · '+c.day).join('  |  ')}</div>`:''}
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(250,250,248,0.35);">Skill Progress · ${ath.level||'Level 1'}</span>
        <span style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:var(--gold);">${skillPct}%</span>
      </div>
      <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;margin-bottom:10px;">
        <div style="height:100%;border-radius:4px;background:linear-gradient(90deg,var(--gold),#C8AE86);width:${skillPct}%;transition:width 1s ease;"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        <div style="text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:#5EC85E;">${mastered}</div><div style="font-size:10px;color:rgba(250,250,248,0.35);margin-top:2px;">Mastered</div></div>
        <div style="text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:#F59E0B;">${inProgress}</div><div style="font-size:10px;color:rgba(250,250,248,0.35);margin-top:2px;">In Progress</div></div>
        <div style="text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:rgba(250,250,248,0.3);">${skills.length-(mastered+inProgress)}</div><div style="font-size:10px;color:rgba(250,250,248,0.35);margin-top:2px;">Not Yet</div></div>
      </div>
      ${updated?`<div style="font-size:10px;color:rgba(250,250,248,0.25);text-align:center;margin-top:8px;">Last updated by coach · ${fmtDate(updated)}</div>`:''}
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div onclick="window.K.nav('parentSkills')" style="background:var(--panel);border:1px solid var(--bdr);border-top:3px solid var(--gold);border-radius:12px;padding:18px;cursor:pointer;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
      <div style="font-size:26px;margin-bottom:10px;">🥋</div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;margin-bottom:4px;">Skills</div>
      <div style="font-size:12px;color:var(--t2);">${mastered}/${skills.length} mastered</div>
      <div style="font-size:11px;color:var(--gold);margin-top:4px;font-weight:600;">View Progress →</div>
    </div>

    <div onclick="window.K.nav('parentTuition')" style="background:var(--panel);border:1px solid ${tuitionStatus==='overdue'?'rgba(155,58,47,0.4)':'var(--bdr)'};border-top:3px solid ${tuitionStatus==='paid'?'#5EC85E':tuitionStatus==='overdue'?'var(--red)':'var(--gold)'};border-radius:12px;padding:18px;cursor:pointer;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
      <div style="font-size:26px;margin-bottom:10px;">💳</div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;margin-bottom:4px;">Tuition</div>
      <div style="font-size:12px;color:${tuitionStatus==='overdue'?'var(--red)':tuitionStatus==='paid'?'var(--green)':'var(--t2)'};">$${ath.tuitionAmount||185}/mo · ${tuitionStatus==='paid'?'✓ Paid':tuitionStatus==='overdue'?'⚠️ Overdue':'Pending'}</div>
      <div style="font-size:11px;color:var(--gold);margin-top:4px;font-weight:600;">View Details →</div>
    </div>

    <div onclick="window.K.nav('parentMsgs')" style="background:var(--panel);border:1px solid var(--bdr);border-top:3px solid ${unread?'var(--red)':'var(--bdr)'};border-radius:12px;padding:18px;cursor:pointer;position:relative;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
      ${unread?`<div style="position:absolute;top:12px;right:12px;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;font-family:'Barlow Condensed',sans-serif;">${unread}</div>`:''}
      <div style="font-size:26px;margin-bottom:10px;">💬</div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;margin-bottom:4px;">Messages</div>
      <div style="font-size:12px;color:${unread?'var(--red)':'var(--t2)'};">${unread?unread+' unread':'All caught up'}</div>
      <div style="font-size:11px;color:var(--gold);margin-top:4px;font-weight:600;">Open Messages →</div>
    </div>

    <div onclick="window.K.nav('parentDocuments')" style="background:var(--panel);border:1px solid var(--bdr);border-top:3px solid var(--bdr);border-radius:12px;padding:18px;cursor:pointer;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
      <div style="font-size:26px;margin-bottom:10px;">📄</div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:14px;margin-bottom:4px;">Documents</div>
      <div style="font-size:12px;color:var(--t2);">${docs.length} shared with you</div>
      <div style="font-size:11px;color:var(--gold);margin-top:4px;font-weight:600;">View Documents →</div>
    </div>
  </div>


  ${(()=>{
    const myClasses=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));
    if(!myClasses.length)return'';
    const attData=APP.parentAttendance?.[ath.id]||{};
    const sections=myClasses.map(cls=>{
      const rec=attData[cls.id]||{total:0,present:0,absent:0,sessions:[]};
      const p=rec.total>0?Math.round(rec.present/rec.total*100):null;
      const pending=(APP.makeupRequests||[]).filter(r=>r.athId===ath.id&&r.originalClassId===cls.id&&r.status==='pending').length;
      const approved=(APP.makeupRequests||[]).filter(r=>r.athId===ath.id&&r.originalClassId===cls.id&&r.status==='approved').length;
      return{cls,rec,p,pending,approved};
    });
    if(sections.every(s=>s.p===null))return'';
    return`<div style="margin-top:16px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Class Attendance</div>
      ${sections.map(({cls,rec,p,pending,approved})=>{
        if(p===null)return'';
        const pColor=p>=90?'#5EC85E':p>=70?'var(--gold)':'var(--red)';
        return`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:14px 16px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div><div style="font-size:14px;font-weight:700;">${cls.name}</div><div style="font-size:11px;color:var(--t3);">${cls.day} · ${cls.time}</div></div>
            <div style="text-align:right;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:${pColor};">${p}%</div><div style="font-size:11px;color:var(--t3);">${rec.present}/${rec.total} classes</div></div>
          </div>
          <div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden;margin-bottom:${p<100?10:0}px;"><div style="height:100%;border-radius:3px;background:${pColor};width:${p}%;"></div></div>
          ${p<100?`<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span style="font-size:12px;color:var(--t2);">${rec.absent} absence${rec.absent!==1?'s':''} on record</span>
            ${pending>0?`<span style="background:var(--y-soft);color:#8A6010;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;border:1px solid rgba(181,130,30,0.2);">⏳ ${pending} request pending</span>`:
            approved>0?`<span style="background:var(--g-soft);color:var(--green);font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;border:1px solid rgba(42,107,42,0.2);">✓ Makeup scheduled</span>`:
            `<button onclick="window._mkSel=null;window.K.openModal('makeupReqModal',{athId:'${ath.id}',athName:'${ath.name}',athLevel:'${ath.level||'Level 1'}',originalClassId:'${cls.id}',originalClassName:'${cls.name}'})" style="background:var(--gold);border:none;color:var(--sb);font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:6px 14px;border-radius:6px;cursor:pointer;">Request Makeup →</button>`}
          </div>`:``}
        </div>`;
      }).join('')}
    </div>`;
  })()}

    ${aths.length>1?`<div style="margin-top:18px;"><div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--t3);margin-bottom:10px;">Other Athletes on this Account</div><div style="display:flex;flex-direction:column;gap:6px;">${aths.filter((_,i)=>i!==idx).map((a,i)=>{const ai=aths.indexOf(a);const as2=SKILLS.filter(s=>s.level===(a.level||'Level 1'));const am=as2.filter(s=>(APP.parentSkillData?.[a.id]||{})[s.id]==='m').length;return`<div onclick="window.APP.parentAthIdx=${ai};window.K.nav('parentHome')" style="background:var(--panel);border:1px solid var(--bdr);border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--bdr)'"><div class="mini-av">${ini(a.name)}</div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">${a.name}</div><div style="font-size:11px;color:var(--t2);">${a.level||'Level 1'} · ${am}/${as2.length} skills</div></div><span style="color:var(--gold);">→</span></div>`;}).join('')}</div></div>`:``}`;
}

export function parentSkills(){
  const aths=APP.parentAthletes||[];
  const idx=Math.min(APP.parentAthIdx||0,Math.max(0,aths.length-1));
  const ath=aths[idx];
  if(!ath)return`<div class="empty-state"><div class="es-icon">🥋</div><h3>No athlete linked</h3><p>Your director will link your child's account soon.</p></div>`;
  const skills=SKILLS.filter(s=>s.level===(ath.level||'Level 1'));
  const skillMap=APP.parentSkillData?.[ath.id]||{};
  const mastered=skills.filter(s=>skillMap[s.id]==='m').length;
  const skillPct=pct(mastered,skills.length);
  const evColors={Vault:'#C25B30',Bars:'#2E5FA3',Beam:'#7B4FA0',Floor:'#2A6B2A',General:'#B5996A'};
  const events=[...new Set(skills.map(s=>s.event))];
  const updated=APP.parentSkillUpdated?.[ath.id];

  return`
  ${switcher(idx,'parentSkills')}
  <div style="background:linear-gradient(135deg,#1C1C1C,#242424);border-radius:14px;padding:20px 24px;margin-bottom:20px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;color:#FAFAF8;">${ath.name}</div>
        <div style="font-size:11px;color:rgba(250,250,248,0.4);margin-top:2px;">${ath.level||'Level 1'}${updated?` · Updated ${fmtDate(updated)}`:''}</div>
      </div>
      <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:36px;color:var(--gold);">${skillPct}%</div>
    </div>
    <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
      <div style="height:100%;border-radius:4px;background:linear-gradient(90deg,var(--gold),#C8AE86);width:${skillPct}%;transition:width 1s;"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;">
      ${[{v:mastered,l:'Mastered',c:'#5EC85E'},{v:skills.filter(s=>skillMap[s.id]==='ip').length,l:'In Progress',c:'#F59E0B'},{v:skills.length-mastered-skills.filter(s=>skillMap[s.id]==='ip').length,l:'Not Yet',c:'rgba(250,250,248,0.25)'}].map(s=>`<div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:${s.c};">${s.v}</div><div style="font-size:10px;color:rgba(250,250,248,0.35);margin-top:2px;">${s.l}</div></div>`).join('')}
    </div>
  </div>
  ${events.map(evt=>{
    const es=skills.filter(s=>s.event===evt);
    const em=es.filter(s=>skillMap[s.id]==='m').length;
    const col=evColors[evt]||'var(--gold)';
    return`<div style="background:var(--panel);border:1px solid var(--bdr);border-top:3px solid ${col};border-radius:12px;overflow:hidden;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
      <div style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;background:var(--p2);">
        <div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;">${{Vault:'🏃 Vault',Bars:'🤸 Bars',Beam:'🧘 Beam',Floor:'⭐ Floor',General:'🥋 General'}[evt]||evt}</div>
        <div style="display:flex;align-items:center;gap:8px;"><div style="width:60px;height:4px;background:var(--bg);border-radius:2px;overflow:hidden;"><div style="height:100%;border-radius:2px;background:${col};width:${pct(em,es.length)}%;"></div></div><span style="font-size:11px;font-weight:700;color:var(--t3);">${em}/${es.length}</span></div>
      </div>
      ${es.map(sk=>{
        const st=skillMap[sk.id]||'nr';
        const cfg={m:{bg:'var(--g-soft)',c:'var(--green)',b:'rgba(42,107,42,0.3)',icon:'✓',lbl:'Mastered'},ip:{bg:'var(--y-soft)',c:'#8A6010',b:'rgba(181,130,30,0.3)',icon:'~',lbl:'In Progress'},nr:{bg:'rgba(0,0,0,0.03)',c:'var(--t3)',b:'var(--bdr)',icon:'—',lbl:'Not Yet'}}[st]||{bg:'rgba(0,0,0,0.03)',c:'var(--t3)',b:'var(--bdr)',icon:'—',lbl:'Not Yet'};
        return`<div style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--bdr2);">
          <div style="flex:1;font-size:13px;font-weight:600;">${sk.name}</div>
          <div style="display:flex;align-items:center;gap:7px;"><div style="width:30px;height:30px;border-radius:50%;background:${cfg.bg};border:1.5px solid ${cfg.b};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:${cfg.c};">${cfg.icon}</div><span style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${cfg.c};">${cfg.lbl}</span></div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('')}`;
}

export function parentTuition(){
  const aths=APP.parentAthletes||[];
  if(!aths.length)return`<div class="empty-state"><div class="es-icon">💳</div><h3>No athletes linked</h3></div>`;
  const total=aths.reduce((s,a)=>s+(a.tuitionAmount||185),0);
  return`
  <div style="background:linear-gradient(135deg,#1C1C1C,#242424);border-radius:16px;padding:24px;margin-bottom:20px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(181,153,106,0.5);margin-bottom:6px;">Monthly Total</div>
    <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:44px;color:var(--gold);letter-spacing:-1px;margin-bottom:12px;">$${total.toLocaleString()}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
      ${[{n:'Paid',v:aths.filter(a=>a.tuitionStatus==='paid').length,c:'#5EC85E'},{n:'Pending',v:aths.filter(a=>!a.tuitionStatus||a.tuitionStatus==='pending').length,c:'var(--gold)'},{n:'Overdue',v:aths.filter(a=>a.tuitionStatus==='overdue').length,c:'#FF8A80'}].map(s=>`<div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;text-align:center;"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:${s.c};">${s.v}</div><div style="font-size:10px;color:rgba(250,250,248,0.35);margin-top:2px;">${s.n}</div></div>`).join('')}
    </div>
  </div>
  ${aths.map(a=>`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="mini-av" style="width:40px;height:40px;font-size:14px;">${ini(a.name)}</div>
      <div><div style="font-size:15px;font-weight:700;">${a.name}</div><div style="font-size:12px;color:var(--t2);margin-top:2px;">${a.level||'Level 1'} · ${a.billingCycle||'Monthly'}</div></div>
    </div>
    <div style="text-align:right;">
      <div style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:20px;">$${a.tuitionAmount||185}</div>
      <span class="pill ${a.tuitionStatus==='paid'?'present':a.tuitionStatus==='overdue'?'absent':'ip'}" style="margin-top:4px;">${a.tuitionStatus==='paid'?'✓ Paid':a.tuitionStatus==='overdue'?'⚠️ Overdue':'Pending'}</span>
    </div>
  </div>`).join('')}
  <div class="alert info" style="margin-top:8px;font-size:13px;">Questions? Send a message to your director and they'll get back to you quickly.</div>`;
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
  <div class="sec-hdr"><h3>Messages</h3><button class="btn primary" onclick="window.K.openModal('newMsgModal',{role:'parent'})">+ New Message</button></div>
  <div class="tab-bar">${[['unread',`Inbox${inbox.length?` (${inbox.length})`:''}`,],['read','Read'],['sent','Sent']].map(([t,l])=>`<button class="tab-btn ${tab===t?'on':''}" onclick="window.APP.msgTab='${t}';window.K.nav('parentMsgs')">${l}</button>`).join('')}</div>
  ${display.length===0?`<div class="empty-state compact"><div class="es-icon">📬</div><h3>${tab==='unread'?'No new messages':'Nothing here'}</h3></div>`
  :msgList(display,uid,'parent')}`;
}

export function parentDocuments(){
  const aths=APP.parentAthletes||[];
  const idx=Math.min(APP.parentAthIdx||0,Math.max(0,aths.length-1));
  const ath=aths[idx];
  const docs=(APP.allDocuments||[]).filter(d=>{
    if(d.sharedWith==='all')return true;
    if(d.sharedWith==='athlete'&&ath&&(d.sharedWithIds||[]).includes(ath.id))return true;
    if(d.sharedWith==='class'&&ath){const mc=(APP.allClasses||[]).filter(c=>(c.athletes||[]).includes(ath.id));return mc.some(c=>(d.sharedWithIds||[]).includes(c.id));}
    return false;
  }).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const icons={'pdf':'📄','image':'🖼️','video':'🎥','form':'📋','link':'🔗','other':'📎'};
  const typeColors={'pdf':'rgba(220,38,38,0.1)','image':'rgba(59,130,246,0.1)','video':'rgba(124,58,237,0.1)','form':'rgba(16,185,129,0.1)','link':'rgba(245,158,11,0.1)','other':'rgba(107,114,128,0.1)'};
  return`
  ${aths.length>1?switcher(idx,'parentDocuments'):''}
  <div class="sec-hdr"><h3>Documents</h3></div>
  ${docs.length===0?`<div class="empty-state"><div class="es-icon">📄</div><h3>No documents yet</h3><p>Your gym will share schedules, forms, and important documents here.</p></div>`
  :`<div style="display:flex;flex-direction:column;gap:8px;">${docs.map(d=>`<div onclick="${d.fileUrl?`window.open('${d.fileUrl}','_blank')`:'void(0)'}" style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;${d.fileUrl?'cursor:pointer;':''}transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="${d.fileUrl?"this.style.borderColor='var(--gold)'":""}" onmouseout="this.style.borderColor='var(--bdr)'">
    <div style="width:48px;height:48px;border-radius:12px;background:${typeColors[d.fileType||'other']};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${icons[d.fileType||'other']||'📎'}</div>
    <div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.name||'Document'}</div>
    ${d.description?`<div style="font-size:12px;color:var(--t2);margin-top:2px;">${d.description}</div>`:''}
    <div style="font-size:11px;color:var(--t3);margin-top:4px;">${d.createdAt?fmtDate(d.createdAt):''}</div></div>
    ${d.fileUrl?`<span style="color:var(--gold);font-size:20px;">↗</span>`:''}
  </div>`).join('')}</div>`}`;
}

export function parentRoutines(){
  const routines=(APP.allRoutines||[]).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  return`
  <div class="sec-hdr"><h3>Routines & Media</h3></div>
  ${routines.length===0?`<div class="empty-state"><div class="es-icon">🎬</div><h3>No routines yet</h3><p>Your gym will share routine videos and floor music here.</p></div>`
  :`<div style="display:flex;flex-direction:column;gap:8px;">${routines.map(r=>`<div style="background:var(--panel);border:1px solid var(--bdr);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
    <div style="width:48px;height:48px;border-radius:12px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🎬</div>
    <div style="flex:1;"><div style="font-size:15px;font-weight:700;">${r.name||'Routine'}</div>
    <div style="font-size:12px;color:var(--t2);margin-top:2px;">${r.className||'All Classes'}${r.level?' · '+r.level:''}</div>
    ${r.notes?`<div style="font-size:12px;color:var(--t3);margin-top:3px;">${r.notes}</div>`:''}</div>
    <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">${r.videoUrl?`<a href="${r.videoUrl}" target="_blank" class="btn primary" style="font-size:10px;padding:6px 12px;">▶ Watch</a>`:''} ${r.audioUrl?`<a href="${r.audioUrl}" target="_blank" class="btn" style="font-size:10px;padding:6px 12px;">♪ Listen</a>`:''}</div>
  </div>`).join('')}</div>`}`;
}

function msgList(msgs,uid,role){
  return`<div style="display:flex;flex-direction:column;gap:6px;">${msgs.map(m=>{
    const isMine=m.fromId===uid;const isUnread=!m.read&&!isMine;
    const all=window.APP?.messages||[];const idx=all.findIndex(x=>x===m||x.id===m.id);
    return`<div onclick="window.K.openModal('msgViewModal',{idx:${idx},role:'${role}'})" style="background:var(--panel);border:1px solid var(--bdr);border-left:3px solid ${isUnread?'var(--gold)':'transparent'};border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:flex-start;gap:12px;transition:all 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.04);" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'">
      <div class="mini-av" style="${isUnread?'background:linear-gradient(135deg,var(--gold),#7A5A2A);color:var(--sb);':''}">${ini(m.from||'?')}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;"><span style="font-size:13px;font-weight:${isUnread?700:500};">${isMine?'You →':m.from||'Unknown'}</span><span style="font-size:11px;color:var(--t3);">${m.time||''}</span></div>
        <div style="font-size:13px;font-weight:${isUnread?600:400};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.subject||''}</div>
        <div style="font-size:12px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${m.preview||m.body||''}</div>
      </div>
      ${isUnread?`<div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:4px;"></div>`:''}
    </div>`;
  }).join('')}</div>`;
}
