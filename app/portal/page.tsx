'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Activity, LayoutDashboard, Building2, ClipboardList, ShieldCheck,
  ArrowUpRight, Search, Bell, ChevronDown, Menu, X, ArrowRight,
  MapPin, RotateCcw, Check, Clock, FileText, LogOut, Settings,
  Stethoscope, HeartPulse, QrCode, AlertTriangle, Download,
  Printer, UserCheck, Wrench, Shield, Flag, Plus, Send, ExternalLink
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type {
  Database, DiagnosticCentre, CentreDocument, ApplicationEvent,
  Inspection, Complaint, Notification, Doctor, TechnicalStaff, Equipment, ChecklistItem
} from '@/lib/types';
import { Role, seed, districts, scopedCentres, validity, daysUntil } from '@/lib/data';
import { load, save, updateDatabase } from '@/lib/storage';
import InspectionModal from '@/components/portal/inspection-modal';
import ApplicationReviewModal from '@/components/portal/application-review-modal';
import QrCertificate from '@/components/portal/qr-certificate';
import { exportToCSV } from '@/components/portal/csv-export';

const AdminCharts = dynamic(() => import('@/components/portal/admin-charts'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
});

const GisMap = dynamic(() => import('@/components/portal/gis-map'), {
  ssr: false,
  loading: () => <div className="h-96 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Loading Maharashtra GIS Map…</div>
});

const roles: Role[] = ['State Admin', 'District Admin', 'Officer', 'Centre'];

