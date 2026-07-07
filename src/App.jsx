import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const T = {
  teal:'#1D9E75',tealLight:'#E1F5EE',tealMid:'#5DCAA5',
  amber:'#BA7517',amberLight:'#FAEEDA',
  coral:'#D85A30',coralLight:'#FAECE7',
  blue:'#185FA5',blueLight:'#E6F1FB',
  green:'#3B6D11',greenLight:'#EAF3DE',
  purple:'#534AB7',purpleLight:'#EEEDFE',
  gray:'#888780',grayLight:'#F1EFE8',
}
const lbl={display:'block',fontSize:12,color:T.gray,marginBottom:4,fontWeight:500}
const ADMIN_PASS='mushi2024'
const ADMIN_EMAIL='morten@hst.aau.dk'
const PROJECT_STATUS=['Planning','Data collection','Analysis','Writing','Submitted','Published']
const GRANT_STATUS=['In preparation','Submitted','Under review','Funded','Rejected']
const PUB_STATUS=['Draft','Under review','Revision requested','Accepted','Published']
const GRANT_COLORS=['#FAC775','#EF9F27','#BA7517','#854F0B','#E24B4A']
const PUB_COLORS=['#B5D4F4','#85B7EB','#378ADD','#185FA5','#1D9E75']
const monthLabel=iso=>{const[y,m]=iso.split('-');return new Date(+y,+m-1).toLocaleString('en-GB',{month:'long',year:'numeric'})}
const emptyForm=()=>({name:'',email:'',month:new Date().toISOString().slice(0,7),projects:[{title:'',status:'Analysis',progress:50,notes:''}],grants:[{title:'',funder:'',status:'In preparation',amount:'',notes:''}],publications:[{title:'',journal:'',status:'Draft',notes:''}],teaching:'',conferences:'',collaborations:'',other:'',request_meeting:false,meeting_reason:''})
const buildOutlookLink=(email,name,reason)=>{const s=encodeURIComponent(`1:1 follow-up — ${name} (MusHI)`);const b=encodeURIComponent(`Hi ${name},\n\nYou indicated you would like to discuss something in more detail.\n\n${reason?'Your note: '+reason+'\n\n':''}Please pick a time.\n\nBest,\nMorten`);return`https://outlook.office.com/calendar/deeplink/compose?subject=${s}&body=${b}&to=${encodeURIComponent(email)}`}

