import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, CalendarCheck, BarChart3,
  Clock, FileText, BookOpen, MessageSquare, Settings,
  Bell, Search, ChevronDown, TrendingUp, Star,
  CheckCircle2, XCircle, Minus, UserPlus, Upload,
  FileBarChart, Activity, Zap, RefreshCw, LogOut,
  Eye, EyeOff, BookMarked, GraduationCap, Shield,
  Link, Trash2, PlusCircle, Mail
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { getStudents, addStudent, deleteStudent, getAttendance, markAttendance } from './api'

const C = {
  purple: '#8b5cf6', purpleBright: '#a78bfa',
  cyan: '#22d3ee', pink: '#f472b6',
  green: '#10b981', amber: '#f59e0b',
  text: '#f1f5f9', muted: '#94a3b8',
}
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat']
const PIE_COLORS = [C.green, C.cyan, C.amber, C.pink]
const TEACHER_PASSWORD = 'teacher123'
const MATERIALS_KEY = 'attendx_materials'

const getMaterials = () => { try { return JSON.parse(localStorage.getItem(MATERIALS_KEY)||'[]') } catch { return [] } }
const saveMaterials = (m) => localStorage.setItem(MATERIALS_KEY, JSON.stringify(m))

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  date.setHours(0, 0, 0, 0)
  return date
}
function buildWeeklyData(attendance) {
  const monday = getMonday(new Date())
  return DAYS.map((label, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i)
    const ds = toLocalDateStr(d)
    const recs = attendance.filter(a => a.date === ds)
    return { label, pct: recs.length === 0 ? null : Math.round((recs.filter(a => a.present).length / recs.length) * 100) }
  })
}
function buildPieData(students, attendance) {
  const b = { '90-100%':0, '75-89%':0, '50-74%':0, 'Below 50%':0 }
  students.forEach(s => {
    const r = attendance.filter(a => a.student?.id === s.id)
    if (!r.length) return
    const p = (r.filter(a => a.present).length / r.length) * 100
    if (p >= 90) b['90-100%']++
    else if (p >= 75) b['75-89%']++
    else if (p >= 50) b['50-74%']++
    else b['Below 50%']++
  })
  return Object.entries(b).map(([name, value]) => ({ name, value }))
}

const LETTERS = ['K8S','λ','∑','API','CI','CD','GIT','AWS','SQL','JWT','ENV','POD','01','10','404','200','∞','⌘']
function AnimatedBackground() {
  const items = Array.from({length:20},(_,i)=>({
    id:i, char:LETTERS[i%LETTERS.length],
    left:`${(i*4.7+3)%94}%`,
    size:Math.floor(Math.random()*24)+20,
    delay:i*1.3, duration:Math.floor(Math.random()*12)+16,
    color:[C.purple,C.cyan,C.pink,C.amber,C.purpleBright][i%5],
  }))
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,overflow:'hidden',pointerEvents:'none'}}>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(139,92,246,0.18) 1px,transparent 1px)',backgroundSize:'32px 32px',animation:'gridScroll 6s linear infinite'}}/>
      <div style={{position:'absolute',width:800,height:800,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.22) 0%,transparent 60%)',top:-300,left:'0%',animation:'orbFloat1 24s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:700,height:700,borderRadius:'50%',background:'radial-gradient(circle,rgba(34,211,238,0.16) 0%,transparent 60%)',bottom:-200,right:'5%',animation:'orbFloat2 30s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(244,114,182,0.12) 0%,transparent 60%)',top:'45%',left:'42%',animation:'orbFloat3 20s ease-in-out infinite'}}/>
      {items.map(p=>(
        <div key={p.id} style={{position:'absolute',left:p.left,bottom:-80,fontSize:p.size,fontWeight:700,color:p.color,fontFamily:'JetBrains Mono,monospace',opacity:0,animation:`letterFloat ${p.duration}s ${p.delay}s linear infinite`,userSelect:'none',textShadow:`0 0 ${p.size}px ${p.color}`,letterSpacing:2}}>{p.char}</div>
      ))}
      <div style={{position:'absolute',top:0,right:0,width:350,height:350,background:'radial-gradient(circle at top right,rgba(34,211,238,0.1),transparent 60%)'}}/>
      <div style={{position:'absolute',bottom:0,left:0,width:350,height:350,background:'radial-gradient(circle at bottom left,rgba(139,92,246,0.1),transparent 60%)'}}/>
    </div>
  )
}

