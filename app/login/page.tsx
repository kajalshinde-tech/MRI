'use client';
import {Activity,ShieldCheck,ArrowRight} from 'lucide-react';
import {Role} from '../../lib/data';
const roles:Role[]=['State Admin','District Admin','Officer','Centre'];
export default function LoginPage(){
 function enter(role:Role){localStorage.setItem('mahacare-session',JSON.stringify({...JSON.parse(localStorage.getItem('mahacare-session')||'{}'),role,district:'Pune'}));window.location.assign('/portal');}
 return <main className="demo-login"><a className="brand" href="/"><span className="brand-icon"><Activity size={25}/></span><span><b>MahaCare<span className="brand-dot">.</span></b><small>DIAGNOSTIC REGISTRY</small></span></a><section className="panel"><span className="eyebrow">PHASE 2 · DEMONSTRATION</span><h1>Choose your workspace</h1><p className="muted">Explore a connected diagnostic centre registry with fictional Maharashtra records.</p><div className="role-grid">{roles.map(role=><button key={role} onClick={()=>enter(role)}><ShieldCheck size={22}/><strong>{role}</strong><small>{role==='State Admin'?'All 36 districts':role==='Centre'?'Your selected demo centre':'Assigned district records'}</small><ArrowRight size={16}/></button>)}</div><p className="warning">Demo role selector only. This is not real authentication. All records and registration numbers are fictional.</p></section><a className="text-button" href="/">Return to public website <ArrowRight size={15}/></a></main>;
}
