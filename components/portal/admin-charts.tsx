'use client';
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import type { Database, DiagnosticCentre } from '../../lib/types';
import { districts, validity } from '../../lib/data';

const COLORS = ['#0d9488', '#1e3a5f', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
const STATUS_COLORS: Record<string, string> = {
  Valid: '#10b981',
  'Expiring Soon': '#f59e0b',
  Expired: '#ef4444',
  'Not Applicable': '#94a3b8',
};

interface ChartsProps {
  db: Database;
  centres: DiagnosticCentre[];
}

export default function AdminCharts({ db, centres }: ChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
        <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  // 1. District Data
  const districtData = districts.map(d => ({
    name: d.length > 9 ? d.slice(0, 7) + '…' : d,
    fullName: d,
    centres: centres.filter(c => c.district === d).length,
    approved: centres.filter(c => c.district === d && c.status === 'Approved').length,
  }));

  // 2. Facility Type Data
  const typeMap: Record<string, number> = {};
  centres.forEach(c => {
    typeMap[c.type] = (typeMap[c.type] || 0) + 1;
  });
  const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  // 3. 12-Month Registration Growth
  const monthlyData = [
    { month: 'Nov 23', registrations: 1 },
    { month: 'Dec 23', registrations: 2 },
    { month: 'Jan 24', registrations: 3 },
    { month: 'Feb 24', registrations: 2 },
    { month: 'Mar 24', registrations: 4 },
    { month: 'Apr 24', registrations: 3 },
    { month: 'May 24', registrations: 4 },
    { month: 'Jun 24', registrations: 5 },
    { month: 'Jul 24', registrations: 3 },
    { month: 'Aug 24', registrations: 2 },
    { month: 'Sep 24', registrations: 2 },
    { month: 'Oct 24', registrations: 1 },
  ];

  // 4. Document Compliance Distribution
  const docValidityMap = { Valid: 0, 'Expiring Soon': 0, Expired: 0 };
  db.documents.forEach(d => {
    const v = validity(d.expiryDate);
    if (v === 'Valid') docValidityMap.Valid++;
    else if (v === 'Expiring Soon') docValidityMap['Expiring Soon']++;
    else if (v === 'Expired') docValidityMap.Expired++;
  });
  const docData = [
    { name: 'Valid', count: docValidityMap.Valid, fill: '#10b981' },
    { name: 'Expiring (60d)', count: docValidityMap['Expiring Soon'], fill: '#f59e0b' },
    { name: 'Expired', count: docValidityMap.Expired, fill: '#ef4444' },
  ];

  // 5. Complaint Resolution Status
  const complaintStatusMap: Record<string, number> = { Open: 0, 'Under Investigation': 0, Resolved: 0 };
  db.complaints.forEach(c => {
    if (c.status === 'Resolved' || c.status === 'Closed') complaintStatusMap.Resolved++;
    else if (c.status === 'Under Investigation' || c.status === 'Assigned') complaintStatusMap['Under Investigation']++;
    else complaintStatusMap.Open++;
  });
  const complaintData = [
    { name: 'Resolved / Closed', value: complaintStatusMap.Resolved, color: '#10b981' },
    { name: 'Under Investigation', value: complaintStatusMap['Under Investigation'], color: '#f59e0b' },
    { name: 'Open / Unassigned', value: complaintStatusMap.Open, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* Top 2 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">District Centre Volume</h3>
              <p className="text-xs text-slate-500">Total registered vs Approved centres by district</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 font-semibold rounded-full text-slate-700">
              {centres.length} Centres
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name, item) => [`${val} centres`, name === 'centres' ? 'Total' : 'Approved']}
                  labelFormatter={label => {
                    const row = districtData.find(d => d.name === label);
                    return row ? row.fullName : label;
                  }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="centres" name="Total Centres" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facility Types Donut Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Facility Type Distribution</h3>
              <p className="text-xs text-slate-500">Classification across diagnostic service types</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} centres`, name]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '11px', lineHeight: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom 3 charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 12-Month Growth Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Registration Trend</h3>
            <p className="text-xs text-slate-500">12-month registration intake</p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="registrations" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Compliance Health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Document Health</h3>
            <p className="text-xs text-slate-500">Regulatory permits & clearances</p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={85} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val) => [`${val} documents`, 'Total']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {docData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Citizen Grievance Resolution Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Citizen Grievances</h3>
            <p className="text-xs text-slate-500">Resolution & inquiry status</p>
          </div>
          <div className="h-52 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complaintData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {complaintData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} grievances`, name]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