function Toast({msg,type}) {
  if (!msg) return null
  return (
    <div style={{position:'fixed',bottom:22,right:22,zIndex:200,background:type==='error'?'rgba(244,114,182,0.15)':'rgba(16,185,129,0.15)',border:`1px solid ${type==='error'?'rgba(244,114,182,0.5)':'rgba(16,185,129,0.5)'}`,borderRadius:10,padding:'11px 18px',color:type==='error'?C.pink:C.green,fontSize:13,fontWeight:600,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',backdropFilter:'blur(12px)'}}>
      {msg}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE — teacher login with name, student login with gmail
// ══════════════════════════════════════════════════════════════════════════════
function LandingPage({ onTeacherLogin, onStudentLogin, students }) {
  const [modal, setModal]           = useState(null)
  // teacher
  const [teacherName, setTeacherName] = useState('')
  const [password, setPassword]       = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [teacherError, setTeacherError] = useState('')
  // student — two steps
  const [selectedId, setSelectedId]   = useState('')
  const [gmail, setGmail]             = useState('')
  const [showGmail, setShowGmail]     = useState(false)
  const [gmailError, setGmailError]   = useState('')
  const [step, setStep]               = useState(1) // 1 = pick name, 2 = enter gmail

  const resetTeacher = () => { setTeacherName(''); setPassword(''); setTeacherError(''); setShowPass(false) }
  const resetStudent = () => { setSelectedId(''); setGmail(''); setGmailError(''); setShowGmail(false); setStep(1) }

  const handleTeacherSubmit = () => {
    if (!teacherName.trim()) { setTeacherError('Please enter your name'); return }
    if (password !== TEACHER_PASSWORD) { setTeacherError('Incorrect password'); return }
    onTeacherLogin(teacherName.trim())
    setModal(null); resetTeacher()
  }

  const handleStudentNext = () => {
    if (!selectedId) return
    setStep(2)
  }

  const handleStudentLogin = () => {
    const s = students.find(s => s.id === Number(selectedId))
    if (!s) return
    if (!s.email) { setGmailError('No Gmail set for this account. Contact your teacher.'); return }
    if (gmail.trim().toLowerCase() !== s.email.trim().toLowerCase()) {
      setGmailError('Gmail does not match. Try again.')
      return
    }
    onStudentLogin(s)
    setModal(null); resetStudent()
  }

  const selectedStudent = students.find(s => s.id === Number(selectedId))

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',padding:24}}>
      <AnimatedBackground/>
      <div style={{position:'relative',zIndex:1,textAlign:'center',maxWidth:700,width:'100%'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#7c3aed,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 30px rgba(124,58,237,0.7)'}}><Zap size={26} color="#fff"/></div>
          <div style={{textAlign:'left'}}>
            <div style={{fontWeight:800,fontSize:32,letterSpacing:3,color:C.text}}>ATTENDX</div>
            <div style={{fontSize:11,color:C.muted,letterSpacing:3}}>STUDENT SYSTEM</div>
          </div>
        </div>
        <p style={{color:C.muted,fontSize:15,marginBottom:52,letterSpacing:0.5}}>Select your role to continue</p>
        <div style={{display:'flex',gap:20,justifyContent:'center',flexWrap:'wrap'}}>
          {/* Teacher Card */}
          <button onClick={()=>{setModal('teacher');resetTeacher()}} style={{flex:1,minWidth:240,maxWidth:300,padding:'36px 24px',background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.3)',borderRadius:16,cursor:'pointer',transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(139,92,246,0.18)';e.currentTarget.style.borderColor='rgba(139,92,246,0.6)';e.currentTarget.style.transform='translateY(-4px)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(139,92,246,0.08)';e.currentTarget.style.borderColor='rgba(139,92,246,0.3)';e.currentTarget.style.transform='translateY(0)'}}>
            <div style={{width:64,height:64,borderRadius:16,background:'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(139,92,246,0.1))',border:'1px solid rgba(139,92,246,0.4)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(139,92,246,0.3)'}}><Shield size={30} color={C.purple}/></div>
            <div><div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:6}}>Teacher</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>Full access — manage students,<br/>mark attendance, view analytics</div></div>
            <div style={{fontSize:11,color:C.purple,border:'1px solid rgba(139,92,246,0.3)',borderRadius:6,padding:'4px 12px'}}>ADMIN ACCESS</div>
          </button>
          {/* Student Card */}
          <button onClick={()=>{setModal('student');resetStudent()}} style={{flex:1,minWidth:240,maxWidth:300,padding:'36px 24px',background:'rgba(34,211,238,0.06)',border:'1px solid rgba(34,211,238,0.25)',borderRadius:16,cursor:'pointer',transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(34,211,238,0.14)';e.currentTarget.style.borderColor='rgba(34,211,238,0.5)';e.currentTarget.style.transform='translateY(-4px)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(34,211,238,0.06)';e.currentTarget.style.borderColor='rgba(34,211,238,0.25)';e.currentTarget.style.transform='translateY(0)'}}>
            <div style={{width:64,height:64,borderRadius:16,background:'linear-gradient(135deg,rgba(34,211,238,0.2),rgba(34,211,238,0.05))',border:'1px solid rgba(34,211,238,0.3)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(34,211,238,0.2)'}}><GraduationCap size={30} color={C.cyan}/></div>
            <div><div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:6}}>Student</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>View your attendance,<br/>access study materials</div></div>
            <div style={{fontSize:11,color:C.cyan,border:'1px solid rgba(34,211,238,0.25)',borderRadius:6,padding:'4px 12px'}}>READ ONLY</div>
          </button>
        </div>
        <div style={{marginTop:48,fontSize:11,color:C.muted}}>AttendX v1.0 · Spring Boot + React · Docker Ready</div>
      </div>

      {/* ── Teacher Modal ── */}
      {modal==='teacher' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,backdropFilter:'blur(8px)'}}>
          <div className="card" style={{width:400,padding:32,boxShadow:'0 0 60px rgba(139,92,246,0.3)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22}}><Shield size={20} color={C.purple}/><div style={{fontSize:17,fontWeight:700,color:C.text}}>Teacher Login</div></div>

            {/* Name field */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:6,fontWeight:700,letterSpacing:1.5}}>YOUR NAME</div>
              <input value={teacherName} onChange={e=>{setTeacherName(e.target.value);setTeacherError('')}} placeholder="e.g. Ejaz Shaikh" autoFocus
                style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(139,92,246,0.22)',borderRadius:8,padding:'10px 13px',color:C.text,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}}/>
            </div>

            {/* Password field */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:6,fontWeight:700,letterSpacing:1.5}}>PASSWORD</div>
              <div style={{position:'relative'}}>
                <input type={showPass?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setTeacherError('')}} onKeyDown={e=>e.key==='Enter'&&handleTeacherSubmit()} placeholder="Enter teacher password"
                  style={{width:'100%',background:'rgba(255,255,255,0.04)',border:`1px solid ${teacherError?'rgba(244,114,182,0.5)':'rgba(139,92,246,0.22)'}`,borderRadius:8,padding:'10px 40px 10px 13px',color:C.text,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}}/>
                <button onClick={()=>setShowPass(!showPass)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.muted}}>
                  {showPass?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>

            {teacherError && <div style={{fontSize:12,color:C.pink,marginBottom:12}}>{teacherError}</div>}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setModal(null);resetTeacher()}} style={{flex:1,padding:10,borderRadius:8,border:'1px solid rgba(139,92,246,0.2)',background:'none',color:C.muted,cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:13}}>Cancel</button>
              <button onClick={handleTeacherSubmit} style={{flex:1,padding:10,borderRadius:8,border:'none',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',cursor:'pointer',fontWeight:600,fontFamily:'Inter,sans-serif',fontSize:13,boxShadow:'0 0 20px rgba(124,58,237,0.4)'}}>Enter Dashboard</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Modal ── */}
      {modal==='student' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,backdropFilter:'blur(8px)'}}>
          <div className="card" style={{width:400,padding:32,boxShadow:'0 0 60px rgba(34,211,238,0.2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22}}>
              <GraduationCap size={20} color={C.cyan}/>
              <div>
                <div style={{fontSize:17,fontWeight:700,color:C.text}}>Student Login</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>Step {step} of 2 — {step===1?'Select your name':'Enter your Gmail'}</div>
              </div>
            </div>

            {step===1 ? (
              <>
                <div style={{fontSize:10,color:C.muted,marginBottom:6,fontWeight:700,letterSpacing:1.5}}>SELECT YOUR NAME</div>
                {students.length===0 ? (
                  <div style={{color:C.muted,fontSize:13,padding:'16px 0',textAlign:'center'}}>No students registered yet.<br/>Ask your teacher to add you first.</div>
                ) : (
                  <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} style={{width:'100%',background:'rgba(13,17,27,0.9)',border:'1px solid rgba(34,211,238,0.25)',borderRadius:8,padding:'10px 13px',color:selectedId?C.text:C.muted,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none',marginBottom:16,cursor:'pointer'}}>
                    <option value="">— Choose your name —</option>
                    {students.map(s=>(<option key={s.id} value={s.id} style={{background:'#0d1117',color:C.text}}>{s.name} ({s.batch})</option>))}
                  </select>
                )}
                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>{setModal(null);resetStudent()}} style={{flex:1,padding:10,borderRadius:8,border:'1px solid rgba(34,211,238,0.2)',background:'none',color:C.muted,cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:13}}>Cancel</button>
                  <button onClick={handleStudentNext} disabled={!selectedId} style={{flex:1,padding:10,borderRadius:8,border:'none',background:selectedId?'linear-gradient(135deg,#0891b2,#06b6d4)':'rgba(255,255,255,0.05)',color:selectedId?'#fff':C.muted,cursor:selectedId?'pointer':'not-allowed',fontWeight:600,fontFamily:'Inter,sans-serif',fontSize:13}}>Next →</button>
                </div>
              </>
            ) : (
              <>
                {/* Step 2 — Gmail */}
                <div style={{background:'rgba(34,211,238,0.06)',border:'1px solid rgba(34,211,238,0.15)',borderRadius:8,padding:'10px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(34,211,238,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:C.cyan,flexShrink:0}}>
                    {selectedStudent?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{selectedStudent?.name}</div>
                    <div style={{fontSize:10,color:C.muted}}>{selectedStudent?.batch}</div>
                  </div>
                </div>

                <div style={{fontSize:10,color:C.muted,marginBottom:6,fontWeight:700,letterSpacing:1.5}}>YOUR GMAIL ADDRESS</div>
                <div style={{position:'relative',marginBottom:14}}>
                  <Mail size={14} color={C.muted} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
                  <input
                    type={showGmail?'text':'password'}
                    value={gmail}
                    onChange={e=>{setGmail(e.target.value);setGmailError('')}}
                    onKeyDown={e=>e.key==='Enter'&&handleStudentLogin()}
                    placeholder="yourname@gmail.com"
                    autoFocus
                    style={{width:'100%',background:'rgba(255,255,255,0.04)',border:`1px solid ${gmailError?'rgba(244,114,182,0.5)':'rgba(34,211,238,0.22)'}`,borderRadius:8,padding:'10px 40px 10px 36px',color:C.text,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}}
                  />
                  <button onClick={()=>setShowGmail(!showGmail)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.muted}}>
                    {showGmail?<EyeOff size={14}/>:<Eye size={14}/>}
                  </button>
                </div>
                {gmailError && <div style={{fontSize:12,color:C.pink,marginBottom:12}}>{gmailError}</div>}
                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>setStep(1)} style={{flex:1,padding:10,borderRadius:8,border:'1px solid rgba(34,211,238,0.2)',background:'none',color:C.muted,cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:13}}>← Back</button>
                  <button onClick={handleStudentLogin} style={{flex:1,padding:10,borderRadius:8,border:'none',background:'linear-gradient(135deg,#0891b2,#06b6d4)',color:'#fff',cursor:'pointer',fontWeight:600,fontFamily:'Inter,sans-serif',fontSize:13}}>Login</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const TEACHER_NAV = [
  { icon:LayoutDashboard, label:'Dashboard',  id:'dashboard'  },
  { icon:Users,           label:'Students',   id:'students'   },
  { icon:CalendarCheck,   label:'Attendance', id:'attendance' },
  { icon:BarChart3,       label:'Analytics',  id:'analytics'  },
  { icon:BookMarked,      label:'Materials',  id:'materials'  },
  { icon:FileText,        label:'Reports',    id:'reports'    },
  { icon:Settings,        label:'Settings',   id:'settings'   },
]
const STUDENT_NAV = [
  { icon:LayoutDashboard, label:'Dashboard',  id:'dashboard'  },
  { icon:CalendarCheck,   label:'Attendance', id:'attendance' },
  { icon:BookMarked,      label:'Materials',  id:'materials'  },
  { icon:MessageSquare,   label:'Messages',   id:'messages'   },
]

function Sidebar({ active, setActive, role, name, onLogout }) {
  const nav = role==='teacher' ? TEACHER_NAV : STUDENT_NAV
  const accent = role==='teacher' ? C.purple : C.cyan
  const accentBg = role==='teacher' ? 'rgba(139,92,246,0.2)' : 'rgba(34,211,238,0.15)'
  return (
    <aside className="sidebar" style={{width:220,minHeight:'100vh',background:'rgba(5,7,14,0.97)',borderRight:'1px solid rgba(139,92,246,0.15)',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,zIndex:50,backdropFilter:'blur(20px)'}}>
      <div style={{padding:'22px 20px 18px',borderBottom:'1px solid rgba(139,92,246,0.12)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 22px rgba(124,58,237,0.65)'}}><Zap size={18} color="#fff"/></div>
          <div><div style={{fontWeight:800,fontSize:16,letterSpacing:2,color:C.text}}>ATTENDX</div><div style={{fontSize:9,color:C.muted,letterSpacing:2.5}}>STUDENT SYSTEM</div></div>
        </div>
      </div>
      <div style={{padding:'14px 0',flex:1,overflowY:'auto'}}>
        <div style={{fontSize:9,color:C.muted,letterSpacing:2.5,padding:'0 20px 8px',fontWeight:700}}>MAIN MENU</div>
        {nav.map(({icon:Icon,label,id})=>(
          <button key={id} onClick={()=>setActive(id)} style={{width:'100%',display:'flex',alignItems:'center',gap:11,padding:'9px 20px',border:'none',cursor:'pointer',fontSize:13,fontWeight:active===id?600:400,fontFamily:'Inter,sans-serif',color:active===id?accent:C.muted,borderLeft:active===id?`3px solid ${accent}`:'3px solid transparent',background:active===id?accentBg:'transparent',transition:'all 0.15s'}}>
            <Icon size={15}/>{label}
          </button>
        ))}
      </div>
      <div style={{padding:14,borderTop:'1px solid rgba(139,92,246,0.12)'}}>
        <div style={{display:'flex',alignItems:'center',gap:9,background:'rgba(139,92,246,0.08)',borderRadius:10,padding:'9px 11px',border:'1px solid rgba(139,92,246,0.15)'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:`linear-gradient(135deg,${role==='teacher'?'#7c3aed,#4f46e5':'#0891b2,#06b6d4'})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff'}}>{name.charAt(0).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
            <div style={{fontSize:10,color:role==='teacher'?C.green:C.cyan}}>{role==='teacher'?'● Admin Access':'● Student'}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{width:'100%',marginTop:8,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'8px',borderRadius:8,background:'rgba(244,114,182,0.08)',border:'1px solid rgba(244,114,182,0.2)',color:C.pink,cursor:'pointer',fontSize:12,fontFamily:'Inter,sans-serif'}}>
          <LogOut size={13}/> Sign Out
        </button>
      </div>
    </aside>
  )
}

function Topbar({ name, role }) {
  return (
    <header style={{height:58,background:'rgba(5,7,14,0.88)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(139,92,246,0.12)',display:'flex',alignItems:'center',gap:14,padding:'0 22px',position:'sticky',top:0,zIndex:40}}>
      <div style={{flex:1,display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.04)',borderRadius:8,border:'1px solid rgba(139,92,246,0.15)',padding:'7px 13px',maxWidth:380}}>
        <Search size={13} color={C.muted}/>
        <input placeholder="Search anything..." style={{background:'none',border:'none',outline:'none',color:C.text,fontSize:13,fontFamily:'Inter,sans-serif',flex:1}}/>
        <span style={{fontSize:10,color:C.muted,fontFamily:'JetBrains Mono,monospace'}}>⌘K</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginLeft:'auto'}}>
        <div style={{position:'relative'}}><Bell size={17} color={C.muted}/><span style={{position:'absolute',top:-6,right:-6,background:C.pink,borderRadius:'50%',width:15,height:15,fontSize:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>3</span></div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:`linear-gradient(135deg,${role==='teacher'?'#7c3aed,#4f46e5':'#0891b2,#06b6d4'})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff'}}>{name.charAt(0).toUpperCase()}</div>
          <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{name}</div><div style={{fontSize:10,color:C.muted,textTransform:'capitalize'}}>{role}</div></div>
          <ChevronDown size={13} color={C.muted}/>
        </div>
      </div>
    </header>
  )
}

function StatCard({label,value,sub,icon:Icon,accent,iconBg}) {
  return (
    <div className="card" style={{borderTop:`2px solid ${accent}`,padding:'15px 16px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:9,color:accent,fontWeight:700,letterSpacing:1.8,marginBottom:9,whiteSpace:'nowrap'}}>{label}</div>
          <div style={{fontSize:28,fontWeight:700,color:C.text,lineHeight:1,fontFamily:'JetBrains Mono,monospace'}}>{value}</div>
          {sub&&<div style={{fontSize:11,color:C.green,marginTop:7}}>↑ {sub}</div>}
        </div>
        <div style={{width:40,height:40,borderRadius:10,background:iconBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon size={19} color={accent}/></div>
      </div>
    </div>
  )
}

// AddStudentModal now includes Gmail field
function AddStudentModal({onAdd,onClose}) {
  const [name,setName]   = useState('')
  const [batch,setBatch] = useState('')
  const [email,setEmail] = useState('')
  const [loading,setLoad] = useState(false)
  const submit = async () => {
    if (!name.trim()||!batch.trim()||!email.trim()) return
    setLoad(true)
    try { await onAdd({name:name.trim(),batch:batch.trim(),email:email.trim().toLowerCase()}); onClose() }
    finally { setLoad(false) }
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,backdropFilter:'blur(8px)'}}>
      <div className="card" style={{width:440,padding:30,boxShadow:'0 0 60px rgba(139,92,246,0.3)'}}>
        <div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:22}}>Add New Student</div>
        {[
          {label:'Full Name',value:name,  set:setName,  ph:'e.g. Arjun Mehta',  type:'text'},
          {label:'Batch',    value:batch, set:setBatch, ph:'e.g. B5-A',          type:'text'},
          {label:'Gmail (used as login password)', value:email, set:setEmail, ph:'student@gmail.com', type:'email'},
        ].map(({label,value,set,ph,type})=>(
          <div key={label} style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:5,fontWeight:700,letterSpacing:1.5}}>{label.toUpperCase()}</div>
            <input type={type} value={value} onChange={e=>set(e.target.value)} placeholder={ph} onKeyDown={e=>e.key==='Enter'&&submit()}
              style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(139,92,246,0.22)',borderRadius:8,padding:'9px 13px',color:C.text,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}}/>
          </div>
        ))}
        <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:8,padding:'8px 12px',marginBottom:14,fontSize:11,color:C.amber}}>
          ⚠ The Gmail is used as the student's login password. Share it only with the student.
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:10,borderRadius:8,border:'1px solid rgba(139,92,246,0.2)',background:'none',color:C.muted,cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:13}}>Cancel</button>
          <button onClick={submit} disabled={loading||!name.trim()||!batch.trim()||!email.trim()} style={{flex:1,padding:10,borderRadius:8,border:'none',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',cursor:'pointer',fontWeight:600,fontFamily:'Inter,sans-serif',fontSize:13,boxShadow:'0 0 20px rgba(124,58,237,0.4)',opacity:(!name.trim()||!batch.trim()||!email.trim())?0.5:1}}>
            {loading?'Adding...':'Add Student'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddMaterialModal({onAdd,onClose,accentColor='cyan'}) {
  const [title,setTitle]=useState(''); const [desc,setDesc]=useState(''); const [url,setUrl]=useState('')
  const isCyan=accentColor==='cyan'
  const borderColor=isCyan?'rgba(34,211,238,0.2)':'rgba(139,92,246,0.22)'
  const btnBg=isCyan?'linear-gradient(135deg,#0891b2,#06b6d4)':'linear-gradient(135deg,#7c3aed,#4f46e5)'
  const submit=()=>{ if(!title.trim()) return; onAdd({id:Date.now(),title:title.trim(),desc:desc.trim(),url:url.trim(),date:new Date().toLocaleDateString()}); onClose() }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,backdropFilter:'blur(8px)'}}>
      <div className="card" style={{width:440,padding:30,boxShadow:`0 0 60px ${isCyan?'rgba(34,211,238,0.2)':'rgba(139,92,246,0.2)'}`}}>
        <div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:22}}>Upload Material</div>
        {[{label:'Title',value:title,set:setTitle,ph:'e.g. Chapter 5 Notes'},{label:'Description',value:desc,set:setDesc,ph:'Brief description (optional)'},{label:'Link / URL',value:url,set:setUrl,ph:'https://drive.google.com/...'}].map(({label,value,set,ph})=>(
          <div key={label} style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:5,fontWeight:700,letterSpacing:1.5}}>{label.toUpperCase()}</div>
            <input value={value} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:'100%',background:'rgba(255,255,255,0.04)',border:`1px solid ${borderColor}`,borderRadius:8,padding:'9px 13px',color:C.text,fontSize:13,fontFamily:'Inter,sans-serif',outline:'none'}}/>
          </div>
        ))}
        <div style={{display:'flex',gap:10,marginTop:12}}>
          <button onClick={onClose} style={{flex:1,padding:10,borderRadius:8,border:`1px solid ${borderColor}`,background:'none',color:C.muted,cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:13}}>Cancel</button>
          <button onClick={submit} style={{flex:1,padding:10,borderRadius:8,border:'none',background:btnBg,color:'#fff',cursor:'pointer',fontWeight:600,fontFamily:'Inter,sans-serif',fontSize:13}}>Upload</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TEACHER DASHBOARD — uses dynamic teacherName