function Badge({ children }: { children: string }) {
  const cls =
    children === 'Approved' || children === 'Valid' || children === 'Completed' || children === 'Resolved' || children === 'Closed'
      ? 'green'
      : children === 'Expired' || children === 'Rejected' || children === 'Overdue'
      ? 'red'
      : children === 'Draft'
      ? 'gray'
      : 'amber';
  return <span className={`badge ${cls}`}>{children}</span>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const modal = ref.current;
    const getFocusable = () => Array.from(modal?.querySelectorAll<HTMLElement>('button, a, input, select, textarea, [tabindex="0"]') || []);
    getFocusable()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = getFocusable();
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener('keydown', key);
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = priorOverflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <section ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button aria-label="Close dialog" onClick={onClose}><X size={20} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default function PortalPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [role, setRole] = useState<Role>('State Admin');
  const [district, setDistrict] = useState('Pune');
  const [page, setPage] = useState('Dashboard');
  const [activeCentreId, setActiveCentreId] = useState('C001');
  const [certificateCentreId, setCertificateCentreId] = useState('');
  const [inspectionCentreId, setInspectionCentreId] = useState<string>();
  const [inspectionDetailId, setInspectionDetailId] = useState<string>();
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Filters & Search
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All districts');
  const [status, setStatus] = useState('All statuses');
  const [sort, setSort] = useState('newest');
  const [index, setIndex] = useState(1);

  // Modals & Panels
  const [detailCentreId, setDetailCentreId] = useState<string | null>(null);
  const [reviewCentreId, setReviewCentreId] = useState<string | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [reset, setReset] = useState(false);
  const [login, setLogin] = useState(false);
  const [toast, setToast] = useState('');

  // Form states for modals
  const [newStaff, setNewStaff] = useState({ name: '', roleType: 'doctor', qualification: '', regNum: '', phone: '' });
  const [newEquip, setNewEquip] = useState({ name: '', make: '', model: '', serialNumber: '', calibDate: '' });
  const [newDoc, setNewDoc] = useState({ title: '', category: 'Trade Licence' as any, registration: '', authority: '', expiryDate: '' });

  useEffect(() => {
    const refresh = () => load().then(result => setDb(result.db)).catch(error => setToast(error.message));
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('registry-updated', refresh);
    try {
      const prefs = JSON.parse(localStorage.getItem('mahacare-session') || '{}');
      if (roles.includes(prefs.role)) setRole(prefs.role);
      else localStorage.setItem('mahacare-session', JSON.stringify({ role: 'State Admin', district: 'Pune' }));
      if (districts.includes(prefs.district)) setDistrict(prefs.district);
      if (prefs.centreId) setActiveCentreId(prefs.centreId);
    } catch {}
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('registry-updated', refresh); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!db) {
    return <div className="loading"><Activity size={24} /> Preparing your demo workspace…</div>;
  }

  // Scoped Data
  const centres: DiagnosticCentre[] = role === 'Centre' ? db.centres.filter(c => c.id === activeCentreId) : scopedCentres(db, role, district);
  const ids = new Set(centres.map((c: DiagnosticCentre) => c.id));
  const docs: CentreDocument[] = db.documents.filter((d: CentreDocument) => ids.has(d.centreId));
  const inspections: Inspection[] = db.inspections.filter((i: Inspection) => ids.has(i.centreId));
  const complaints: Complaint[] = db.complaints.filter((c: Complaint) => !c.centreId || ids.has(c.centreId));

  const expiredDocs = docs.filter((d: CentreDocument) => validity(d.expiryDate) === 'Expired');
  const expiringDocs = docs.filter((d: CentreDocument) => validity(d.expiryDate) === 'Expiring Soon');
  const approvedCount = centres.filter((c: DiagnosticCentre) => c.status === 'Approved').length;
  const pendingCount = centres.filter((c: DiagnosticCentre) => !['Approved', 'Rejected', 'Draft'].includes(c.status)).length;
  const overdueInspections = inspections.filter((i: Inspection) => i.status === 'Scheduled' && daysUntil(i.scheduledAt) < 0).length;
  const openComplaints = complaints.filter((c: Complaint) => !['Resolved', 'Closed'].includes(c.status)).length;
  const newThisMonth = centres.filter((c: DiagnosticCentre) => c.createdAt >= '2024-01-01').length;

  // Filtered centres for directory table
  const shown = centres
    .filter((c: DiagnosticCentre) =>
      (filter === 'All districts' || c.district === filter) &&
      (status === 'All statuses' || (status === 'Pending verification' ? !['Approved', 'Rejected', 'Draft'].includes(c.status) : c.status === status)) &&
      `${c.name} ${c.udcid} ${c.district}`.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a: DiagnosticCentre, b: DiagnosticCentre) => (sort === 'name' ? a.name.localeCompare(b.name) : b.createdAt.localeCompare(a.createdAt)));

  // Role Menus
  const adminMenus = ['Dashboard', 'Applications', 'QR Plate', 'Centres', 'GIS Map', 'Documents', 'Inspections', 'Complaints', 'Notifications', 'Settings'];
  const officerMenus = ['Dashboard', 'Applications', 'Centres', 'Field Inspections', 'Complaints', 'Notifications', 'Settings'];
  const centreMenus = ['Dashboard', 'My Centre', 'QR Plate', 'Application Status', 'Staff & Doctors', 'Equipment', 'Documents', 'Inspections', 'Notifications', 'Settings'];

  const menus = role === 'State Admin' || role === 'District Admin' ? adminMenus : role === 'Officer' ? officerMenus : centreMenus;

  function navigate(value: string) {
    setPage(value);
    setMobile(false);
    setQuery('');
    setStatus('All statuses');
    setFilter('All districts');
    setIndex(1);
  }

  function chooseRole(value: Role) {
    setRole(value);
    setPage('Dashboard');
    setFilter('All districts');
    setStatus('All statuses');
    setIndex(1);
    localStorage.setItem('mahacare-session', JSON.stringify({ role: value, district, centreId: activeCentreId }));
  }

  // Active Centre for Centre Role (C001 - Sahyadri MRI)
  const centreRoleCentre = db.centres.find((c: DiagnosticCentre) => c.id === activeCentreId) || db.centres[0];
  const selectedDetail = db.centres.find((c: DiagnosticCentre) => c.id === detailCentreId);
  const selectedReview = db.centres.find((c: DiagnosticCentre) => c.id === reviewCentreId);

  const certificateCentres = centres.filter(c => c.status === 'Approved');
  const certificateCentre = role === 'Centre' ? (centreRoleCentre.status === 'Approved' ? centreRoleCentre : undefined) : certificateCentres.find(c => c.id === certificateCentreId) || certificateCentres[0];
  const inspectionDetail = db.inspections.find(i => i.id === inspectionDetailId);

  // CSV Exporters
  const handleExportCentres = () => {
    const headers = ['UDCID', 'Centre Name', 'Facility Type', 'Ownership', 'District', 'Taluka', 'Address', 'Status', 'Phone', 'Email', 'Owner Name'];
    const rows = shown.map((c: DiagnosticCentre) => [
      c.udcid, c.name, c.type, c.ownershipType, c.district, c.taluka, c.address, c.status, c.phone, c.email, c.owner.name
    ]);
    exportToCSV(`MahaCare_Centres_${role.replace(/\s+/g, '_')}`, [headers, ...rows]);
    setToast('Centres list exported to CSV.');
  };

  const handleExportDocs = () => {
    const headers = ['Document Title', 'Centre Name', 'Category', 'Registration No', 'Issuing Authority', 'Expiry Date', 'Validity'];
    const rows = docs.map((d: CentreDocument) => [
      d.title, centres.find((c: DiagnosticCentre) => c.id === d.centreId)?.name || '', d.category, d.registration, d.issuingAuthority, d.expiryDate, validity(d.expiryDate)
    ]);
    exportToCSV(`MahaCare_Documents_${role.replace(/\s+/g, '_')}`, [headers, ...rows]);
    setToast('Documents compliance exported to CSV.');
  };

  const handleExportComplaints = () => {
    const headers = ['Tracking No', 'Centre Name', 'Complainant', 'Contact', 'Category', 'Status', 'Submitted Date', 'Description'];
    const rows = complaints.map((c: Complaint) => [
      c.trackingNumber, centres.find((cen: DiagnosticCentre) => cen.id === c.centreId)?.name || 'General', c.complainantName, c.complainantContact, c.category, c.status, c.submittedAt, c.description
    ]);
    exportToCSV(`MahaCare_Complaints_${role.replace(/\s+/g, '_')}`, [headers, ...rows]);
    setToast('Complaints list exported to CSV.');
  };

  // Add Staff Handler
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.regNum) return;
    const updated = await updateDatabase(db, (draft: Database) => {
      const c = draft.centres.find((cen: DiagnosticCentre) => cen.id === centreRoleCentre.id);
      if (!c) return;
      if (newStaff.roleType === 'doctor') {
        c.doctors.push({
          name: newStaff.name,
          qualification: newStaff.qualification || 'MBBS',
          phone: newStaff.phone || '98XXXXXX00',
          registrationNumber: newStaff.regNum,
          registrationAuthority: 'Maharashtra Medical Council',
          registrationExpiry: '2027-12-31',
          specialisation: 'Radiology / Pathology',
        });
      } else {
        c.technicalStaff.push({
          name: newStaff.name,
          qualification: newStaff.qualification || 'DMLT',
          designation: 'Certified Technologist',
          phone: newStaff.phone || '97XXXXXX00',
          registrationNumber: newStaff.regNum,
          registrationAuthority: 'Maharashtra Para-Medical Training Board',
        });
      }
    });
    setDb(updated);
    setShowStaffModal(false);
    setNewStaff({ name: '', roleType: 'doctor', qualification: '', regNum: '', phone: '' });
    setToast('New medical personnel added to centre profile.');
  };

  // Add Equipment Handler
  const handleAddEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquip.name || !newEquip.serialNumber) return;
    const updated = await updateDatabase(db, (draft: Database) => {
      const c = draft.centres.find((cen: DiagnosticCentre) => cen.id === centreRoleCentre.id);
      if (!c) return;
      c.equipment.push({
        id: `EQ-${Date.now()}`,
        name: newEquip.name,
        make: newEquip.make || 'Standard Medical',
        model: newEquip.model || '2024 Series',
        serialNumber: newEquip.serialNumber,
        lastCalibrationDate: newEquip.calibDate || new Date().toISOString().slice(0, 10),
      });
    });
    setDb(updated);
    setShowEquipModal(false);
    setNewEquip({ name: '', make: '', model: '', serialNumber: '', calibDate: '' });
    setToast('New diagnostic equipment logged.');
  };

  // Add Document Handler
  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.registration) return;
    const updated = await updateDatabase(db, (draft: Database) => {
      draft.documents.push({
        id: `DOC-NEW-${Date.now()}`,
        centreId: centreRoleCentre.id,
        title: newDoc.title,
        category: newDoc.category,
        registration: newDoc.registration,
        issuingAuthority: newDoc.authority || 'Competent Authority',
        issueDate: new Date().toISOString().slice(0, 10),
        expiryDate: newDoc.expiryDate || '2026-12-31',
      });
    });
    setDb(updated);
    setShowDocModal(false);
    setNewDoc({ title: '', category: 'Trade Licence', registration: '', authority: '', expiryDate: '' });
    setToast('New statutory document uploaded.');
  };

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <a href="#" className="brand" onClick={e => { e.preventDefault(); navigate('Dashboard'); }}>
          <span className="brand-icon"><Activity size={22} /></span>
          <span>
            <b>MahaCare<span className="brand-dot">.</span></b>
            <small>DIAGNOSTIC REGISTRY</small>
          </span>
        </a>
        <button className="mobile-close" aria-label="Close navigation" onClick={() => setMobile(false)}>
          <X size={20} />
        </button>

        <div className="workspace-label">
          WORKSPACE <span>DEMO</span>
        </div>

        <button className="workspace w-full text-left cursor-pointer" onClick={() => setLogin(true)}>
          <span className="workspace-icon"><ShieldCheck size={19} /></span>
          <div>
            <strong>{role === 'State Admin' ? 'Maharashtra State' : role === 'Centre' ? centreRoleCentre.name : district + ' District'}</strong>
            <small>{role} portal (Click to switch)</small>
          </div>
          <ChevronDown size={14} />
        </button>

        <p className="nav-label">NAVIGATION</p>
        <nav>
          {menus.map(item => {
            const isActive = page === item;
            return (
              <button key={item} className={isActive ? 'active' : ''} onClick={() => navigate(item)}>
                {item === 'Dashboard' && <LayoutDashboard size={18} />}
                {(item === 'Centres' || item === 'My Centre') && <Building2 size={18} />}
                {item === 'GIS Map' && <MapPin size={18} />}
                {(item === 'Documents' || item === 'Application Status') && <FileText size={18} />}
                {(item === 'Inspections' || item === 'Field Inspections') && <ClipboardList size={18} />}
                {item === 'Applications' && <ShieldCheck size={18} />}
                {item === 'QR Plate' && <QrCode size={18} />}
                {item === 'Staff & Doctors' && <UserCheck size={18} />}
                {item === 'Equipment' && <Wrench size={18} />}
                {item === 'Complaints' && <Flag size={18} />}
                {item === 'Notifications' && <Bell size={18} />}
                {item === 'Settings' && <Settings size={18} />}
                <span>{item}</span>
                {item === 'Notifications' && (
                  <em>{db.notifications.filter((n: Notification) => !n.read && (role === 'State Admin' || n.district === district)).length}</em>
                )}
                {item === 'Applications' && pendingCount > 0 && <em>{pendingCount}</em>}
                {item === 'Complaints' && openComplaints > 0 && <em>{openComplaints}</em>}
              </button>
            );
          })}
        </nav>

        <div className="phase-note">
          <span className="pulse" />
          <span>PORTAL DEMO</span>
          {role === 'Centre' && <select aria-label="Your demo centre" value={activeCentreId} onChange={e => { setActiveCentreId(e.target.value); localStorage.setItem('mahacare-session', JSON.stringify({ role, district, centreId: e.target.value })); }}>
            {db.centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>}
          <p>Multi-role oversight with live browser-retained state.</p>
        </div>

        <div className="sidebar-bottom">
          <div className="avatar">AD</div>
          <div>
            <strong>Demo Operator</strong>
            <small>{role}</small>
          </div>
          <button aria-label="Switch demo role" onClick={() => setLogin(true)}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {mobile && <div className="backdrop" onClick={() => setMobile(false)} />}

      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="top-left">
            <button
              aria-label="Toggle navigation"
              onClick={() => {
                if (window.innerWidth < 900) setMobile(!mobile);
                else setCollapsed(!collapsed);
              }}
            >
              <Menu size={20} />
            </button>
            <span>
              Workspace <span className="slash">/</span> <b>{page}</b>
            </span>
          </div>

          <div className="top-actions">
            <span className="environment">
              <span className="pulse" /> Interactive prototype
            </span>
            <button aria-label="Open notifications" onClick={() => navigate('Notifications')}>
              <Bell size={19} />
            </button>
            <button className="profile-button cursor-pointer" onClick={() => setLogin(true)}>
              <span className="avatar small">AD</span>
              <span>{role}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {/* Demo Strip */}
        <div className="demo-strip">
          <ShieldCheck size={15} />
          <span>
            <b>Demonstration only.</b> All centres, IDs, and records are fictional. Simulates Maharashtra Clinical Oversight.
          </span>
          <Link className="portal-public-link ml-auto text-xs text-teal-700 flex items-center gap-1 font-semibold" href="/">
            Public Portal <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Main Content Area */}
        <main>
          {/* Page Heading */}
          <div className="page-heading">
            <div>
              <div className="eyebrow">MAHARASHTRA · DIAGNOSTIC CENTRE REGULATORY MONITORING</div>
              <h1>
                {page === 'Dashboard'
                  ? role === 'Centre'
                    ? `${centreRoleCentre.name} Dashboard`
                    : role === 'Officer'
                    ? `${district} District Health Officer Console`
                    : 'State Regulatory Registry Overview'
                  : page}
              </h1>
              <p>
                {page === 'Dashboard'
                  ? 'Real-time visibility into registrations, QR verifications, and compliance enforcement.'
                  : `Manage connected records and workflows for ${role === 'State Admin' ? 'Maharashtra State' : district}.`}
              </p>
            </div>

            <div className="flex gap-2">
              {role === 'Officer' && (
                <button
                  className="button primary cursor-pointer"
                  onClick={() => setShowInspectionModal(true)}
                >
                  <ClipboardList size={16} /> Conduct Field Inspection
                </button>
              )}
              <button className="button white cursor-pointer" onClick={() => setLogin(true)}>
                <ShieldCheck size={16} /> Switch Role <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* District Scope Bar */}
          <div className="context-bar">
            <span>
              <span className="pulse" /> Connected Demo Database · Saved in local storage
            </span>
            <div>
              {role !== 'Centre' && (
                <select
                  aria-label="Assigned demo district"
                  value={district}
                  onChange={e => {
                    setDistrict(e.target.value);
                    setIndex(1);
                    localStorage.setItem('mahacare-session', JSON.stringify({ role, district: e.target.value, centreId: activeCentreId }));
                  }}
                >
                  {districts.map((d: string) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              )}
              <span className="scope">
                <MapPin size={14} /> {role === 'State Admin' ? 'All Maharashtra (36 Districts)' : role === 'Centre' ? centreRoleCentre.district : district}
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* DASHBOARD PAGE */}
          {/* ======================================================== */}
          {page === 'Dashboard' && (
            <div className="space-y-6">
              {/* 8 KPI Cards (Admin) or 4 KPI Cards (Officer/Centre) */}
              <section className="stats grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Total Centres */}
                <button
                  className="stat-card cursor-pointer"
                  onClick={() => { navigate(role === 'Centre' ? 'My Centre' : 'Centres'); setStatus('All statuses'); }}
                >
                  <span className="stat-icon blue"><Building2 size={21} /></span>
                  <ArrowUpRight className="stat-arrow" size={16} />
                  <p>{role === 'Officer' ? 'District Centres' : role === 'Centre' ? 'Establishment Status' : 'Total Centres'}</p>
                  <strong>{role === 'Centre' ? 'Active' : String(centres.length).padStart(2, '0')}</strong>
                  <small><span>{role === 'State Admin' ? '36 districts available' : 'Within assigned scope'}</span></small>
                </button>

                {/* 2. Approved Centres */}
                <button
                  className="stat-card cursor-pointer"
                  onClick={() => { navigate('Centres'); setStatus('Approved'); }}
                >
                  <span className="stat-icon teal"><ShieldCheck size={21} /></span>
                  <ArrowUpRight className="stat-arrow" size={16} />
                  <p>Approved Centres</p>
                  <strong>{String(approvedCount).padStart(2, '0')}</strong>
                  <small><span className="text-teal"><Check size={12} /> Application approval granted</span></small>
                </button>

                {/* 3. Pending Reviews */}
                <button
                  className="stat-card cursor-pointer"
                  onClick={() => { navigate(role === 'Officer' ? 'Applications' : 'Centres'); setStatus('Pending verification'); }}
                >
                  <span className="stat-icon orange"><ClipboardList size={21} /></span>
                  <ArrowUpRight className="stat-arrow" size={16} />
                  <p>Pending Verification</p>
                  <strong>{String(pendingCount).padStart(2, '0')}</strong>
                  <small><span>Awaiting review or inspection</span></small>
                </button>

                {/* 4. Expired Documents */}
                <button
                  className="stat-card cursor-pointer"
                  onClick={() => navigate('Documents')}
                >
                  <span className="stat-icon rose"><FileText size={21} /></span>
                  <ArrowUpRight className="stat-arrow" size={16} />
                  <p>Expired Documents</p>
                  <strong>{String(expiredDocs.length).padStart(2, '0')}</strong>
                  <small><span>Requires regulatory renewal</span></small>
                </button>

                {/* 4 Additional Admin KPI Cards */}
                {(role === 'State Admin' || role === 'District Admin') && (
                  <>
                    {/* 5. Inspections Due */}
                    <button className="stat-card cursor-pointer" onClick={() => navigate('Inspections')}>
                      <span className="stat-icon blue"><Clock size={21} /></span>
                      <ArrowUpRight className="stat-arrow" size={16} />
                      <p>Inspections Due / Overdue</p>
                      <strong>{String(overdueInspections).padStart(2, '0')}</strong>
                      <small><span>On-site field visits pending</span></small>
                    </button>

                    {/* 6. Renewals in 60d */}
                    <button className="stat-card cursor-pointer" onClick={() => navigate('Documents')}>
                      <span className="stat-icon orange"><AlertTriangle size={21} /></span>
                      <ArrowUpRight className="stat-arrow" size={16} />
                      <p>Renewals Due (60 Days)</p>
                      <strong>{String(expiringDocs.length).padStart(2, '0')}</strong>
                      <small><span>Permits expiring soon</span></small>
                    </button>

                    {/* 7. Open Complaints */}
                    <button className="stat-card cursor-pointer" onClick={() => navigate('Complaints')}>
                      <span className="stat-icon rose"><Flag size={21} /></span>
                      <ArrowUpRight className="stat-arrow" size={16} />
                      <p>Open Citizen Complaints</p>
                      <strong>{String(openComplaints).padStart(2, '0')}</strong>
                      <small><span>Active grievance inquiries</span></small>
                    </button>

                    {/* 8. New Registrations */}
                    <button className="stat-card cursor-pointer" onClick={() => navigate('Centres')}>
                      <span className="stat-icon teal"><Plus size={21} /></span>
                      <ArrowUpRight className="stat-arrow" size={16} />
                      <p>Recent Registrations</p>
                      <strong>{String(newThisMonth).padStart(2, '0')}</strong>
                      <small><span>Enrolled in registry</span></small>
                    </button>
                  </>
                )}
              </section>

              {/* Rich Visualizations (Recharts) */}
              {(role === 'State Admin' || role === 'District Admin') && (
                <section>
                  <AdminCharts db={db} centres={centres} />
                </section>
              )}

              {/* Lower Grid: Recent records and Attention List */}
              <section className="lower-grid">
                <div className="panel records">
                  <div className="panel-title">
                    <div>
                      <h2>Recent Diagnostic Centres</h2>
                      <p>Latest applicant and approved facilities</p>
                    </div>
                    <button className="text-button" onClick={() => navigate(role === 'Centre' ? 'My Centre' : 'Centres')}>
                      View all ({centres.length}) <ArrowRight size={15} />
                    </button>
                  </div>

                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Centre name</th>
                          <th>District</th>
                          <th>Facility type</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shown.slice(0, 5).map((c: DiagnosticCentre) => (
                          <tr key={c.id}>
                            <td>
                              <button className="centre-link" onClick={() => setDetailCentreId(c.id)}>
                                <span className="centre-icon"><Building2 size={17} /></span>
                                <span>
                                  <strong>{c.name}</strong>
                                  <small translate="no">{c.udcid}</small>
                                </span>
                              </button>
                            </td>
                            <td>{c.district}</td>
                            <td>{c.type}</td>
                            <td><Badge>{c.status}</Badge></td>
                            <td>
                              <div className="flex gap-1.5">
                                <button
                                  className="p-1.5 hover:bg-slate-100 rounded text-teal-700"
                                  title="View file"
                                  onClick={() => setDetailCentreId(c.id)}
                                >
                                  <ArrowUpRight size={16} />
                                </button>
                                {(role === 'Officer' || role === 'State Admin') && (
                                  <button
                                    className="p-1.5 hover:bg-teal-50 rounded text-teal-800 text-xs font-semibold"
                                    title="Review application"
                                    onClick={() => setReviewCentreId(c.id)}
                                  >
                                    Review
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Attention Panel */}
                <div className="panel attention">
                  <div className="panel-title">
                    <div>
                      <h2>Compliance Attention</h2>
                      <p>Actions requiring departmental intervention</p>
                    </div>
                    <span className="attention-dot" />
                  </div>

                  <button onClick={() => navigate('Documents')}>
                    <span className="notice-icon orange"><FileText size={18} /></span>
                    <div>
                      <strong>{expiringDocs.length} documents expiring soon</strong>
                      <p>Within the next 60 days</p>
                    </div>
                    <ArrowUpRight size={16} />
                  </button>

                  <div className="attention-item cursor-pointer" onClick={() => navigate('Inspections')}>
                    <span className="notice-icon blue"><ClipboardList size={18} /></span>
                    <div>
                      <strong>{overdueInspections} inspections scheduled/overdue</strong>
                      <p>Field verification visits</p>
                    </div>
                  </div>

                  <div className="attention-item cursor-pointer" onClick={() => navigate('Complaints')}>
                    <span className="notice-icon teal"><Clock size={18} /></span>
                    <div>
                      <strong>{openComplaints} open citizen grievances</strong>
                      <p>Inquiry and redressal pending</p>
                    </div>
                  </div>

                  <div className="demo-callout">
                    <HeartPulse size={23} />
                    <b>Built for Patient Safety</b>
                    <p>Standardized QR plates empower Maharashtra citizens to verify equipment & safety approvals instantly.</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ======================================================== */}
          {/* CENTRES DIRECTORY PAGE */}
          {/* ======================================================== */}
          {(page === 'Centres' || page === 'My Centre') && (
            <section className="panel space-y-4">
              <div className="panel-title">
                <div>
                  <h2>{role === 'Centre' ? 'Your Centre Profile' : 'Diagnostic Centre Registry'}</h2>
                  <p>{shown.length} diagnostic facilities in your current scope</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportCentres} className="button white text-xs flex items-center gap-1.5 cursor-pointer">
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="filters">
                <label className="search">
                  <Search size={17} />
                  <input
                    placeholder="Search centre name, UDCID, or locality"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setIndex(1); }}
                  />
                </label>

                {role === 'State Admin' && (
                  <select aria-label="Filter district" value={filter} onChange={e => { setFilter(e.target.value); setIndex(1); }}>
                    <option>All districts</option>
                    {districts.map((d: string) => <option key={d}>{d}</option>)}
                  </select>
                )}

                <select aria-label="Application status" value={status} onChange={e => { setStatus(e.target.value); setIndex(1); }}>
                  <option>All statuses</option>
                  <option>Pending verification</option>
                  <option>Approved</option>
                  <option>Correction Required</option>
                  <option>Inspection Scheduled</option>
                  <option>Rejected</option>
                </select>

                <select aria-label="Sort centres" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>

              {/* Centres Table */}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Centre name</th>
                      <th>District & Taluka</th>
                      <th>Facility type</th>
                      <th>Ownership</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.slice((index - 1) * 8, index * 8).map((c: DiagnosticCentre) => (
                      <tr key={c.id}>
                        <td>
                          <button className="centre-link" onClick={() => setDetailCentreId(c.id)}>
                            <span className="centre-icon"><Building2 size={17} /></span>
                            <span>
                              <strong>{c.name}</strong>
                              <small translate="no">{c.udcid}</small>
                            </span>
                          </button>
                        </td>
                        <td>{c.district} ({c.taluka})</td>
                        <td>{c.type}</td>
                        <td>{c.ownershipType}</td>
                        <td><Badge>{c.status}</Badge></td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold text-slate-800"
                              onClick={() => setDetailCentreId(c.id)}
                            >
                              Details
                            </button>
                            {c.status === 'Approved' && role !== 'Officer' && <button className="button white" onClick={() => { setCertificateCentreId(c.id); navigate('QR Plate'); }}>View Certificate</button>}
                            {role === 'Officer' && c.status === 'Inspection Scheduled' && <button className="button primary" onClick={() => { setInspectionCentreId(c.id); setShowInspectionModal(true); }}>Conduct Inspection</button>}
                            {(role === 'Officer' || role === 'State Admin' || role === 'District Admin') && (
                              <button
                                className="py-1 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded text-xs font-semibold"
                                onClick={() => setReviewCentreId(c.id)}
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!shown.length && <div className="empty">No diagnostic centres match your search criteria.</div>}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <span>{shown.length} records · Page {index} of {Math.max(1, Math.ceil(shown.length / 8))}</span>
                <div>
                  <button disabled={index === 1} onClick={() => setIndex(index - 1)}>Previous</button>
                  <button disabled={index * 8 >= shown.length} onClick={() => setIndex(index + 1)}>Next</button>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* GIS MAP VIEW */}
          {/* ======================================================== */}
          {page === 'GIS Map' && (
            <section className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Maharashtra GIS Geospatial Centre Map</h2>
                  <p className="text-xs text-slate-500">Live geo-tagged distribution of diagnostic clinics and imaging hubs</p>
                </div>
                <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full font-mono text-xs font-bold">
                  {centres.length} GPS Pins
                </span>
              </div>
              <GisMap centres={centres} onSelectCentre={id => setDetailCentreId(id)} />
            </section>
          )}

          {/* ======================================================== */}
          {/* OFFICER: APPLICATION REVIEW QUEUE */}
          {/* ======================================================== */}
          {page === 'Applications' && (
            <section className="panel space-y-4">
              <div className="panel-title">
                <div>
                  <h2>Application Review & Inspection Queue</h2>
                  <p>Incoming clinical centre registrations for {district} District</p>
                </div>
                <button
                  disabled={role !== 'Officer'}
                  title={role !== 'Officer' ? 'Switch to Officer to conduct scheduled inspections' : 'Conduct inspection'}
                  className="button primary text-xs flex items-center gap-1.5 cursor-pointer"
                  onClick={() => setShowInspectionModal(true)}
                >
                  <ClipboardList size={14} /> New Field Inspection
                </button>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Centre name</th>
                      <th>Facility type</th>
                      <th>Owner / Director</th>
                      <th>Current status</th>
                      <th>Submitted date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centres.filter((c: DiagnosticCentre) => c.status !== 'Approved').map((c: DiagnosticCentre) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                          <small translate="no">{c.udcid}</small>
                        </td>
                        <td>{c.type}</td>
                        <td>{c.owner.name}</td>
                        <td><Badge>{c.status}</Badge></td>
                        <td>{c.createdAt}</td>
                        <td>
                          <button
                            className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded text-xs shadow-xs"
                            onClick={() => setReviewCentreId(c.id)}
                          >
                            Review & Decide
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {centres.filter((c: DiagnosticCentre) => c.status !== 'Approved').length === 0 && (
                  <div className="empty">All applications in this district have been processed.</div>
                )}
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* FIELD INSPECTIONS PAGE */}
          {/* ======================================================== */}
          {(page === 'Inspections' || page === 'Field Inspections') && (
            <section className="panel space-y-4">
              <div className="panel-title">
                <div>
                  <h2>Field Inspections & Clinical Audits</h2>
                  <p>On-site verifications, GPS logs, and safety evaluations</p>
                </div>
                {role === 'Officer' && (
                  <button
                    className="button primary text-xs flex items-center gap-1.5 cursor-pointer"
                    onClick={() => setShowInspectionModal(true)}
                  >
                    <ClipboardList size={14} /> Conduct Inspection
                  </button>
                )}
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Inspection ID</th>
                      <th>Centre</th>
                      <th>Officer</th>
                      <th>Scheduled / Conducted</th>
                      <th>Checklist result</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspections.map((i: Inspection) => {
                      const c = centres.find((cen: DiagnosticCentre) => cen.id === i.centreId);
                      return (
                        <tr key={i.id}>
                          <td><strong className="font-mono">{i.id}</strong></td>
                          <td>
                            <strong>{c?.name || 'Diagnostic Centre'}</strong>
                            <small>{c?.district}</small>
                          </td>
                          <td>{i.officerName}</td>
                          <td>{i.conductedAt || i.scheduledAt}</td>
                          <td>
                            {i.checklist?.length ? (
                              <span className="text-teal-700 font-semibold text-xs">
                                {i.checklist.filter((item: ChecklistItem) => item.result === 'Compliant').length}/{i.checklist.length} Compliant
                              </span>
                            ) : (
                              <span className="text-slate-400">Pending audit</span>
                            )}
                          </td>
                          <td><Badge>{i.status}</Badge><button className="text-button" onClick={() => setInspectionDetailId(i.id)}>View report</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!inspections.length && <div className="empty">No inspection records found for this scope.</div>}
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* DOCUMENTS & REGULATORY PERMITS */}
          {/* ======================================================== */}
          {page === 'Documents' && (
            <section className="panel space-y-4">
              <div className="panel-title">
                <div>
                  <h2>Statutory Documents & Clearances</h2>
                  <p>AERB certificates, trade licenses, fire safety, and medical council registrations</p>
                </div>
                <div className="flex gap-2">
                  {role === 'Centre' && (
                    <button onClick={() => setShowDocModal(true)} className="button primary text-xs flex items-center gap-1.5 cursor-pointer">
                      <Plus size={14} /> Upload Document
                    </button>
                  )}
                  <button onClick={handleExportDocs} className="button white text-xs flex items-center gap-1.5 cursor-pointer">
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Document / Permit</th>
                      <th>Centre</th>
                      <th>Category</th>
                      <th>Issuing Authority</th>
                      <th>Expiry Date</th>
                      <th>Validity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d: CentreDocument) => {
                      const v = validity(d.expiryDate);
                      return (
                        <tr key={d.id}>
                          <td>
                            <strong>{d.title}</strong>
                            <small className="font-mono">{d.registration}</small>
                          </td>
                          <td>{centres.find((c: DiagnosticCentre) => c.id === d.centreId)?.name}</td>
                          <td>{d.category}</td>
                          <td>{d.issuingAuthority}</td>
                          <td>{d.expiryDate || 'Not applicable'}</td>
                          <td><Badge>{v}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* CITIZEN GRIEVANCES / COMPLAINTS */}
          {/* ======================================================== */}
          {page === 'Complaints' && (
            <section className="panel space-y-4">
              <div className="panel-title">
                <div>
                  <h2>Citizen Grievances & Quality Complaints</h2>
                  <p>Inquiries, service deficiencies, and public reports</p>
                </div>
                <button onClick={handleExportComplaints} className="button white text-xs flex items-center gap-1.5 cursor-pointer">
                  <Download size={14} /> Export CSV
                </button>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Tracking ref</th>
                      <th>Centre</th>
                      <th>Complainant</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((comp: Complaint) => {
                      const c = centres.find((cen: DiagnosticCentre) => cen.id === comp.centreId);
                      return (
                        <tr key={comp.id}>
                          <td><strong className="font-mono text-teal-700" translate="no">{comp.trackingNumber}</strong></td>
                          <td>{c?.name || 'General Inquiry'}</td>
                          <td>
                            <strong>{comp.complainantName}</strong>
                            <small>{comp.complainantContact}</small>
                          </td>
                          <td>{comp.category}</td>
                          <td>{comp.submittedAt}</td>
                          <td><Badge>{comp.status}</Badge></td>
                          <td>
                            <div className="flex gap-2">
                              {role === 'Officer' && comp.status !== 'Resolved' && (
                                <button
                                  className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-xs font-semibold"
                                  onClick={async () => {
                                    const updated = await updateDatabase(db, (draft: Database) => {
                                      const target = draft.complaints.find((x: Complaint) => x.id === comp.id);
                                      if (target) {
                                        target.status = 'Resolved';
                                        target.history.push({
                                          id: `CH-${Date.now()}`,
                                          complaintId: comp.id,
                                          action: 'Resolved by Officer',
                                          actorName: 'Dr. Ajay Bhosale (DHO)',
                                          timestamp: new Date().toISOString().slice(0, 10),
                                          remarks: 'Field inquiry completed and corrective guidance issued to the centre.',
                                        });
                                      }
                                    });
                                    setDb(updated);
                                    setToast(`Complaint ${comp.trackingNumber} marked as Resolved.`);
                                  }}
                                >
                                  Mark Resolved
                                </button>
                              )}
                              <Link
                                href={`/complaint/track?num=${comp.trackingNumber}`}
                                target="_blank"
                                className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1"
                              >
                                Timeline <ArrowUpRight size={12} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!complaints.length && <div className="empty">No grievances logged for this scope.</div>}
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* CENTRE ROLE: QR CERTIFICATE PLATE */}
          {/* ======================================================== */}
          {page === 'QR Plate' && (
            <section>
              {role !== 'Centre' && <label className="block mb-4 text-sm">Approved centre
                <select className="ml-3" aria-label="Certificate centre" value={certificateCentre?.id || ''} onChange={e => setCertificateCentreId(e.target.value)}>
                  {certificateCentres.map(c => <option key={c.id} value={c.id}>{c.name} — {c.udcid}</option>)}
                </select>
              </label>}
              {certificateCentre ? <QrCertificate centre={certificateCentre} /> : <p className="panel p-5">A certificate is available after inspection and administrator approval.</p>}
            </section>
          )}

          {/* ======================================================== */}
          {/* CENTRE ROLE: APPLICATION STATUS TIMELINE */}
          {/* ======================================================== */}
          {page === 'Application Status' && (
            <section className="panel p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Application Progress & Audit Timeline</h2>
                <p className="text-xs text-slate-500">Official log of status transitions and regulatory milestones</p>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-800">Current Legal Status</span>
                  <div className="text-xl font-bold text-teal-950 mt-0.5">{centreRoleCentre.status}</div>
                </div>
                <Badge>{centreRoleCentre.status}</Badge>
              </div>

              <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {db.applicationEvents.filter((e: ApplicationEvent) => e.centreId === centreRoleCentre.id).map((ev: ApplicationEvent, i: number) => (
                  <div key={ev.id || i} className="relative">
                    <div className="absolute -left-8 top-1.5 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-800">{ev.toStatus}</strong>
                        <span className="text-slate-400">· {ev.timestamp}</span>
                      </div>
                      <p className="text-slate-500 mt-0.5">Actor: {ev.actorName} ({ev.actorRole})</p>
                      {ev.remarks && <p className="mt-2 bg-slate-50 p-2.5 rounded-lg text-slate-700">{ev.remarks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* CENTRE ROLE: STAFF & DOCTORS */}
          {/* ======================================================== */}
          {page === 'Staff & Doctors' && (
            <section className="panel p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Medical Practitioners & Technical Staff</h2>
                  <p className="text-xs text-slate-500">Accredited personnel registered for {centreRoleCentre.name}</p>
                </div>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="button primary text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Add Personnel
                </button>
              </div>

              {/* Doctors */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Stethoscope size={16} className="text-teal-600" />
                  Medical Practitioners & Radiologists (MMC Registered)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {centreRoleCentre.doctors.map((d: Doctor, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-sm text-slate-900">{d.name}</strong>
                          <p className="text-slate-500">{d.qualification} · Spec: {d.specialisation || 'Radiology'}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-mono text-[11px] font-bold rounded">
                          {d.registrationNumber}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500">
                        <span>Authority: {d.registrationAuthority}</span>
                        <span>Validity: {d.registrationExpiry}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Staff */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <UserCheck size={16} className="text-teal-600" />
                  Technical & Paramedical Operators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {centreRoleCentre.technicalStaff.map((t: TechnicalStaff, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-sm text-slate-900">{t.name}</strong>
                          <p className="text-slate-500">{t.designation} ({t.qualification})</p>
                        </div>
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-mono text-[11px] font-bold rounded">
                          {t.registrationNumber}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 text-slate-500">
                        <span>Board: {t.registrationAuthority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* CENTRE ROLE: EQUIPMENT & SERVICES */}
          {/* ======================================================== */}
          {page === 'Equipment' && (
            <section className="panel p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Diagnostic Equipment & Modalities</h2>
                  <p className="text-xs text-slate-500">Machinery calibrations and authorized diagnostic services</p>
                </div>
                <button
                  onClick={() => setShowEquipModal(true)}
                  className="button primary text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Log Machinery
                </button>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Equipment name</th>
                      <th>Make & Model</th>
                      <th>Serial number</th>
                      <th>Last calibration</th>
                      <th>Calibration status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centreRoleCentre.equipment.map((eq: Equipment) => (
                      <tr key={eq.id}>
                        <td><strong>{eq.name}</strong></td>
                        <td>{eq.make} ({eq.model})</td>
                        <td><span className="font-mono text-slate-600">{eq.serialNumber}</span></td>
                        <td>{eq.lastCalibrationDate}</td>
                        <td><Badge>Valid</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* NOTIFICATIONS */}
          {/* ======================================================== */}
          {page === 'Notifications' && (
            <section className="panel">
              <div className="panel-title">
                <div>
                  <h2>Workspace Notifications</h2>
                  <p>Regulatory updates, application milestones, and inspection alerts</p>
                </div>
                <button
                  className="button white text-xs cursor-pointer"
                  onClick={async () => {
                    setDb(
                      await updateDatabase(db, (d: Database) => {
                        d.notifications.forEach((n: Notification) => {
                          if (role === 'State Admin' || n.district === district) n.read = true;
                        });
                      })
                    );
                    setToast('All notifications marked as read.');
                  }}
                >
                  Mark all as read
                </button>
              </div>

              {db.notifications
                .filter((n: Notification) => role === 'State Admin' || n.district === district)
                .map((n: Notification) => (
                  <div className="notification" key={n.id}>
                    <Bell size={19} />
                    <span className="flex-1">{n.message}</span>
                    <Badge>{n.read ? 'Read' : 'Unread'}</Badge>
                  </div>
                ))}
            </section>
          )}

          {/* ======================================================== */}
          {/* SETTINGS */}
          {/* ======================================================== */}
          {page === 'Settings' && (
            <section className="panel settings">
              <h2>Demo Environment Settings</h2>
              <p>
                This prototype shares demo records through the local server and caches them on your device. Role selection simulates role-based access control.
              </p>

              <div>
                <h3>Reset Demo Data</h3>
                <p>Replace local sample records with a fresh dataset. Dates will be recalculated relative to today.</p>
                <button className="button danger cursor-pointer" onClick={() => setReset(true)}>
                  <RotateCcw size={16} /> Reset Demo Data
                </button>
              </div>

              <div>
                <h3>Bilingual Support (English / मराठी)</h3>
                <p>
                  Use the language switcher in the header or public site to toggle English and Marathi translations powered by the Google Translate API.
                </p>
              </div>

              <div>
                <h3>System Architecture & Documentation</h3>
                <p>
                  Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Recharts, Leaflet GIS, and SVG QR verification plates.
                </p>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer>
            <span>
              <Activity size={14} /> MahaCare Registry <b>·</b> Maharashtra Diagnostic Centre Monitoring Prototype
            </span>
            <span>Fictional demo data · Shared server registry and offline cache</span>
          </footer>
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* Centre Detail Modal */}
      {detailCentreId && selectedDetail && (
        <Modal title="Diagnostic Centre Profile" onClose={() => setDetailCentreId(null)}>
          <span className="eyebrow" translate="no">FICTIONAL SAMPLE · {selectedDetail.udcid}</span>
          <h3 className="detail-title">{selectedDetail.name}</h3>
          <Badge>{selectedDetail.status}</Badge>

          <dl>
            <dt>District / Taluka</dt>
            <dd>{selectedDetail.district} / {selectedDetail.taluka}</dd>
            <dt>Facility Type</dt>
            <dd>{selectedDetail.type}</dd>
            <dt>Ownership</dt>
            <dd>{selectedDetail.ownershipType}</dd>
            <dt>Address</dt>
            <dd>{selectedDetail.address} — {selectedDetail.pincode}</dd>
            <dt>Medical Director</dt>
            <dd>{selectedDetail.owner.name} ({selectedDetail.owner.qualification})</dd>
            <dt>Services</dt>
            <dd>{selectedDetail.services.join(', ')}</dd>
            <dt>Last Updated</dt>
            <dd>{selectedDetail.updatedAt}</dd>
          </dl>

          <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-200">
            <Link
              href={`/centres/${selectedDetail.udcid}`}
              target="_blank"
              className="button white text-xs flex items-center gap-1.5"
            >
              Public Profile <ExternalLink size={14} />
            </Link>
            {(role === 'Officer' || role === 'State Admin' || role === 'District Admin') && (
              <button
                className="button primary text-xs"
                onClick={() => {
                  setReviewCentreId(selectedDetail.id);
                  setDetailCentreId(null);
                }}
              >
                Open Review Panel
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Officer Application Review Modal */}
      {reviewCentreId && selectedReview && (
        <ApplicationReviewModal
          centre={selectedReview}
          db={db}
          currentRole={role}
          onClose={() => setReviewCentreId(null)}
          onSuccess={(updatedDb, msg) => {
            setDb(updatedDb);
            setToast(msg);
          }}
        />
      )}

      {inspectionDetail && <Modal title="Inspection report" onClose={() => setInspectionDetailId(undefined)}>
        <p>{inspectionDetail.officerName} · {inspectionDetail.conductedAt || inspectionDetail.scheduledAt}</p>
        <p>GPS: {inspectionDetail.gpsLat ?? 'Not captured'}, {inspectionDetail.gpsLng ?? 'Not captured'} · Accuracy: {inspectionDetail.gpsAccuracy ? `±${Math.round(inspectionDetail.gpsAccuracy)} m` : 'Not recorded'}</p>
        <p>{inspectionDetail.remarks}</p>
        <ul>{inspectionDetail.checklist.map(item => <li key={item.id}>{item.label}: <strong>{item.result}</strong></li>)}</ul>
        <div className="grid grid-cols-2 gap-3 mt-3">{inspectionDetail.photos?.map(photo => <figure key={photo.id}><img src={photo.dataUrl} alt={photo.name} className="w-full rounded" /><figcaption>{photo.name} · {new Date(photo.capturedAt).toLocaleString('en-IN')}</figcaption></figure>)}</div>
      </Modal>}
      {/* Officer Field Inspection Wizard Modal */}
      {showInspectionModal && (
        <InspectionModal
          db={db}
          officerDistrict={district}
          initialCentreId={inspectionCentreId}
          onClose={() => setShowInspectionModal(false)}
          onSuccess={(updatedDb, msg) => {
            setDb(updatedDb);
            setToast(msg);
          }}
        />
      )}

      {/* Add Staff Modal (Centre role) */}
      {showStaffModal && (
        <Modal title="Register Medical Personnel" onClose={() => setShowStaffModal(false)}>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Personnel Type *</label>
              <select
                value={newStaff.roleType}
                onChange={e => setNewStaff({ ...newStaff, roleType: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
              >
                <option value="doctor">Medical Practitioner / Radiologist (MMC)</option>
                <option value="tech">Paramedical / Imaging Technician</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Dr. Anand Deshpande"
                value={newStaff.name}
                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Qualification *</label>
              <input
                required
                type="text"
                placeholder="e.g. MBBS, DMRD or DMLT"
                value={newStaff.qualification}
                onChange={e => setNewStaff({ ...newStaff, qualification: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Council Registration No *</label>
              <input
                required
                type="text"
                placeholder="e.g. MMC-2015-08123 or MPTB-2019-9182"
                value={newStaff.regNum}
                onChange={e => setNewStaff({ ...newStaff, regNum: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => setShowStaffModal(false)} className="button white text-xs">Cancel</button>
              <button type="submit" className="button primary text-xs">Save Personnel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Equipment Modal */}
      {showEquipModal && (
        <Modal title="Log Diagnostic Machinery" onClose={() => setShowEquipModal(false)}>
          <form onSubmit={handleAddEquip} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Equipment Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. 1.5T Superconducting MRI Scanner"
                value={newEquip.name}
                onChange={e => setNewEquip({ ...newEquip, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Make / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Siemens Healthineers"
                  value={newEquip.make}
                  onChange={e => setNewEquip({ ...newEquip, make: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Model</label>
                <input
                  type="text"
                  placeholder="e.g. Magnetom Amira"
                  value={newEquip.model}
                  onChange={e => setNewEquip({ ...newEquip, model: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Serial Number *</label>
              <input
                required
                type="text"
                placeholder="e.g. SN-MAG-2024-981"
                value={newEquip.serialNumber}
                onChange={e => setNewEquip({ ...newEquip, serialNumber: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Calibration Date</label>
              <input
                type="date"
                value={newEquip.calibDate}
                onChange={e => setNewEquip({ ...newEquip, calibDate: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => setShowEquipModal(false)} className="button white text-xs">Cancel</button>
              <button type="submit" className="button primary text-xs">Register Equipment</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Document Modal */}
      {showDocModal && (
        <Modal title="Upload Regulatory Document" onClose={() => setShowDocModal(false)}>
          <form onSubmit={handleAddDoc} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Document Title *</label>
              <input
                required
                type="text"
                placeholder="e.g. Fire Safety Certificate / AERB NOC"
                value={newDoc.title}
                onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category *</label>
              <select
                value={newDoc.category}
                onChange={e => setNewDoc({ ...newDoc, category: e.target.value as any })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
              >
                <option value="Trade Licence">Trade Licence</option>
                <option value="Fire Safety">Fire Safety</option>
                <option value="AERB Clearance">AERB Clearance</option>
                <option value="Radiation Safety">Radiation Safety</option>
                <option value="Professional Registration">Professional Registration</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Licence / Registration No *</label>
              <input
                required
                type="text"
                placeholder="e.g. MH-PMC-FIRE-2024-098"
                value={newDoc.registration}
                onChange={e => setNewDoc({ ...newDoc, registration: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Issuing Authority</label>
                <input
                  type="text"
                  placeholder="e.g. Municipal Corporation"
                  value={newDoc.authority}
                  onChange={e => setNewDoc({ ...newDoc, authority: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newDoc.expiryDate}
                  onChange={e => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => setShowDocModal(false)} className="button white text-xs">Cancel</button>
              <button type="submit" className="button primary text-xs">Upload Document</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Role Switcher Modal */}
      {login && (
        <Modal title="Choose Demo Role Workspace" onClose={() => setLogin(false)}>
          <p className="muted">
            Explore the connected Maharashtra clinical registry through different viewpoints. All roles share the same live state.
          </p>
          <div className="role-grid">
            {roles.map(r => (
              <button
                key={r}
                className={role === r ? 'selected' : ''}
                onClick={() => {
                  chooseRole(r);
                  setLogin(false);
                  setToast(`${r} workspace opened.`);
                }}
              >
                <ShieldCheck size={22} />
                <strong>{r}</strong>
                <small>
                  {r === 'State Admin'
                    ? 'Statewide health registry, 8 KPI cards & charts'
                    : r === 'District Admin'
                    ? `${district} district administration & compliance`
                    : r === 'Officer'
                    ? 'Field inspections, GPS audits & approvals'
                    : 'Sahyadri MRI: QR plate, staff & renewals'}
                </small>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Reset Data Confirmation */}
      {reset && (
        <Modal title="Reset Demo Records?" onClose={() => setReset(false)}>
          <p>
            This clears this browser cache and reloads the shared registry. Shared records and pending offline reports are preserved.
          </p>
          <div className="dialog-actions">
            <button className="button white cursor-pointer" onClick={() => setReset(false)}>Cancel</button>
            <button
              className="button danger cursor-pointer"
              onClick={async () => {
                const fresh = seed();
                localStorage.removeItem('mahacare-db-v3');
                setDb((await load()).db);
                setReset(false);
                setToast('Demo data reset successfully.');
              }}
            >
              Reset Demo Data
            </button>
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{toast}</span>
          <button aria-label="Dismiss message" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