export default function App(){
  const[view,setView]=useState('home')
  const[form,setForm]=useState(emptyForm)
  const[submitted,setSubmitted]=useState(false)
  const[adminUnlocked,setAdminUnlocked]=useState(false)
  const[adminPassInput,setAdminPassInput]=useState('')
  const[selectedMember,setSelectedMember]=useState(null)
  const[reportMonth,setReportMonth]=useState(new Date().toISOString().slice(0,7))
  const[allSubmissions,setAllSubmissions]=useState([])
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState(null)

  const fetchAll=useCallback(async()=>{
    setLoading(true)
    const{data,error}=await supabase.from('submissions').select('*').order('submitted_at',{ascending:false})
    if(!error)setAllSubmissions(data||[])
    setLoading(false)
  },[])

  useEffect(()=>{if(adminUnlocked)fetchAll()},[adminUnlocked,fetchAll])
  useEffect(()=>{if(allSubmissions.length===0)return;const ms=[...new Set(allSubmissions.map(s=>s.month))];if(!ms.includes(reportMonth))setReportMonth(ms.sort().reverse()[0])},[allSubmissions])

  async function loadPrevious(){
    if(!form.email)return
    const{data}=await supabase.from('submissions').select('*').eq('email',form.email.toLowerCase().trim()).neq('month',form.month).order('month',{ascending:false}).limit(1)
    if(data&&data.length>0){const prev=data[0];setForm(f=>({...prev,month:f.month,request_meeting:false,meeting_reason:''}))}
  }

  async function handleSubmit(){
    if(!form.name||!form.email)return
    setLoading(true);setError(null)
    const payload={email:form.email.toLowerCase().trim(),name:form.name.trim(),month:form.month,projects:form.projects,grants:form.grants,publications:form.publications,teaching:form.teaching,conferences:form.conferences,collaborations:form.collaborations,other:form.other,request_meeting:form.request_meeting,meeting_reason:form.meeting_reason,submitted_at:new Date().toISOString()}
    const{error}=await supabase.from('submissions').upsert(payload,{onConflict:'email,month'})
    if(error){setError('Could not save. Please try again.');setLoading(false);return}
    setSubmitted(true);setLoading(false)
  }

  function setField(path,value){
    setForm(prev=>{
      const next=JSON.parse(JSON.stringify(prev))
      const parts=path.split('.')
      let obj=next
      for(let i=0;i<parts.length-1;i++){const idx=parseInt(parts[i+1]);if(!isNaN(idx)){obj=obj[parts[i]][idx];i++}else obj=obj[parts[i]]}
      obj[parts[parts.length-1]]=value
      return next
    })
  }

  function addItem(s){setForm(prev=>{const n=JSON.parse(JSON.stringify(prev));if(s==='projects')n.projects.push({title:'',status:'Analysis',progress:50,notes:''});if(s==='grants')n.grants.push({title:'',funder:'',status:'In preparation',amount:'',notes:''});if(s==='publications')n.publications.push({title:'',journal:'',status:'Draft',notes:''});return n})}
  function removeItem(s,i){setForm(prev=>{const n=JSON.parse(JSON.stringify(prev));n[s].splice(i,1);return n})}

  const props={form,setField,addItem,removeItem,loadPrevious,submitted,loading,error,handleSubmit,setSubmitted,setForm,setView,buildOutlookLink}
  if(view==='form')return<FormView {...props}/>
  if(view==='admin')return<AdminView submissions={allSubmissions} loading={loading} fetchAll={fetchAll} adminUnlocked={adminUnlocked} setAdminUnlocked={setAdminUnlocked} adminPassInput={adminPassInput} setAdminPassInput={setAdminPassInput} selectedMember={selectedMember} setSelectedMember={setSelectedMember} reportMonth={reportMonth} setReportMonth={setReportMonth} setView={setView} buildOutlookLink={buildOutlookLink}/>

  return(
    <div style={{padding:'2rem 1.5rem',maxWidth:680,margin:'0 auto'}}>
      <p style={{fontSize:11,fontWeight:500,letterSpacing:'0.08em',color:T.gray,textTransform:'uppercase',margin:'0 0 6px'}}>Aalborg University — MusHI Research Group</p>
      <h1 style={{fontSize:22,fontWeight:500,margin:'0 0 8px'}}>Research & development status</h1>
      <p style={{fontSize:14,color:T.gray,margin:'0 0 2rem',lineHeight:1.6}}>Monthly check-in for the MusHI group. Takes about 5 minutes. Your previous responses are pre-loaded — only update what has changed.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:'1.5rem'}}>
        {[['ti-folder',T.teal,T.tealLight,'Active projects'],['ti-file-invoice',T.amber,T.amberLight,'Grant applications'],['ti-book',T.blue,T.blueLight,'Publications'],['ti-school',T.green,T.greenLight,'Teaching & supervision'],['ti-presentation','#993556','#FBEAF0','Conferences'],['ti-users',T.purple,T.purpleLight,'New collaborations']].map(([icon,color,bg,label])=>(
          <div key={label} style={{background:bg,borderRadius:10,padding:'12px 14px',display:'flex',gap:10,alignItems:'center'}}>
            <i className={`ti ${icon}`} style={{fontSize:17,color}}/>
            <span style={{fontSize:13,color,fontWeight:500}}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={()=>{setSubmitted(false);setForm(emptyForm());setView('form')}} style={{flex:1,padding:'12px 0',fontSize:14,fontWeight:500,background:T.teal,color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}><i className="ti ti-edit" style={{marginRight:7}}/>Fill in this month</button>
        <button onClick={()=>setView('admin')} style={{padding:'12px 18px',fontSize:14,background:'#f5f3ee',border:'0.5px solid #d4d0c8',borderRadius:8,cursor:'pointer',color:T.gray}}><i className="ti ti-chart-bar" style={{marginRight:7}}/>Group report</button>
      </div>
    </div>
  )
}

function FormView({form,setField,addItem,removeItem,loadPrevious,submitted,loading,error,handleSubmit,setView,buildOutlookLink}){
  const[loadingPrev,setLoadingPrev]=useState(false)
  const[prevLoaded,setPrevLoaded]=useState(false)
  async function handleLoadPrev(){setLoadingPrev(true);await loadPrevious();setPrevLoaded(true);setLoadingPrev(false)}

  if(submitted)return(
    <div style={{padding:'2rem 1.5rem',maxWidth:680,margin:'0 auto'}}>
      <div style={{background:T.tealLight,borderRadius:12,padding:'2rem',textAlign:'center',marginBottom:'1.5rem'}}>
        <i className="ti ti-circle-check" style={{fontSize:40,color:T.teal,display:'block',marginBottom:12}}/>
        <p style={{fontSize:16,fontWeight:500,color:T.teal,margin:'0 0 6px'}}>Submitted — thank you, {form.name.split(' ')[0]}!</p>
        <p style={{fontSize:13,color:'#0F6E56',margin:0}}>Your response for {monthLabel(form.month)} has been saved.</p>
      </div>
      {form.request_meeting&&(
        <div style={{background:T.amberLight,borderRadius:10,padding:'1rem 1.25rem',marginBottom:'1.5rem',display:'flex',gap:12,alignItems:'center'}}>
          <i className="ti ti-calendar-plus" style={{fontSize:20,color:T.amber}}/>
          <div style={{flex:1}}><p style={{margin:'0 0 4px',fontSize:13,fontWeight:500,color:T.amber}}>You requested a 1:1 with Morten</p><p style={{margin:0,fontSize:12,color:'#854F0B'}}>Click below to open a meeting invite in Outlook.</p></div>
          <a href={buildOutlookLink(ADMIN_EMAIL,form.name,form.meeting_reason)} target="_blank" rel="noreferrer" style={{padding:'8px 14px',background:T.amber,color:'#fff',borderRadius:7,fontSize:13,textDecoration:'none',fontWeight:500,whiteSpace:'nowrap'}}><i className="ti ti-calendar" style={{marginRight:5}}/>Open in Outlook</a>
        </div>
      )}
      <button onClick={()=>setView('home')} style={{width:'100%',padding:11,fontSize:14,background:'#f5f3ee',border:'0.5px solid #d4d0c8',borderRadius:8,cursor:'pointer',color:T.gray}}>Back to home</button>
    </div>
  )

  return(
    <div style={{padding:'1.5rem',maxWidth:680,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.5rem'}}>
        <button onClick={()=>setView('home')} style={{background:'none',border:'none',cursor:'pointer',color:T.gray,padding:0}}><i className="ti ti-arrow-left" style={{fontSize:18}}/></button>
        <h2 style={{fontSize:18,fontWeight:500,margin:0}}>Monthly update — {monthLabel(form.month)}</h2>
      </div>
      <Section label="Your details" icon="ti-user" color={T.gray}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <div><label style={lbl}>Full name</label><input value={form.name} onChange={e=>setField('name',e.target.value)} placeholder="Firstname Lastname"/></div>
          <div><label style={lbl}>AAU email</label><input value={form.email} onChange={e=>setField('email',e.target.value)} placeholder="xx@hst.aau.dk"/></div>
        </div>
        <div style={{display:'flex',alignItems:'flex-end',gap:12}}>
          <div style={{flex:1}}><label style={lbl}>Reporting month</label><input type="month" value={form.month} onChange={e=>setField('month',e.target.value)}/></div>
          {form.email&&<button onClick={handleLoadPrev} disabled={loadingPrev} style={{padding:'7px 14px',fontSize:12,background:T.tealLight,color:T.teal,border:`0.5px solid ${T.tealMid}`,borderRadius:7,cursor:'pointer',fontWeight:500,whiteSpace:'nowrap'}}><i className="ti ti-refresh" style={{marginRight:5}}/>{loadingPrev?'Loading…':prevLoaded?'Reloaded ✓':'Load previous answers'}</button>}
        </div>
      </Section>
      <Section label="Active projects" icon="ti-folder" color={T.teal}>
        {form.projects.map((p,i)=>(
          <ItemCard key={i} onRemove={form.projects.length>1?()=>removeItem('projects',i):null}>
            <div style={{marginBottom:8}}><label style={lbl}>Project title</label><input value={p.title} onChange={e=>setField(`projects.${i}.title`,e.target.value)} placeholder="e.g. RESOLVE trial follow-up"/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:8}}>
              <div><label style={lbl}>Status</label><select value={p.status} onChange={e=>setField(`projects.${i}.status`,e.target.value)}>{PROJECT_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={lbl}>Progress — {p.progress}%</label><input type="range" min="0" max="100" step="5" value={p.progress} onChange={e=>setField(`projects.${i}.progress`,+e.target.value)} style={{width:'100%',marginTop:6}}/></div>
            </div>
            <div><label style={lbl}>Notes / changes since last month</label><textarea value={p.notes} onChange={e=>setField(`projects.${i}.notes`,e.target.value)} placeholder="What has changed?" rows={2} style={{resize:'vertical'}}/></div>
          </ItemCard>
        ))}
        <AddBtn onClick={()=>addItem('projects')} label="Add project"/>
      </Section>
      <Section label="Grant applications" icon="ti-file-invoice" color={T.amber}>
        {form.grants.map((g,i)=>(
          <ItemCard key={i} onRemove={form.grants.length>1?()=>removeItem('grants',i):null}>
            <div style={{marginBottom:8}}><label style={lbl}>Grant title</label><input value={g.title} onChange={e=>setField(`grants.${i}.title`,e.target.value)} placeholder="e.g. DFF — back pain heterogeneity"/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:8}}>
              <div><label style={lbl}>Funder</label><input value={g.funder} onChange={e=>setField(`grants.${i}.funder`,e.target.value)} placeholder="e.g. DFF"/></div>
              <div><label style={lbl}>Status</label><select value={g.status} onChange={e=>setField(`grants.${i}.status`,e.target.value)}>{GRANT_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={lbl}>Amount (DKK)</label><input value={g.amount} onChange={e=>setField(`grants.${i}.amount`,e.target.value)} placeholder="5.000.000"/></div>
            </div>
            <div><label style={lbl}>Notes</label><textarea value={g.notes} onChange={e=>setField(`grants.${i}.notes`,e.target.value)} placeholder="Deadline, outcome?" rows={2} style={{resize:'vertical'}}/></div>
          </ItemCard>
        ))}
        <AddBtn onClick={()=>addItem('grants')} label="Add grant"/>
      </Section>
      <Section label="Publications" icon="ti-book" color={T.blue}>
        {form.publications.map((p,i)=>(
          <ItemCard key={i} onRemove={form.publications.length>1?()=>removeItem('publications',i):null}>
            <div style={{marginBottom:8}}><label style={lbl}>Title</label><input value={p.title} onChange={e=>setField(`publications.${i}.title`,e.target.value)} placeholder="Working title"/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:8}}>
              <div><label style={lbl}>Journal</label><input value={p.journal} onChange={e=>setField(`publications.${i}.journal`,e.target.value)} placeholder="e.g. Pain"/></div>
              <div><label style={lbl}>Status</label><select value={p.status} onChange={e=>setField(`publications.${i}.status`,e.target.value)}>{PUB_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div><label style={lbl}>Notes</label><textarea value={p.notes} onChange={e=>setField(`publications.${i}.notes`,e.target.value)} rows={2} style={{resize:'vertical'}}/></div>
          </ItemCard>
        ))}
        <AddBtn onClick={()=>addItem('publications')} label="Add publication"/>
      </Section>
      {[['Teaching & supervision','ti-school',T.green,'teaching','Courses, students supervised...'],['Conferences & presentations','ti-presentation','#993556','conferences','Abstracts, talks, upcoming...'],['New projects & collaborations','ti-users',T.purple,'collaborations','New partnerships, pilot studies...'],['Other','ti-message',T.gray,'other','Anything else this month?']].map(([label,icon,color,field,ph])=>(
        <Section key={field} label={label} icon={icon} color={color}><textarea value={form[field]} onChange={e=>setField(field,e.target.value)} placeholder={ph} rows={3} style={{resize:'vertical'}}/></Section>
      ))}
      <Section label="Request a 1:1 with Morten" icon="ti-calendar-plus" color={T.coral}>
        <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
          <input type="checkbox" id="meeting" checked={form.request_meeting} onChange={e=>setField('request_meeting',e.target.checked)} style={{width:16,marginTop:2}}/>
          <label htmlFor="meeting" style={{fontSize:14,cursor:'pointer',lineHeight:1.5}}>I would like to discuss something in more detail with Morten this month</label>
        </div>
        {form.request_meeting&&<div><label style={lbl}>What would you like to discuss? (only visible to Morten)</label><textarea value={form.meeting_reason} onChange={e=>setField('meeting_reason',e.target.value)} placeholder="Grant strategy, PhD progression, collaboration idea..." rows={2} style={{resize:'vertical'}}/></div>}
      </Section>
      {error&&<p style={{color:T.coral,fontSize:13,marginBottom:10}}>{error}</p>}
      <button onClick={handleSubmit} disabled={!form.name||!form.email||loading} style={{width:'100%',padding:13,fontSize:15,fontWeight:500,background:(!form.name||!form.email||loading)?'#e8e4dc':T.teal,color:(!form.name||!form.email||loading)?T.gray:'#fff',border:'none',borderRadius:8,cursor:(!form.name||!form.email||loading)?'not-allowed':'pointer'}}>
        <i className="ti ti-send" style={{marginRight:8}}/>{loading?'Saving…':`Submit update for ${monthLabel(form.month)}`}
      </button>
    </div>
  )
}

function AdminView({submissions,loading,fetchAll,adminUnlocked,setAdminUnlocked,adminPassInput,setAdminPassInput,selectedMember,setSelectedMember,reportMonth,setReportMonth,setView,buildOutlookLink}){
  if(!adminUnlocked)return(
    <div style={{padding:'2rem 1.5rem',maxWidth:420,margin:'0 auto'}}>
      <button onClick={()=>setView('home')} style={{background:'none',border:'none',cursor:'pointer',color:T.gray,padding:'0 0 1rem',display:'flex',alignItems:'center',gap:6}}><i className="ti ti-arrow-left" style={{fontSize:16}}/><span style={{fontSize:13}}>Back</span></button>
      <h2 style={{fontSize:18,fontWeight:500,marginBottom:'1.5rem'}}>Group report — admin access</h2>
      <label style={lbl}>Password</label>
      <input type="password" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&adminPassInput===ADMIN_PASS)setAdminUnlocked(true)}} placeholder="Enter admin password" style={{marginBottom:10}}/>
      <p style={{fontSize:11,color:T.gray,marginBottom:12}}>Default: mushi2024 — change in src/App.jsx</p>
      <button onClick={()=>{if(adminPassInput===ADMIN_PASS)setAdminUnlocked(true)}} style={{width:'100%',padding:10,fontSize:14,background:T.teal,color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>Unlock</button>
    </div>
  )
  const months=[...new Set(submissions.map(s=>s.month))].sort().reverse()
  const monthSubs=submissions.filter(s=>s.month===reportMonth)
  const allMembers=[...new Map(submissions.map(s=>[s.email,s])).values()]
  const grantCounts=Object.fromEntries(GRANT_STATUS.map(s=>[s,0]))
  const pubCounts=Object.fromEntries(PUB_STATUS.map(s=>[s,0]))
  monthSubs.forEach(s=>{s.grants.forEach(g=>{if(grantCounts[g.status]!==undefined)grantCounts[g.status]++});s.publications.forEach(p=>{if(pubCounts[p.status]!==undefined)pubCounts[p.status]++})})
  const grantData=Object.entries(grantCounts).filter(([,v])=>v>0).map(([name,value])=>({name,value}))
  const pubData=Object.entries(pubCounts).filter(([,v])=>v>0).map(([name,value])=>({name,value}))
  const meetingRequests=monthSubs.filter(s=>s.request_meeting)

  if(selectedMember){
    const memberSubs=submissions.filter(s=>s.email===selectedMember).sort((a,b)=>b.month.localeCompare(a.month))
    const latest=memberSubs[0];const prev=memberSubs[1]
    return(
      <div style={{padding:'1.5rem',maxWidth:680,margin:'0 auto'}}>
        <button onClick={()=>setSelectedMember(null)} style={{background:'none',border:'none',cursor:'pointer',color:T.gray,padding:'0 0 1rem',display:'flex',alignItems:'center',gap:6}}><i className="ti ti-arrow-left" style={{fontSize:16}}/><span style={{fontSize:13}}>Back to group report</span></button>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.5rem'}}>
          <div style={{width:44,height:44,borderRadius:'50%',background:T.tealLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:600,color:T.teal}}>{latest?.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
          <div><p style={{margin:0,fontWeight:500,fontSize:16}}>{latest?.name}</p><p style={{margin:0,fontSize:12,color:T.gray}}>{latest?.email} — last update: {monthLabel(latest?.month)}</p></div>
        </div>
        {latest?.request_meeting&&(
          <div style={{background:T.amberLight,borderRadius:10,padding:'12px 16px',marginBottom:'1.5rem',display:'flex',gap:12,alignItems:'center'}}>
            <i className="ti ti-alert-circle" style={{fontSize:18,color:T.amber}}/>
            <div style={{flex:1}}><p style={{margin:'0 0 2px',fontSize:13,fontWeight:500,color:T.amber}}>Requests a 1:1 meeting</p>{latest.meeting_reason&&<p style={{margin:0,fontSize:12,color:'#854F0B'}}>{latest.meeting_reason}</p>}</div>
            <a href={buildOutlookLink(latest.email,latest.name,latest.meeting_reason)} target="_blank" rel="noreferrer" style={{padding:'7px 12px',background:T.amber,color:'#fff',borderRadius:7,fontSize:12,textDecoration:'none',fontWeight:500,whiteSpace:'nowrap'}}><i className="ti ti-calendar" style={{marginRight:5}}/>Invite in Outlook</a>
          </div>
        )}
        <h3 style={{fontSize:15,fontWeight:500,marginBottom:'1rem'}}>Projects</h3>
        {latest?.projects?.filter(p=>p.title).map((p,i)=>{
          const prevP=prev?.projects?.find(pp=>pp.title===p.title)
          const delta=prevP?p.progress-prevP.progress:null
          return(<div key={i} style={{background:'#f5f3ee',borderRadius:8,padding:'12px 14px',marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><span style={{fontSize:14,fontWeight:500}}>{p.title}</span><span style={{fontSize:12,background:T.tealLight,color:T.teal,padding:'2px 8px',borderRadius:10,fontWeight:500}}>{p.status}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{flex:1,height:6,background:'#d4d0c8',borderRadius:3}}><div style={{width:`${p.progress}%`,height:'100%',background:T.teal,borderRadius:3}}/></div><span style={{fontSize:13,fontWeight:500,minWidth:36,color:T.teal}}>{p.progress}%</span>{delta!==null&&<span style={{fontSize:11,color:delta>=0?T.teal:T.coral,fontWeight:500}}>{delta>=0?'+':''}{delta}% vs last month</span>}</div>
            {p.notes&&<p style={{margin:'8px 0 0',fontSize:12,color:T.gray,lineHeight:1.5}}>{p.notes}</p>}
          </div>)
        })}
        {latest?.grants?.filter(g=>g.title).length>0&&<><h3 style={{fontSize:15,fontWeight:500,margin:'1.5rem 0 1rem'}}>Grants</h3>{latest.grants.filter(g=>g.title).map((g,i)=><div key={i} style={{background:T.amberLight,borderRadius:8,padding:'12px 14px',marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:14,fontWeight:500,color:'#633806'}}>{g.title}</span><span style={{fontSize:12,background:'#fff',color:T.amber,padding:'2px 8px',borderRadius:10,fontWeight:500,border:`0.5px solid ${T.amber}`}}>{g.status}</span></div><p style={{margin:0,fontSize:12,color:'#854F0B'}}>{g.funder}{g.amount?` — ${g.amount} DKK`:''}</p>{g.notes&&<p style={{margin:'6px 0 0',fontSize:12,color:'#854F0B'}}>{g.notes}</p>}</div>)}</>}
        {latest?.publications?.filter(p=>p.title).length>0&&<><h3 style={{fontSize:15,fontWeight:500,margin:'1.5rem 0 1rem'}}>Publications</h3>{latest.publications.filter(p=>p.title).map((p,i)=><div key={i} style={{background:T.blueLight,borderRadius:8,padding:'12px 14px',marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:14,fontWeight:500,color:'#042C53'}}>{p.title}</span><span style={{fontSize:12,background:'#fff',color:T.blue,padding:'2px 8px',borderRadius:10,fontWeight:500,border:`0.5px solid ${T.blue}`}}>{p.status}</span></div>{p.journal&&<p style={{margin:0,fontSize:12,color:T.blue}}>{p.journal}</p>}{p.notes&&<p style={{margin:'6px 0 0',fontSize:12,color:T.blue}}>{p.notes}</p>}</div>)}</>}
        {[['Teaching & supervision',latest?.teaching],['Conferences',latest?.conferences],['Collaborations',latest?.collaborations],['Other',latest?.other]].filter(([,v])=>v).map(([label,val])=><div key={label} style={{marginTop:'1rem'}}><p style={{fontSize:13,fontWeight:500,margin:'0 0 4px',color:T.gray}}>{label}</p><p style={{fontSize:13,lineHeight:1.6,margin:0}}>{val}</p></div>)}
      </div>
    )
  }

  return(
    <div style={{padding:'1.5rem',maxWidth:680,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.5rem'}}>
        <button onClick={()=>setView('home')} style={{background:'none',border:'none',cursor:'pointer',color:T.gray,padding:0}}><i className="ti ti-arrow-left" style={{fontSize:18}}/></button>
        <h2 style={{fontSize:18,fontWeight:500,margin:0,flex:1}}>Group report — MusHI</h2>
        <button onClick={fetchAll} style={{background:'none',border:'none',cursor:'pointer',color:T.gray,padding:4}}><i className="ti ti-refresh" style={{fontSize:16}}/></button>
        <select value={reportMonth} onChange={e=>setReportMonth(e.target.value)} style={{fontSize:13,width:'auto'}}>
          {months.length===0&&<option value={reportMonth}>{monthLabel(reportMonth)}</option>}
          {months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:'1.5rem'}}>
        {[['Responses',monthSubs.length,T.teal,'ti-users'],['Active grants',monthSubs.reduce((n,s)=>n+s.grants.filter(g=>g.title).length,0),T.amber,'ti-file-invoice'],['Meeting requests',meetingRequests.length,T.coral,'ti-calendar-plus']].map(([label,val,color,icon])=>(
          <div key={label} style={{background:'#f5f3ee',borderRadius:8,padding:'14px 16px',textAlign:'center'}}>
            <i className={`ti ${icon}`} style={{fontSize:20,color,display:'block',marginBottom:6}}/>
            <p style={{fontSize:22,fontWeight:500,margin:'0 0 2px',color}}>{val}</p>
            <p style={{fontSize:12,color:T.gray,margin:0}}>{label}</p>
          </div>
        ))}
      </div>
      {meetingRequests.length>0&&(
        <div style={{background:T.amberLight,borderRadius:10,padding:'1rem 1.25rem',marginBottom:'1.5rem'}}>
          <p style={{fontSize:13,fontWeight:500,color:T.amber,margin:'0 0 10px'}}><i className="ti ti-calendar-plus" style={{marginRight:6}}/>1:1 meeting requests</p>
          {meetingRequests.map((s,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:i<meetingRequests.length-1?8:0}}><span style={{flex:1,fontSize:13,color:'#633806'}}>{s.name}{s.meeting_reason?` — "${s.meeting_reason}"`:''}</span><a href={buildOutlookLink(s.email,s.name,s.meeting_reason)} target="_blank" rel="noreferrer" style={{padding:'5px 10px',background:T.amber,color:'#fff',borderRadius:7,fontSize:11,textDecoration:'none',fontWeight:500}}><i className="ti ti-calendar" style={{marginRight:4}}/>Outlook</a></div>)}
        </div>
      )}
      {grantData.length>0&&<div style={{background:'#fff',border:'0.5px solid #d4d0c8',borderRadius:10,padding:'1rem 1.25rem',marginBottom:'1.5rem'}}><p style={{fontSize:13,fontWeight:500,margin:'0 0 1rem'}}><i className="ti ti-file-invoice" style={{marginRight:6,color:T.amber}}/>Grant pipeline</p><ResponsiveContainer width="100%" height={140}><BarChart data={grantData} margin={{top:0,right:0,left:-20,bottom:0}}><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} allowDecimals={false}/><Tooltip/><Bar dataKey="value" radius={[3,3,0,0]}>{grantData.map((_,i)=><Cell key={i} fill={GRANT_COLORS[i%GRANT_COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>}
      {pubData.length>0&&<div style={{background:'#fff',border:'0.5px solid #d4d0c8',borderRadius:10,padding:'1rem 1.25rem',marginBottom:'1.5rem'}}><p style={{fontSize:13,fontWeight:500,margin:'0 0 1rem'}}><i className="ti ti-book" style={{marginRight:6,color:T.blue}}/>Publication pipeline</p><ResponsiveContainer width="100%" height={140}><BarChart data={pubData} margin={{top:0,right:0,left:-20,bottom:0}}><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} allowDecimals={false}/><Tooltip/><Bar dataKey="value" radius={[3,3,0,0]}>{pubData.map((_,i)=><Cell key={i} fill={PUB_COLORS[i%PUB_COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>}
      <h3 style={{fontSize:15,fontWeight:500,margin:'0 0 12px'}}>Individual responses</h3>
      {loading&&<p style={{fontSize:13,color:T.gray}}>Loading…</p>}
      {!loading&&allMembers.length===0&&<p style={{fontSize:13,color:T.gray}}>No submissions yet.</p>}
      {allMembers.map(s=>{
        const thisMonth=monthSubs.find(m=>m.email===s.email)
        return(<button key={s.email} onClick={()=>setSelectedMember(s.email)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'12px 14px',marginBottom:8,background:'#fff',border:'0.5px solid #d4d0c8',borderRadius:8,cursor:'pointer',textAlign:'left'}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:thisMonth?T.tealLight:T.grayLight,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600,color:thisMonth?T.teal:T.gray,flexShrink:0}}>{s.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
          <div style={{flex:1}}><p style={{margin:0,fontSize:14,fontWeight:500}}>{s.name}</p><p style={{margin:0,fontSize:12,color:T.gray}}>{thisMonth?`Submitted for ${monthLabel(reportMonth)}`:`Last update: ${monthLabel(s.month)}`}</p></div>
          {thisMonth?.request_meeting&&<span style={{fontSize:11,background:T.amberLight,color:T.amber,padding:'3px 8px',borderRadius:10,fontWeight:500,border:`0.5px solid ${T.amber}`}}>Meeting requested</span>}
          {!thisMonth&&<span style={{fontSize:11,background:T.coralLight,color:T.coral,padding:'3px 8px',borderRadius:10,fontWeight:500}}>Not submitted</span>}
          <i className="ti ti-chevron-right" style={{fontSize:16,color:T.gray}}/>
        </button>)
      })}
    </div>
  )
}

function Section({label,icon,color,children}){return(<div style={{marginBottom:'1.5rem'}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,paddingBottom:8,borderBottom:'0.5px solid #e8e4dc'}}><i className={`ti ${icon}`} style={{fontSize:16,color}}/><span style={{fontSize:14,fontWeight:500,color}}>{label}</span></div>{children}</div>)}
function ItemCard({children,onRemove}){return(<div style={{background:'#f5f3ee',borderRadius:8,padding:'12px 14px',marginBottom:10,position:'relative'}}>{onRemove&&<button onClick={onRemove} style={{position:'absolute',top:10,right:10,background:'none',border:'none',cursor:'pointer',color:T.gray,padding:2}}><i className="ti ti-x" style={{fontSize:14}}/></button>}{children}</div>)}
function AddBtn({onClick,label}){return(<button onClick={onClick} style={{width:'100%',padding:'8px 0',fontSize:13,background:'none',border:'0.5px dashed #d4d0c8',borderRadius:8,cursor:'pointer',color:T.gray}}><i className="ti ti-plus" style={{fontSize:13,marginRight:5}}/>{label}</button>)}