// ══════════════════════════════════════════════════════════════════════════════
function TeacherDashboard({onLogout,students,attendance,materials,setMaterials,load,notify,teacherName}) {
  const [page,setPage]               = useState('dashboard')
  const [showAddStudent,setShowAddStudent]   = useState(false)
  const [showAddMaterial,setShowAddMaterial] = useState(false)
  const today = new Date()

  const handleMark        = async(sid,present,date)=>{ try{await markAttendance(sid,present,date);notify(`Marked ${present?'Present ✓':'Absent ✗'}`);load()}catch(e){notify(e.response?.data?.message||'Failed','error')} }
  const handleAddStudent  = async(data)=>{ await addStudent(data);notify(`${data.name} added`);load() }
  const handleDelete      = async(id,name)=>{ if(!confirm(`Delete ${name}?`)) return; try{await deleteStudent(id);notify(`${name} removed`);load()}catch{notify('Failed','error')} }
  const handleAddMaterial = (mat)=>{ const u=[mat,...materials]; setMaterials(u); saveMaterials(u); notify('Material uploaded') }
  const handleDelMaterial = (id)=>{ const u=materials.filter(m=>m.id!==id); setMaterials(u); saveMaterials(u); notify('Material removed') }

  const totalStudents = students.length
  const todayStr      = toLocalDateStr(today)
  const presentToday  = attendance.filter(a=>a.date===todayStr&&a.present).length
  const totalRecs     = attendance.length
  const presentTotal  = attendance.filter(a=>a.present).length
  const pct           = totalRecs===0?'0':((presentTotal/totalRecs)*100).toFixed(1)
  const avgPerf       = !students.length?'0':(()=>{ const s=students.map(s=>{const r=attendance.filter(a=>a.student?.id===s.id);return r.length?(r.filter(a=>a.present).length/r.length)*10:0}); return(s.reduce((a,b)=>a+b,0)/s.length).toFixed(1) })()
  const weeklyData    = buildWeeklyData(attendance)
  const pieData       = buildPieData(students,attendance)
  const avatarColors  = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#f472b6']

  return (
    <div style={{display:'flex',minHeight:'100vh',position:'relative',overflow:'hidden'}}>
      <AnimatedBackground/>
      <Sidebar active={page} setActive={setPage} role="teacher" name={teacherName} onLogout={onLogout}/>
      <div className="main-content" style={{marginLeft:220,flex:1,minWidth:0,display:'flex',flexDirection:'column',position:'relative',zIndex:1}}>
        <Topbar name={teacherName} role="teacher"/>
        <main style={{padding:20,flex:1}}>
          <div style={{marginBottom:20}}>
            <h1 style={{fontSize:26,fontWeight:700,color:C.text,letterSpacing:'-0.3px'}}>Welcome back, {teacherName}! 👋</h1>
            <p style={{color:C.muted,fontSize:13,marginTop:5}}>Here's what's happening with your classes today.</p>
          </div>

          <div className="stat-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
            <StatCard label="TOTAL STUDENTS" value={totalStudents}    sub="Live count"            accent={C.purple} iconBg="rgba(139,92,246,0.12)" icon={Users}/>
            <StatCard label="PRESENT TODAY"  value={presentToday}     sub={`of ${totalStudents}`} accent={C.cyan}   iconBg="rgba(34,211,238,0.12)"  icon={CalendarCheck}/>
            <StatCard label="ATTENDANCE %"   value={`${pct}%`}        sub="Overall"              accent={C.pink}   iconBg="rgba(244,114,182,0.12)" icon={TrendingUp}/>
            <StatCard label="PERFORMANCE"    value={avgPerf}          sub="Avg score /10"        accent={C.amber}  iconBg="rgba(245,158,11,0.12)"  icon={Star}/>
          </div>

          <div className="charts-row" style={{display:'flex',gap:12,marginBottom:18,alignItems:'stretch'}}>
            <div className="card" style={{flex:2,minWidth:0,padding:18,display:'flex',flexDirection:'column'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.8,color:C.muted}}>WEEKLY ATTENDANCE OVERVIEW</div>
                <span style={{fontSize:10,color:C.muted,border:'1px solid rgba(139,92,246,0.2)',borderRadius:6,padding:'3px 9px'}}>This Week</span>
              </div>
              <div style={{flex:1,minHeight:180}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{top:8,right:8,bottom:0,left:-22}}>
                    <XAxis dataKey="label" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                    <Tooltip contentStyle={{background:'#0d1117',border:'1px solid rgba(139,92,246,0.3)',borderRadius:8,fontSize:12}} formatter={v=>v!==null?[`${v}%`,'Attendance']:['No data','']} labelStyle={{color:C.muted}}/>
                    <Line type="monotone" dataKey="pct" stroke={C.purple} strokeWidth={2.5} dot={{fill:C.purple,strokeWidth:0,r:4}} activeDot={{r:6,fill:C.purpleBright}} connectNulls={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:12}}>
              {/* FIXED pie chart — cx increased to stop left cutoff */}
              <div className="card" style={{padding:18}}>
  <div style={{fontSize:10,fontWeight:700,letterSpacing:1.8,color:C.muted,marginBottom:12}}>ATTENDANCE DISTRIBUTION</div>
  <div style={{display:'flex',alignItems:'center',gap:16}}>

    {/* Pie in its own fixed box — cx/cy 50% always centers perfectly */}
    <div style={{width:130,height:130,flexShrink:0}}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
            {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
          </Pie>
          <Tooltip contentStyle={{background:'#0d1117',border:'1px solid rgba(139,92,246,0.3)',borderRadius:8,fontSize:12}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Plain HTML legend — no SVG fighting */}
    <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
      {pieData.map((item,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:PIE_COLORS[i],flexShrink:0,boxShadow:`0 0 6px ${PIE_COLORS[i]}`}}/>
            <span style={{fontSize:11,color:C.muted}}>{item.name}</span>
          </div>
          <span style={{fontSize:12,fontWeight:700,color:PIE_COLORS[i],fontFamily:'JetBrains Mono,monospace'}}>{item.value}</span>
        </div>
      ))}
    </div>

  </div>
