import { Database, seed } from './data';
const KEY='mahacare-demo-v1';
export function save(db:Database) {localStorage.setItem(KEY,JSON.stringify(db));}
export function load():{db:Database;recovered:boolean} {try {const raw=localStorage.getItem(KEY);if(!raw){const db=seed();save(db);return {db,recovered:false};}const db=JSON.parse(raw);const keys=['centres','documents','applications','inspections','renewals','complaints','users','notifications'];if(db.version!==1||keys.some(k=>!Array.isArray(db[k]))||!db.centres.every((c:unknown)=>typeof c==='object'&&c!==null&&'id' in c&&'district' in c&&'status' in c))throw Error('Invalid demo storage');return {db,recovered:false};}catch {const db=seed();return {db,recovered:true};}}
export function updateDatabase(db:Database,change:(draft:Database)=>void) {const next=structuredClone(db);change(next);save(next);return next;}