</div>

              <div className="card" style={{padding:18,flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:1.8,color:C.muted}}>RECENT ACTIVITY</div>
                  <span style={{fontSize:11,color:C.purple,cursor:'pointer'}}>View All</span>
                </div>
                {[
                  {icon:CalendarCheck,color:C.purple,text:'Attendance marked for B5-A',time:'2 min ago'},
                  {icon:Users,color:C.pink,text:'Leave request submitted',time:'15 min ago'},
                  {icon:UserPlus,color:C.cyan,text:'New student joined B5-A',time:'45 min ago'},
                  {icon:FileBarChart,color:C.amber,text:'Monthly report generated',time:'1 hr ago'},
                ].map(({icon:Icon,color,text,time},i,arr)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 0',borderBottom:i<arr.length-1?'1px solid rgba(139,92,246,0.08)':'none'}}>
                    <div style={{width:28,height:28,borderRadius:7,flexShrink:0,background:`rgba(${color===C.purple?'139,92,246':color===C.pink?'244,114,182':color===C.cyan?'34,211,238':'245,158,11'},0.12)`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={12} color={color}/></div>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,color:C.text,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{text}</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>{time}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{marginBottom:18,overflow:'hidden'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 18px 13px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><CalendarCheck size={14} color={C.purple}/><span style={{fontSize:11,fontWeight:700,letterSpacing:1.8,color:C.purple}}>STUDENT ATTENDANCE</span></div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShowAddStudent(true)} style={{display:'flex',alignItems:'center',gap:5,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',border:'none',borderRadius:8,padding:'7px 13px',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'Inter,sans-serif',boxShadow:'0 0 14px rgba(124,58,237,0.4)'}}><UserPlus size={13}/> Add Student</button>
                <button onClick={load} style={{display:'flex',alignItems:'center',gap:5,background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.25)',borderRadius:8,padding:'7px 11px',color:C.purpleBright,cursor:'pointer',fontSize:12,fontFamily:'Inter,sans-serif'}}><RefreshCw size={12}/> Refresh</button>
              </div>
            </div>
            {students.length===0 ? (
              <div style={{textAlign:'center',padding:'46px 20px',color:C.muted}}><Users size={34} style={{opacity:0.22,display:'block',margin:'0 auto 10px'}}/><div style={{fontSize:14,fontWeight:600}}>No students yet</div><div style={{fontSize:12,marginTop:4}}>Click "Add Student" to get started</div></div>
            ) : (
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{borderBottom:'1px solid rgba(139,92,246,0.15)'}}>
                    {['STUDENT','BATCH',...DAYS,'SCORE','ACTION'].map(h=>(
                      <th key={h} style={{padding:'9px 11px',fontSize:9,fontWeight:700,color:C.muted,letterSpacing:1.5,textAlign:['STUDENT','BATCH','ACTION'].includes(h)?'left':'center'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {students.map(s=>{
                      const initials=s.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
                      const recs=attendance.filter(a=>a.student?.id===s.id)
                      const score=recs.length===0?'0.0':((recs.filter(a=>a.present).length/recs.length)*10).toFixed(1)
                      return (
                        <tr key={s.id} style={{borderBottom:'1px solid rgba(139,92,246,0.07)'}}>
                          <td style={{padding:'10px 11px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{width:28,height:28,borderRadius:'50%',background:avatarColors[s.id%avatarColors.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',flexShrink:0}}>{initials}</div>
                              <div>
                                <div style={{fontSize:12,fontWeight:600,color:C.text}}>{s.name}</div>
                                {s.email&&<div style={{fontSize:9,color:C.muted}}>{s.email}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{padding:'10px 11px',fontSize:11,color:C.muted}}>{s.batch}</td>
                          {DAYS.map((_,i)=>{
                            const monday=getMonday(today); const d=new Date(monday); d.setDate(d.getDate()+i)
                            const ds=toLocalDateStr(d); const isFuture=d>today
                            const rec=attendance.find(a=>a.student?.id===s.id&&a.date===ds)
                            return (
                              <td key={i} style={{padding:'10px 8px',textAlign:'center'}}>
                                {rec?.present===true?<div className="badge-present" style={{margin:'0 auto'}}><CheckCircle2 size={11}/></div>
                                :rec?.present===false?<div className="badge-absent" style={{margin:'0 auto'}}><XCircle size={11}/></div>
                                :isFuture?<div className="badge-neutral" style={{margin:'0 auto'}}><Minus size={10}/></div>
                                :<div style={{display:'flex',gap:3,justifyContent:'center'}}>
                                  <button onClick={()=>handleMark(s.id,true,ds)} style={{background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:5,padding:'2px 7px',color:C.green,cursor:'pointer',fontSize:10,fontFamily:'Inter,sans-serif'}}>P</button>
                                  <button onClick={()=>handleMark(s.id,false,ds)} style={{background:'rgba(244,114,182,0.15)',border:'1px solid rgba(244,114,182,0.3)',borderRadius:5,padding:'2px 7px',color:C.pink,cursor:'pointer',fontSize:10,fontFamily:'Inter,sans-serif'}}>A</button>
                                </div>}
                              </td>
                            )
                          })}
                          <td style={{padding:'10px 11px',textAlign:'center'}}><span className="score-pill">{score}</span></td>
                          <td style={{padding:'10px 11px'}}><button onClick={()=>handleDelete(s.id,s.name)} style={{background:'rgba(244,114,182,0.08)',border:'1px solid rgba(244,114,182,0.2)',borderRadius:6,padding:'4px 9px',color:C.pink,cursor:'pointer',fontSize:10,fontFamily:'Inter,sans-serif'}}>Remove</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{marginBottom:18,padding:18}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><BookMarked size={14} color={C.cyan}/><span style={{fontSize:11,fontWeight:700,letterSpacing:1.8,color:C.cyan}}>CLASS STUDY MATERIALS</span></div>
              <button onClick={()=>setShowAddMaterial(true)} style={{display:'flex',alignItems:'center',gap:5,background:'linear-gradient(135deg,#0891b2,#06b6d4)',border:'none',borderRadius:8,padding:'7px 13px',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'Inter,sans-serif'}}><PlusCircle size={13}/> Upload Material</button>
            </div>
            {materials.length===0 ? (
              <div style={{textAlign:'center',padding:'30px 20px',color:C.muted}}><BookMarked size={28} style={{opacity:0.2,display:'block',margin:'0 auto 10px'}}/><div style={{fontSize:13}}>No materials uploaded yet</div></div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
                {materials.map(m=>(
                  <div key={m.id} style={{background:'rgba(34,211,238,0.05)',border:'1px solid rgba(34,211,238,0.15)',borderRadius:10,padding:14,position:'relative'}}>
                    <button onClick={()=>handleDelMaterial(m.id)} style={{position:'absolute',top:8,right:8,background:'none',border:'none',cursor:'pointer',color:C.muted,padding:2}}><Trash2 size={13}/></button>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4,paddingRight:20}}>{m.title}</div>
                    {m.desc&&<div style={{fontSize:11,color:C.muted,marginBottom:6}}>{m.desc}</div>}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:10,color:C.muted}}>{m.date}</span>
                      {m.url&&<a href={m.url} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:C.cyan,textDecoration:'none'}}><Link size={11}/>Open</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{padding:18}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.8,color:C.muted,marginBottom:13}}>QUICK ACTIONS</div>
            <div className="actions-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {[
                {icon:UserPlus,    label:'Add Student',    color:C.purple, action:()=>setShowAddStudent(true)},
                {icon:Upload,      label:'Upload Material',color:C.cyan,   action:()=>setShowAddMaterial(true)},
                {icon:FileBarChart,label:'Generate Report',color:C.pink,   action:()=>notify('Reports coming soon')},
                {icon:Activity,    label:'Class Analytics',color:C.amber,  action:()=>notify('Analytics coming soon')},
              ].map(({icon:Icon,label,color,action})=>(
                <button key={label} onClick={action} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:9,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(139,92,246,0.12)',borderRadius:11,padding:'15px 10px',cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(139,92,246,0.1)';e.currentTarget.style.borderColor='rgba(139,92,246,0.3)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)';e.currentTarget.style.borderColor='rgba(139,92,246,0.12)'}}>
                  <div style={{width:40,height:40,borderRadius:10,background:`rgba(${color===C.purple?'139,92,246':color===C.cyan?'34,211,238':color===C.pink?'244,114,182':'245,158,11'},0.12)`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={18} color={color}/></div>
                  <span style={{fontSize:11,fontWeight:600,color:C.muted}}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
      {showAddStudent&&<AddStudentModal onAdd={handleAddStudent} onClose={()=>setShowAddStudent(false)}/>}
      {showAddMaterial&&<AddMaterialModal onAdd={handleAddMaterial} onClose={()=>setShowAddMaterial(false)} accentColor="cyan"/>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function StudentDashboard({student,onLogout,attendance,materials}) {
  const [page,setPage]                 = useState('dashboard')
  const [showMyUpload,setShowMyUpload] = useState(false)
  const MY_KEY = `attendx_my_materials_${student.id}`
  const [myMaterials,setMyMaterials]   = useState(()=>{ try{ return JSON.parse(localStorage.getItem(MY_KEY)||'[]') }catch{ return [] } })
  const today = new Date()

  const handleAddMyMat = (mat) => { const u=[mat,...myMaterials]; setMyMaterials(u); localStorage.setItem(MY_KEY,JSON.stringify(u)) }
  const handleDelMyMat = (id)  => { const u=myMaterials.filter(m=>m.id!==id); setMyMaterials(u); localStorage.setItem(MY_KEY,JSON.stringify(u)) }

  const myRecords    = attendance.filter(a=>a.student?.id===student.id)
  const totalRecs    = myRecords.length
  const presentTotal = myRecords.filter(a=>a.present).length
  const myPct        = totalRecs===0?'0':((presentTotal/totalRecs)*100).toFixed(1)
  const myScore      = totalRecs===0?'0.0':((presentTotal/totalRecs)*10).toFixed(1)
  const todayStr     = toLocalDateStr(today)
  const todayRecord  = myRecords.find(a=>a.date===todayStr)
  const todayStatus  = todayRecord?(todayRecord.present?'Present':'Absent'):'Not Marked'

  const monday   = getMonday(today)
  const weekDays = DAYS.map((_,i)=>{
    const d=new Date(monday); d.setDate(d.getDate()+i)
    const ds=toLocalDateStr(d)
    const rec=myRecords.find(a=>a.date===ds)
    return { label:DAYS[i], date:ds, status:rec?rec.present:null, isFuture:d>today }
  })

  return (
    <div style={{display:'flex',minHeight:'100vh',position:'relative',overflow:'hidden'}}>
      <AnimatedBackground/>
      <Sidebar active={page} setActive={setPage} role="student" name={student.name} onLogout={onLogout}/>
      <div className="main-content" style={{marginLeft:220,flex:1,minWidth:0,display:'flex',flexDirection:'column',position:'relative',zIndex:1}}>
        <Topbar name={student.name} role="student"/>
        <main style={{padding:20,flex:1}}>
          <div style={{marginBottom:20}}>
            <h1 style={{fontSize:26,fontWeight:700,color:C.text,letterSpacing:'-0.3px'}}>Welcome, {student.name.split(' ')[0]}! 👋</h1>
            <p style={{color:C.muted,fontSize:13,marginTop:5}}>Batch: <span style={{color:C.cyan,fontWeight:600}}>{student.batch}</span> &nbsp;·&nbsp; Here's your attendance overview.</p>
          </div>

          <div className="stat-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
            <StatCard label="MY ATTENDANCE" value={`${myPct}%`}  sub="Overall"                  accent={C.cyan}   iconBg="rgba(34,211,238,0.12)"  icon={TrendingUp}/>
            <StatCard label="DAYS PRESENT"  value={presentTotal}  sub={`of ${totalRecs} total`} accent={C.green}  iconBg="rgba(16,185,129,0.12)"  icon={CheckCircle2}/>
            <StatCard label="PERFORMANCE"   value={myScore}       sub="Score /10"               accent={C.purple} iconBg="rgba(139,92,246,0.12)"  icon={Star}/>
            <StatCard label="TODAY"         value={todayStatus}   sub={today.toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})} accent={C.amber} iconBg="rgba(245,158,11,0.12)" icon={CalendarCheck}/>
          </div>

          <div className="card" style={{marginBottom:18,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'16px 18px 13px'}}>
              <CalendarCheck size={14} color={C.cyan}/>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:1.8,color:C.cyan}}>MY WEEKLY ATTENDANCE</span>
              <span style={{marginLeft:'auto',fontSize:11,color:C.muted,border:'1px solid rgba(34,211,238,0.2)',borderRadius:6,padding:'2px 8px'}}>Read Only</span>
            </div>
            <div style={{padding:'0 18px 18px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
                {weekDays.map(({label,status,isFuture})=>(
                  <div key={label} style={{textAlign:'center',background:status===true?'rgba(16,185,129,0.1)':status===false?'rgba(244,114,182,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${status===true?'rgba(16,185,129,0.3)':status===false?'rgba(244,114,182,0.3)':'rgba(139,92,246,0.1)'}`,borderRadius:10,padding:'14px 8px'}}>
                    <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1,marginBottom:8}}>{label}</div>
                    {status===true?<CheckCircle2 size={22} color={C.green} style={{margin:'0 auto'}}/>
                    :status===false?<XCircle size={22} color={C.pink} style={{margin:'0 auto'}}/>
                    :isFuture?<Minus size={22} color={C.muted} style={{margin:'0 auto',opacity:0.4}}/>
                    :<div style={{fontSize:10,color:C.muted,marginTop:4}}>—</div>}
                    <div style={{fontSize:9,marginTop:6,color:status===true?C.green:status===false?C.pink:C.muted,fontWeight:600}}>
                      {status===true?'Present':status===false?'Absent':isFuture?'Upcoming':'Not Marked'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:12,marginBottom:18}}>
            <div className="card" style={{flex:1,padding:18}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:1.8,color:C.muted,marginBottom:14}}>MY RECENT ACTIVITY</div>
              {myRecords.length===0?(
                <div style={{color:C.muted,fontSize:13,textAlign:'center',padding:'20px 0'}}>No attendance records yet</div>
              ):(
                [...myRecords].reverse().slice(0,5).map((r,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<4?'1px solid rgba(139,92,246,0.08)':'none'}}>
                    <div style={{width:28,height:28,borderRadius:7,background:r.present?'rgba(16,185,129,0.12)':'rgba(244,114,182,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {r.present?<CheckCircle2 size={13} color={C.green}/>:<XCircle size={13} color={C.pink}/>}
                    </div>
                    <div style={{flex:1}}><div style={{fontSize:11,color:C.text,fontWeight:500}}>{r.present?'Marked Present':'Marked Absent'}</div><div style={{fontSize:10,color:C.muted}}>{r.date}</div></div>
                    <span style={{fontSize:10,fontWeight:700,color:r.present?C.green:C.pink,border:`1px solid ${r.present?'rgba(16,185,129,0.3)':'rgba(244,114,182,0.3)'}`,borderRadius:5,padding:'2px 7px'}}>{r.present?'P':'A'}</span>
                  </div>
                ))
              )}
            </div>
            <div className="card" style={{flex:1,padding:18}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:1.8,color:C.muted,marginBottom:14}}>MY ATTENDANCE TREND</div>
              <div style={{height:180}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekDays.map(d=>({label:d.label,pct:d.status===null?null:d.status?100:0}))} margin={{top:8,right:8,bottom:0,left:-22}}>
                    <XAxis dataKey="label" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v===100?'P':v===0?'A':''}/>
                    <Tooltip contentStyle={{background:'#0d1117',border:'1px solid rgba(34,211,238,0.3)',borderRadius:8,fontSize:12}} formatter={v=>v===100?['Present','']:v===0?['Absent','']:['—','']} labelStyle={{color:C.muted}}/>
                    <Line type="monotone" dataKey="pct" stroke={C.cyan} strokeWidth={2.5} dot={{fill:C.cyan,strokeWidth:0,r:4}} activeDot={{r:6,fill:C.cyan}} connectNulls={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Class materials — teacher uploaded */}
          <div className="card" style={{padding:18,marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <BookMarked size={14} color={C.cyan}/>
              <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1.8,color:C.cyan}}>CLASS STUDY MATERIALS</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>Uploaded by your teacher</div></div>
            </div>
            {materials.length===0?(
              <div style={{textAlign:'center',padding:'24px 20px',color:C.muted}}><BookMarked size={26} style={{opacity:0.2,display:'block',margin:'0 auto 10px'}}/><div style={{fontSize:13}}>No class materials yet</div></div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
                {materials.map(m=>(
                  <div key={m.id} style={{background:'rgba(34,211,238,0.05)',border:'1px solid rgba(34,211,238,0.15)',borderRadius:10,padding:14}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{m.title}</div>
                    {m.desc&&<div style={{fontSize:11,color:C.muted,marginBottom:6}}>{m.desc}</div>}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:10,color:C.muted}}>{m.date}</span>
                      {m.url?<a href={m.url} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:C.cyan,fontWeight:600,textDecoration:'none',background:'rgba(34,211,238,0.1)',border:'1px solid rgba(34,211,238,0.25)',borderRadius:5,padding:'3px 8px'}}><Link size={10}/>Download</a>:<span style={{fontSize:10,color:C.muted}}>No link</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My private materials */}
          <div className="card" style={{padding:18}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <Upload size={14} color={C.purple}/>
                <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1.8,color:C.purple}}>MY STUDY MATERIALS</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>Your private notes — only you can see these</div></div>
              </div>
              <button onClick={()=>setShowMyUpload(true)} style={{display:'flex',alignItems:'center',gap:5,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',border:'none',borderRadius:8,padding:'7px 13px',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'Inter,sans-serif'}}><PlusCircle size={13}/> Add Material</button>
            </div>
            {myMaterials.length===0?(
              <div style={{textAlign:'center',padding:'24px 20px',color:C.muted}}><Upload size={26} style={{opacity:0.2,display:'block',margin:'0 auto 10px'}}/><div style={{fontSize:13}}>No personal materials yet</div></div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
                {myMaterials.map(m=>(
                  <div key={m.id} style={{background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.18)',borderRadius:10,padding:14,position:'relative'}}>
                    <button onClick={()=>handleDelMyMat(m.id)} style={{position:'absolute',top:8,right:8,background:'none',border:'none',cursor:'pointer',color:C.muted}}><Trash2 size={12}/></button>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4,paddingRight:18}}>{m.title}</div>
                    {m.desc&&<div style={{fontSize:11,color:C.muted,marginBottom:6}}>{m.desc}</div>}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:10,color:C.muted}}>{m.date}</span>
                      {m.url?<a href={m.url} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:C.purpleBright,textDecoration:'none',background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.25)',borderRadius:5,padding:'3px 8px'}}><Link size={10}/>Open</a>:<span style={{fontSize:10,color:C.muted}}>No link</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      {showMyUpload&&<AddMaterialModal onAdd={handleAddMyMat} onClose={()=>setShowMyUpload(false)} accentColor="purple"/>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [view,setView]                     = useState('landing')
  const [teacherName,setTeacherName]       = useState('')
  const [currentStudent,setCurrentStudent] = useState(null)
  const [students,setStudents]             = useState([])
  const [attendance,setAttendance]         = useState([])
  const [materials,setMaterials]           = useState(getMaterials())
  const [toast,setToast]                   = useState({msg:'',type:'success'})

  const notify = (msg,type='success') => { setToast({msg,type}); setTimeout(()=>setToast({msg:'',type:'success'}),3000) }
  const load = async () => {
    try { const [s,a]=await Promise.all([getStudents(),getAttendance()]); setStudents(s.data); setAttendance(a.data) }
    catch { notify('Backend offline — start Spring Boot','error') }
  }
  useEffect(()=>{ load() },[])

  if (view==='teacher') return (
    <>
      <TeacherDashboard
        onLogout={()=>setView('landing')}
        students={students} attendance={attendance}
        materials={materials} setMaterials={setMaterials}
        load={load} notify={notify}
        teacherName={teacherName}
      />
      <Toast msg={toast.msg} type={toast.type}/>
    </>
  )
  if (view==='student') return (
    <>
      <StudentDashboard student={currentStudent} onLogout={()=>setView('landing')} attendance={attendance} materials={materials}/>
      <Toast msg={toast.msg} type={toast.type}/>
    </>
  )
  return (
    <>
      <LandingPage
        onTeacherLogin={(name)=>{ setTeacherName(name); setView('teacher') }}
        onStudentLogin={(s)=>{ setCurrentStudent(s); setView('student') }}
        students={students}
      />
      <Toast msg={toast.msg} type={toast.type}/>
      <style>{`
        @keyframes gridScroll{0%{background-position:0 0}100%{background-position:32px 32px}}
        @keyframes orbFloat1{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(100px,-80px) scale(1.1)}50%{transform:translate(60px,120px) scale(0.95)}75%{transform:translate(-80px,60px) scale(1.05)}}
        @keyframes orbFloat2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-120px,80px) scale(1.15)}66%{transform:translate(100px,-100px) scale(0.9)}}
        @keyframes orbFloat3{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.35)}}
        @keyframes letterFloat{0%{transform:translateY(110vh) rotate(0deg);opacity:0}5%{opacity:1}95%{opacity:1}100%{transform:translateY(-120px) rotate(360deg);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </>
  )
}