// ============================================================
// lib/data.ts — Static seed data for MahaCare Demo Registry
// All names, registration numbers, and records are fictional.
// ============================================================
import type {
  Database, DiagnosticCentre, CentreDocument, ApplicationEvent,
  Inspection, Complaint, Notification, AppUser, ValidityStatus
} from './types';

export type {
  Role, Database, DiagnosticCentre, CentreDocument, ApplicationEvent,
  Inspection, Complaint, Notification, AppUser, ValidityStatus
} from './types';

// Maharashtra Planning Department: https://plan.maharashtra.gov.in/en/36-districts/
export const districts = [
  'Pune', 'Mumbai City', 'Mumbai Suburban', 'Thane', 'Nashik', 'Nagpur',
  'Satara', 'Kolhapur', 'Chhatrapati Sambhajinagar', 'Ahilyanagar', 'Akola',
  'Amravati', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dharashiv',
  'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Latur',
  'Nanded', 'Nandurbar', 'Palghar', 'Parbhani', 'Raigad', 'Ratnagiri',
  'Sangli', 'Sindhudurg', 'Solapur', 'Wardha', 'Washim', 'Yavatmal',
];

export const talukas: Record<string, string[]> = {
  Pune: ['Haveli', 'Pune City', 'Shirur', 'Maval', 'Mulshi', 'Khed'],
  'Mumbai City': ['Mumbai City'],
  'Mumbai Suburban': ['Andheri', 'Borivali', 'Kurla'],
  Thane: ['Thane City', 'Kalyan', 'Bhiwandi', 'Murbad'],
  Nashik: ['Nashik City', 'Sinnar', 'Igatpuri', 'Dindori'],
  Nagpur: ['Nagpur City', 'Kamptee', 'Hingna', 'Parseoni'],
  Satara: ['Satara City', 'Patan', 'Mahabaleshwar'],
  Kolhapur: ['Kolhapur City', 'Karveer', 'Hatkanangle'],
  'Chhatrapati Sambhajinagar': ['Aurangabad City', 'Paithan', 'Gangapur'],
};

export const facilityTypes = [
  'MRI Centre', 'CT Scan Centre', 'Pathology Laboratory',
  'X-Ray Centre', 'Sonography Centre', 'Multi-service Diagnostic Centre',
];

export const allServices = [
  'MRI Scan', 'CT Scan', 'X-Ray', 'Ultrasound / Sonography',
  'Blood Tests', 'Urine Analysis', 'Biopsy', 'Mammography',
  'PET Scan', 'Bone Densitometry', 'Echocardiography', 'ECG',
  'Pulmonary Function Test', 'Thyroid Profile', 'Lipid Profile',
  'HbA1c', 'COVID-19 RT-PCR', 'Culture & Sensitivity',
];

// ─── Utility helpers ────────────────────────────────────────
export function daysUntil(dateStr: string): number {
  if (!dateStr) return 9999;
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function validity(dateStr: string): ValidityStatus {
  if (!dateStr) return 'Not Applicable';
  const d = daysUntil(dateStr);
  if (d < 0) return 'Expired';
  if (d <= 60) return 'Expiring Soon';
  return 'Valid';
}

export function scopedCentres(db: Database, role: string, district: string): DiagnosticCentre[] {
  if (role === 'State Admin') return db.centres;
  if (role === 'Centre') return db.centres.filter(c => c.id === 'C001');
  return db.centres.filter(c => c.district === district);
}

// ─── Offset from today ──────────────────────────────────────
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Seed function ──────────────────────────────────────────
export function seed(): Database {
  const centres: DiagnosticCentre[] = [
    // ── PUNE (6) ────────────────────────────────────────────
    {
      id: 'C001', udcid: 'MH-PUN-2024-001', name: 'Sahyadri MRI & Diagnostic Centre',
      type: 'MRI Centre', ownershipType: 'Private', district: 'Pune', taluka: 'Haveli',
      address: '14, Vitthal Nagar, Near Pune-Satara Road, Haveli', pincode: '411041',
      phone: '020-XXXXXXX1', email: 'info@sahyadrimri.example',
      gpsLat: 18.4648, gpsLng: 73.8578,
      owner: { name: 'Dr. Priya Kulkarni', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX01' },
      doctors: [{ name: 'Dr. Priya Kulkarni', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX01', registrationNumber: 'MCI-2009-MH-04821', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(480), specialisation: 'Radiology' }],
      technicalStaff: [{ name: 'Rakesh Pawar', qualification: 'DMLT', designation: 'MRI Technologist', phone: '97XXXXXX11', registrationNumber: 'MPTB-2018-04211', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['MRI Scan', 'X-Ray', 'Blood Tests'],
      equipment: [{ id: 'E001', name: 'MRI Scanner 1.5T', make: 'GE Healthcare', model: 'SIGNA Explorer', serialNumber: 'SN-MRI-4821', lastCalibrationDate: daysFromNow(-30) }],
      status: 'Approved', createdAt: daysFromNow(-320), updatedAt: daysFromNow(-5), approvedAt: daysFromNow(-200), lastInspectionDate: daysFromNow(-90),
    },
    {
      id: 'C002', udcid: 'MH-PUN-2024-002', name: 'Deccan CT & Imaging Solutions',
      type: 'CT Scan Centre', ownershipType: 'Private', district: 'Pune', taluka: 'Pune City',
      address: '7B, Deccan Gymkhana Road, Pune City', pincode: '411004',
      phone: '020-XXXXXXX2', email: 'contact@deccanct.example',
      gpsLat: 18.5195, gpsLng: 73.8445,
      owner: { name: 'Dr. Anil Deshmukh', qualification: 'MBBS, DNB Radiology', phone: '98XXXXXX02' },
      doctors: [{ name: 'Dr. Anil Deshmukh', qualification: 'MBBS, DNB Radiology', phone: '98XXXXXX02', registrationNumber: 'MCI-2011-MH-06321', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(390) }],
      technicalStaff: [{ name: 'Suresh Jadhav', qualification: 'BMLT', designation: 'CT Technologist', phone: '96XXXXXX22', registrationNumber: 'MPTB-2020-05512', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['CT Scan', 'X-Ray', 'Mammography'],
      equipment: [{ id: 'E002', name: 'CT Scanner 128-slice', make: 'GE Healthcare', model: 'Revolution CT', serialNumber: 'SN-CT-6321', lastCalibrationDate: daysFromNow(-60) }],
      status: 'Approved', createdAt: daysFromNow(-280), updatedAt: daysFromNow(-12), approvedAt: daysFromNow(-180), lastInspectionDate: daysFromNow(-120),
    },
    {
      id: 'C003', udcid: 'MH-PUN-2024-003', name: 'Kasba Pathology & Lab Services',
      type: 'Pathology Laboratory', ownershipType: 'Trust / NGO', district: 'Pune', taluka: 'Pune City',
      address: '33, Kasba Peth, Near Kasba Ganpati, Pune City', pincode: '411011',
      phone: '020-XXXXXXX3', email: 'lab@kasbapathology.example',
      gpsLat: 18.5214, gpsLng: 73.8600,
      owner: { name: 'Dr. Sunita Gaikwad', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX03' },
      doctors: [{ name: 'Dr. Sunita Gaikwad', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX03', registrationNumber: 'MCI-2007-MH-03412', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(720) }],
      technicalStaff: [{ name: 'Meena Shinde', qualification: 'DMLT', designation: 'Lab Technician', phone: '95XXXXXX33', registrationNumber: 'MPTB-2019-03311', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['Blood Tests', 'Urine Analysis', 'Biopsy', 'Thyroid Profile', 'HbA1c', 'Lipid Profile'],
      equipment: [{ id: 'E003', name: 'Haematology Analyser', make: 'Sysmex', model: 'XN-550', serialNumber: 'SN-HA-3412', lastCalibrationDate: daysFromNow(-15) }],
      status: 'Approved', createdAt: daysFromNow(-400), updatedAt: daysFromNow(-3), approvedAt: daysFromNow(-300), lastInspectionDate: daysFromNow(-45),
    },
    {
      id: 'C004', udcid: 'MH-PUN-2024-004', name: 'Pimpri Sonography & Women\'s Clinic',
      type: 'Sonography Centre', ownershipType: 'Private', district: 'Pune', taluka: 'Haveli',
      address: '88, MIDC Area, Pimpri, Haveli', pincode: '411018',
      phone: '020-XXXXXXX4', email: 'sono@pimprisono.example',
      gpsLat: 18.6298, gpsLng: 73.7997,
      owner: { name: 'Dr. Vandana More', qualification: 'MBBS, DGO', phone: '98XXXXXX04' },
      doctors: [{ name: 'Dr. Vandana More', qualification: 'MBBS, DGO', phone: '98XXXXXX04', registrationNumber: 'MCI-2013-MH-07821', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(50) }],
      technicalStaff: [],
      services: ['Ultrasound / Sonography', 'Blood Tests'],
      equipment: [{ id: 'E004', name: 'Ultrasound Machine', make: 'Philips', model: 'EPIQ 5', serialNumber: 'SN-US-7821', lastCalibrationDate: daysFromNow(-90) }],
      status: 'Under Review', createdAt: daysFromNow(-45), updatedAt: daysFromNow(-2), approvedAt: undefined,
    },
    {
      id: 'C005', udcid: 'MH-PUN-2024-005', name: 'Khadki X-Ray & Diagnostic',
      type: 'X-Ray Centre', ownershipType: 'Government', district: 'Pune', taluka: 'Haveli',
      address: '5, Military Road, Khadki, Haveli', pincode: '411003',
      phone: '020-XXXXXXX5', email: 'xray@khadkidiag.example',
      gpsLat: 18.5668, gpsLng: 73.8475,
      owner: { name: 'Dr. Ramesh Tilekar', qualification: 'MBBS', phone: '98XXXXXX05' },
      doctors: [{ name: 'Dr. Ramesh Tilekar', qualification: 'MBBS', phone: '98XXXXXX05', registrationNumber: 'MCI-2015-MH-09121', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(900) }],
      technicalStaff: [{ name: 'Ganesh Bhosale', qualification: 'DMRT', designation: 'Radiographer', phone: '94XXXXXX55', registrationNumber: 'MPTB-2021-06213', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['X-Ray'],
      equipment: [{ id: 'E005', name: 'Digital X-Ray Unit', make: 'Carestream', model: 'DRX-Evolution', serialNumber: 'SN-XR-9121', lastCalibrationDate: daysFromNow(-180) }],
      status: 'Correction Required', createdAt: daysFromNow(-60), updatedAt: daysFromNow(-10),
    },
    {
      id: 'C006', udcid: 'MH-PUN-2024-006', name: 'Maval Multicare Diagnostic Hub',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Private', district: 'Pune', taluka: 'Maval',
      address: '12, Maval Industrial Estate, Talegaon, Maval', pincode: '410507',
      phone: '021-XXXXXXX6', email: 'info@mavalmulticare.example',
      gpsLat: 18.7285, gpsLng: 73.6629,
      owner: { name: 'Dr. Kiran Patil', qualification: 'MBBS, MD', phone: '98XXXXXX06' },
      doctors: [{ name: 'Dr. Kiran Patil', qualification: 'MBBS, MD', phone: '98XXXXXX06', registrationNumber: 'MCI-2010-MH-05521', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(600) }],
      technicalStaff: [{ name: 'Pooja Salunke', qualification: 'BMLT', designation: 'Lab Supervisor', phone: '93XXXXXX66', registrationNumber: 'MPTB-2017-02811', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['MRI Scan', 'CT Scan', 'X-Ray', 'Blood Tests', 'Ultrasound / Sonography', 'ECG'],
      equipment: [
        { id: 'E006a', name: 'MRI Scanner 1.5T', make: 'Philips', model: 'Ingenia', serialNumber: 'SN-MRI-5521', lastCalibrationDate: daysFromNow(-45) },
        { id: 'E006b', name: 'CT Scanner 64-slice', make: 'Toshiba', model: 'Aquilion', serialNumber: 'SN-CT-5521', lastCalibrationDate: daysFromNow(-60) },
      ],
      status: 'Inspection Scheduled', createdAt: daysFromNow(-90), updatedAt: daysFromNow(-1), approvedAt: undefined,
    },

    // ── MUMBAI (6) ──────────────────────────────────────────
    {
      id: 'C007', udcid: 'MH-MUM-2024-001', name: 'Andheri Advanced Diagnostics',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Private', district: 'Mumbai Suburban', taluka: 'Andheri',
      address: '22A, Veera Industrial Estate, Andheri West', pincode: '400053',
      phone: '022-XXXXXXX7', email: 'admin@andheriadvanced.example',
      gpsLat: 19.1136, gpsLng: 72.8697,
      owner: { name: 'Dr. Farida Shaikh', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX07' },
      doctors: [{ name: 'Dr. Farida Shaikh', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX07', registrationNumber: 'MCI-2008-MH-04112', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(365) }],
      technicalStaff: [{ name: 'Ahmed Khan', qualification: 'BMLT', designation: 'Senior Technician', phone: '91XXXXXX77', registrationNumber: 'MPTB-2016-01912', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['MRI Scan', 'CT Scan', 'Blood Tests', 'Ultrasound / Sonography', 'ECG', 'Mammography'],
      equipment: [
        { id: 'E007a', name: 'MRI 3T', make: 'GE', model: 'SIGNA Premier', serialNumber: 'SN-MRI-4112', lastCalibrationDate: daysFromNow(-20) },
        { id: 'E007b', name: 'CT 128-slice', make: 'Siemens', model: 'SOMATOM Definition AS+', serialNumber: 'SN-CT-4112', lastCalibrationDate: daysFromNow(-35) },
      ],
      status: 'Approved', createdAt: daysFromNow(-500), updatedAt: daysFromNow(-2), approvedAt: daysFromNow(-350), lastInspectionDate: daysFromNow(-60),
    },
    {
      id: 'C008', udcid: 'MH-MUM-2024-002', name: 'Borivali MRI & Scan Centre',
      type: 'MRI Centre', ownershipType: 'Private', district: 'Mumbai Suburban', taluka: 'Borivali',
      address: '5, Laxmi Complex, Borivali West', pincode: '400092',
      phone: '022-XXXXXXX8', email: 'mri@borivali.example',
      gpsLat: 19.2344, gpsLng: 72.8569,
      owner: { name: 'Dr. Suhas Mehta', qualification: 'MD Radiology', phone: '98XXXXXX08' },
      doctors: [{ name: 'Dr. Suhas Mehta', qualification: 'MD Radiology', phone: '98XXXXXX08', registrationNumber: 'MCI-2012-MH-07011', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(540) }],
      technicalStaff: [{ name: 'Ritu Nair', qualification: 'DMRT', designation: 'MRI Technologist', phone: '90XXXXXX88', registrationNumber: 'MPTB-2019-04812', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['MRI Scan', 'X-Ray'],
      equipment: [{ id: 'E008', name: 'MRI Scanner 1.5T', make: 'Siemens', model: 'MAGNETOM Aera', serialNumber: 'SN-MRI-7011', lastCalibrationDate: daysFromNow(-50) }],
      status: 'Approved', createdAt: daysFromNow(-380), updatedAt: daysFromNow(-8), approvedAt: daysFromNow(-250), lastInspectionDate: daysFromNow(-110),
    },
    {
      id: 'C009', udcid: 'MH-MUM-2024-003', name: 'Kurla Metro Pathology Lab',
      type: 'Pathology Laboratory', ownershipType: 'Private', district: 'Mumbai Suburban', taluka: 'Kurla',
      address: '101, Nehru Nagar, Kurla East', pincode: '400024',
      phone: '022-XXXXXXX9', email: 'lab@kurlapath.example',
      gpsLat: 19.0726, gpsLng: 72.8792,
      owner: { name: 'Dr. Rohan Shetty', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX09' },
      doctors: [{ name: 'Dr. Rohan Shetty', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX09', registrationNumber: 'MCI-2009-MH-05011', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(-10) }],
      technicalStaff: [],
      services: ['Blood Tests', 'Urine Analysis', 'Thyroid Profile', 'HbA1c', 'Lipid Profile', 'COVID-19 RT-PCR'],
      equipment: [{ id: 'E009', name: 'Biochemistry Analyser', make: 'Abbott', model: 'ARCHITECT c4000', serialNumber: 'SN-BA-5011', lastCalibrationDate: daysFromNow(-200) }],
      status: 'Approved', createdAt: daysFromNow(-600), updatedAt: daysFromNow(-15), approvedAt: daysFromNow(-500), lastInspectionDate: daysFromNow(-200),
    },
    {
      id: 'C010', udcid: 'MH-MUM-2024-004', name: 'Ghatkopar CT Diagnostic Services',
      type: 'CT Scan Centre', ownershipType: 'Private', district: 'Mumbai Suburban', taluka: 'Ghatkopar',
      address: '8, Asalpha Village, Ghatkopar West', pincode: '400084',
      phone: '022-XXXXXXA', email: 'ct@ghatkopar.example',
      gpsLat: 19.0887, gpsLng: 72.9086,
      owner: { name: 'Dr. Lalita Vora', qualification: 'MBBS, DNB Radiology', phone: '98XXXXXX10' },
      doctors: [{ name: 'Dr. Lalita Vora', qualification: 'MBBS, DNB Radiology', phone: '98XXXXXX10', registrationNumber: 'MCI-2014-MH-08211', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(800) }],
      technicalStaff: [{ name: 'Prashant Gupta', qualification: 'DMRT', designation: 'CT Technologist', phone: '89XXXXXX10', registrationNumber: 'MPTB-2021-07412', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['CT Scan', 'X-Ray', 'ECG'],
      equipment: [{ id: 'E010', name: 'CT 64-slice', make: 'Philips', model: 'Brilliance CT', serialNumber: 'SN-CT-8211', lastCalibrationDate: daysFromNow(-75) }],
      status: 'Under Review', createdAt: daysFromNow(-35), updatedAt: daysFromNow(-5),
    },
    {
      id: 'C011', udcid: 'MH-MUM-2024-005', name: 'Mumbai City Sonography Clinic',
      type: 'Sonography Centre', ownershipType: 'Private', district: 'Mumbai City', taluka: 'Mumbai City',
      address: '14, Bhulabhai Desai Road, Mumbai City', pincode: '400026',
      phone: '022-XXXXXXB', email: 'sono@mumbaicity.example',
      gpsLat: 18.9728, gpsLng: 72.8102,
      owner: { name: 'Dr. Shehnaz Irani', qualification: 'MBBS, DGO', phone: '98XXXXXX11' },
      doctors: [{ name: 'Dr. Shehnaz Irani', qualification: 'MBBS, DGO', phone: '98XXXXXX11', registrationNumber: 'MCI-2016-MH-09811', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(1000) }],
      technicalStaff: [],
      services: ['Ultrasound / Sonography'],
      equipment: [{ id: 'E011', name: 'Ultrasound System', make: 'Samsung', model: 'HERA W10', serialNumber: 'SN-US-9811', lastCalibrationDate: daysFromNow(-10) }],
      status: 'Draft', createdAt: daysFromNow(-7), updatedAt: daysFromNow(-1),
    },
    {
      id: 'C012', udcid: 'MH-MUM-2024-006', name: 'Andheri Maa Diagnostic Trust',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Trust / NGO', district: 'Mumbai Suburban', taluka: 'Andheri',
      address: '55B, Chakala, Andheri East', pincode: '400099',
      phone: '022-XXXXXXC', email: 'trust@maadiac.example',
      gpsLat: 19.1050, gpsLng: 72.8656,
      owner: { name: 'Dr. Neha Parab', qualification: 'MBBS, MS', phone: '98XXXXXX12' },
      doctors: [{ name: 'Dr. Neha Parab', qualification: 'MBBS, MS', phone: '98XXXXXX12', registrationNumber: 'MCI-2011-MH-06812', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(290) }],
      technicalStaff: [{ name: 'Dawood Ansari', qualification: 'DMLT', designation: 'Lab In-charge', phone: '87XXXXXX12', registrationNumber: 'MPTB-2018-03512', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['Blood Tests', 'Urine Analysis', 'X-Ray', 'Ultrasound / Sonography'],
      equipment: [{ id: 'E012', name: 'Portable X-Ray', make: 'Shimadzu', model: 'MobileArt', serialNumber: 'SN-XR-6812', lastCalibrationDate: daysFromNow(-120) }],
      status: 'Approved', createdAt: daysFromNow(-440), updatedAt: daysFromNow(-20), approvedAt: daysFromNow(-310), lastInspectionDate: daysFromNow(-150),
    },

    // ── THANE (4) ───────────────────────────────────────────
    {
      id: 'C013', udcid: 'MH-THA-2024-001', name: 'Thane X-Ray & Diagnostic Studio',
      type: 'X-Ray Centre', ownershipType: 'Private', district: 'Thane', taluka: 'Thane City',
      address: '3, Naupada Road, Thane West', pincode: '400602',
      phone: '022-XXXXXXD', email: 'xray@thanediag.example',
      gpsLat: 19.1924, gpsLng: 72.9726,
      owner: { name: 'Dr. Mahesh Sawant', qualification: 'MBBS', phone: '98XXXXXX13' },
      doctors: [{ name: 'Dr. Mahesh Sawant', qualification: 'MBBS', phone: '98XXXXXX13', registrationNumber: 'MCI-2017-MH-10213', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(44) }],
      technicalStaff: [{ name: 'Vijay Rane', qualification: 'DMRT', designation: 'Radiographer', phone: '96XXXXXX13', registrationNumber: 'MPTB-2022-08113', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['X-Ray'],
      equipment: [{ id: 'E013', name: 'X-Ray Unit CR', make: 'Fujifilm', model: 'FCR Capsula II', serialNumber: 'SN-XR-10213', lastCalibrationDate: daysFromNow(-240) }],
      status: 'Approved', createdAt: daysFromNow(-250), updatedAt: daysFromNow(-30), approvedAt: daysFromNow(-150),
    },
    {
      id: 'C014', udcid: 'MH-THA-2024-002', name: 'Kalyan Pathology & Clinical Lab',
      type: 'Pathology Laboratory', ownershipType: 'Private', district: 'Thane', taluka: 'Kalyan',
      address: '9, Station Road, Kalyan West', pincode: '421301',
      phone: '025-XXXXXXE', email: 'lab@kalyanpath.example',
      gpsLat: 19.2437, gpsLng: 73.1355,
      owner: { name: 'Dr. Anita Mhatre', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX14' },
      doctors: [{ name: 'Dr. Anita Mhatre', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX14', registrationNumber: 'MCI-2006-MH-02914', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(650) }],
      technicalStaff: [],
      services: ['Blood Tests', 'Urine Analysis', 'Biopsy', 'Culture & Sensitivity'],
      equipment: [{ id: 'E014', name: 'Automatic Haematology Analyser', make: 'Mindray', model: 'BC-6800', serialNumber: 'SN-HA-2914', lastCalibrationDate: daysFromNow(-30) }],
      status: 'Inspection Completed', createdAt: daysFromNow(-120), updatedAt: daysFromNow(-2), lastInspectionDate: daysFromNow(-5),
    },
    {
      id: 'C015', udcid: 'MH-THA-2024-003', name: 'Bhiwandi Multicare Diagnostics',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Private', district: 'Thane', taluka: 'Bhiwandi',
      address: '27, Anjur Phata, Bhiwandi', pincode: '421302',
      phone: '025-XXXXXXF', email: 'info@bhiwandimc.example',
      gpsLat: 19.2967, gpsLng: 73.0538,
      owner: { name: 'Dr. Bashir Mansuri', qualification: 'MBBS, MS Surgery', phone: '98XXXXXX15' },
      doctors: [{ name: 'Dr. Bashir Mansuri', qualification: 'MBBS, MS Surgery', phone: '98XXXXXX15', registrationNumber: 'MCI-2013-MH-07615', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(730) }],
      technicalStaff: [{ name: 'Sanjay Thakur', qualification: 'BMLT', designation: 'Senior Technician', phone: '95XXXXXX15', registrationNumber: 'MPTB-2020-06015', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['Blood Tests', 'X-Ray', 'Ultrasound / Sonography', 'ECG'],
      equipment: [{ id: 'E015', name: 'Ultrasound', make: 'Mindray', model: 'DC-80', serialNumber: 'SN-US-7615', lastCalibrationDate: daysFromNow(-100) }],
      status: 'Submitted', createdAt: daysFromNow(-25), updatedAt: daysFromNow(-3),
    },
    {
      id: 'C016', udcid: 'MH-THA-2024-004', name: 'Murbad Sonography & Wellness',
      type: 'Sonography Centre', ownershipType: 'Private', district: 'Thane', taluka: 'Murbad',
      address: '14, Murbad Main Road', pincode: '421401',
      phone: '025-XXXXXXG', email: 'sono@murbad.example',
      gpsLat: 19.2580, gpsLng: 73.3940,
      owner: { name: 'Dr. Priti Chavan', qualification: 'MBBS, DGO', phone: '98XXXXXX16' },
      doctors: [{ name: 'Dr. Priti Chavan', qualification: 'MBBS, DGO', phone: '98XXXXXX16', registrationNumber: 'MCI-2018-MH-11216', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(1200) }],
      technicalStaff: [],
      services: ['Ultrasound / Sonography'],
      equipment: [{ id: 'E016', name: 'Portable Ultrasound', make: 'BK Medical', model: 'Flex Focus 400', serialNumber: 'SN-US-11216', lastCalibrationDate: daysFromNow(-55) }],
      status: 'Draft', createdAt: daysFromNow(-4), updatedAt: daysFromNow(-1),
    },

    // ── NASHIK (4) ──────────────────────────────────────────
    {
      id: 'C017', udcid: 'MH-NAS-2024-001', name: 'Nashik CT & Spine Imaging',
      type: 'CT Scan Centre', ownershipType: 'Private', district: 'Nashik', taluka: 'Nashik City',
      address: '88, Gangapur Road, Nashik City', pincode: '422005',
      phone: '025-XXXXXXH', email: 'ct@nashikspine.example',
      gpsLat: 19.9975, gpsLng: 73.7898,
      owner: { name: 'Dr. Amol Narkar', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX17' },
      doctors: [{ name: 'Dr. Amol Narkar', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX17', registrationNumber: 'MCI-2010-MH-05717', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(400) }],
      technicalStaff: [{ name: 'Kiran Niphade', qualification: 'DMRT', designation: 'CT Technologist', phone: '94XXXXXX17', registrationNumber: 'MPTB-2018-04617', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['CT Scan', 'X-Ray', 'Bone Densitometry'],
      equipment: [{ id: 'E017', name: 'CT 128-slice', make: 'Canon Medical', model: 'Aquilion Prime', serialNumber: 'SN-CT-5717', lastCalibrationDate: daysFromNow(-40) }],
      status: 'Approved', createdAt: daysFromNow(-340), updatedAt: daysFromNow(-7), approvedAt: daysFromNow(-220), lastInspectionDate: daysFromNow(-80),
    },
    {
      id: 'C018', udcid: 'MH-NAS-2024-002', name: 'Sinnar Rural Pathology Centre',
      type: 'Pathology Laboratory', ownershipType: 'Trust / NGO', district: 'Nashik', taluka: 'Sinnar',
      address: '4, Near Sinnar Bus Stand, Sinnar', pincode: '422103',
      phone: '025-XXXXXX18', email: 'path@sinnarrural.example',
      gpsLat: 19.8469, gpsLng: 74.0046,
      owner: { name: 'Dr. Rekha Borse', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX18' },
      doctors: [{ name: 'Dr. Rekha Borse', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX18', registrationNumber: 'MCI-2008-MH-04418', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(55) }],
      technicalStaff: [],
      services: ['Blood Tests', 'Urine Analysis', 'Thyroid Profile'],
      equipment: [{ id: 'E018', name: 'Semi-auto Analyser', make: 'Erba', model: 'Chem 7', serialNumber: 'SN-BA-4418', lastCalibrationDate: daysFromNow(-360) }],
      status: 'Approved', createdAt: daysFromNow(-420), updatedAt: daysFromNow(-40), approvedAt: daysFromNow(-350),
    },
    {
      id: 'C019', udcid: 'MH-NAS-2024-003', name: 'Igatpuri Hills Diagnostic Centre',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Private', district: 'Nashik', taluka: 'Igatpuri',
      address: '2, Near Railway Station, Igatpuri', pincode: '422403',
      phone: '025-XXXXXX19', email: 'info@igatpuridiag.example',
      gpsLat: 19.7027, gpsLng: 73.5608,
      owner: { name: 'Dr. Sachin Naikare', qualification: 'MBBS, MS', phone: '98XXXXXX19' },
      doctors: [{ name: 'Dr. Sachin Naikare', qualification: 'MBBS, MS', phone: '98XXXXXX19', registrationNumber: 'MCI-2014-MH-08419', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(700) }],
      technicalStaff: [{ name: 'Priya Tawde', qualification: 'DMLT', designation: 'Lab Technician', phone: '93XXXXXX19', registrationNumber: 'MPTB-2020-06619', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['Blood Tests', 'X-Ray', 'Ultrasound / Sonography'],
      equipment: [{ id: 'E019', name: 'X-Ray CR', make: 'Agfa', model: 'CR 12-X', serialNumber: 'SN-XR-8419', lastCalibrationDate: daysFromNow(-130) }],
      status: 'Resubmitted', createdAt: daysFromNow(-75), updatedAt: daysFromNow(-4),
    },
    {
      id: 'C020', udcid: 'MH-NAS-2024-004', name: 'Dindori Sonography Clinic',
      type: 'Sonography Centre', ownershipType: 'Private', district: 'Nashik', taluka: 'Dindori',
      address: '8, Dindori Main Bazaar', pincode: '422202',
      phone: '025-XXXXXX20', email: 'sono@dindori.example',
      gpsLat: 20.0836, gpsLng: 73.8369,
      owner: { name: 'Dr. Supriya Ahire', qualification: 'MBBS, DGO', phone: '98XXXXXX20' },
      doctors: [{ name: 'Dr. Supriya Ahire', qualification: 'MBBS, DGO', phone: '98XXXXXX20', registrationNumber: 'MCI-2019-MH-12120', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(1400) }],
      technicalStaff: [],
      services: ['Ultrasound / Sonography'],
      equipment: [{ id: 'E020', name: 'Portable Ultrasound', make: 'Sonosite', model: 'Edge II', serialNumber: 'SN-US-12120', lastCalibrationDate: daysFromNow(-70) }],
      status: 'Submitted', createdAt: daysFromNow(-18), updatedAt: daysFromNow(-2),
    },

    // ── NAGPUR (4) ──────────────────────────────────────────
    {
      id: 'C021', udcid: 'MH-NAG-2024-001', name: 'Nagpur MRI & Neuro Imaging',
      type: 'MRI Centre', ownershipType: 'Private', district: 'Nagpur', taluka: 'Nagpur City',
      address: '34, Dharampeth Extension, Nagpur City', pincode: '440010',
      phone: '071-XXXXXX21', email: 'mri@nagpurneuro.example',
      gpsLat: 21.1458, gpsLng: 79.0882,
      owner: { name: 'Dr. Vikram Deshpande', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX21' },
      doctors: [{ name: 'Dr. Vikram Deshpande', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX21', registrationNumber: 'MCI-2007-MH-03721', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(500) }],
      technicalStaff: [{ name: 'Akash Dongre', qualification: 'BMLT', designation: 'MRI Technologist', phone: '92XXXXXX21', registrationNumber: 'MPTB-2017-03221', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['MRI Scan', 'Blood Tests'],
      equipment: [{ id: 'E021', name: 'MRI 3T', make: 'Philips', model: 'Ingenia CX', serialNumber: 'SN-MRI-3721', lastCalibrationDate: daysFromNow(-25) }],
      status: 'Approved', createdAt: daysFromNow(-360), updatedAt: daysFromNow(-6), approvedAt: daysFromNow(-240), lastInspectionDate: daysFromNow(-70),
    },
    {
      id: 'C022', udcid: 'MH-NAG-2024-002', name: 'Nagpur Central Multicare Hub',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Private', district: 'Nagpur', taluka: 'Nagpur City',
      address: '12, Sitabuldi, Nagpur City', pincode: '440012',
      phone: '071-XXXXXX22', email: 'info@nagpurmulti.example',
      gpsLat: 21.1464, gpsLng: 79.0937,
      owner: { name: 'Dr. Priya Thakare', qualification: 'MBBS, MS', phone: '98XXXXXX22' },
      doctors: [{ name: 'Dr. Priya Thakare', qualification: 'MBBS, MS', phone: '98XXXXXX22', registrationNumber: 'MCI-2011-MH-06322', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(440) }],
      technicalStaff: [{ name: 'Nilesh Nagpure', qualification: 'DMLT', designation: 'Lab Supervisor', phone: '91XXXXXX22', registrationNumber: 'MPTB-2019-05022', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['MRI Scan', 'CT Scan', 'X-Ray', 'Blood Tests', 'Ultrasound / Sonography', 'Pulmonary Function Test'],
      equipment: [
        { id: 'E022a', name: 'MRI 1.5T', make: 'Siemens', model: 'MAGNETOM Sola', serialNumber: 'SN-MRI-6322', lastCalibrationDate: daysFromNow(-35) },
        { id: 'E022b', name: 'CT 16-slice', make: 'GE', model: 'BrightSpeed', serialNumber: 'SN-CT-6322', lastCalibrationDate: daysFromNow(-80) },
      ],
      status: 'Approved', createdAt: daysFromNow(-460), updatedAt: daysFromNow(-9), approvedAt: daysFromNow(-310), lastInspectionDate: daysFromNow(-100),
    },
    {
      id: 'C023', udcid: 'MH-NAG-2024-003', name: 'Kamptee X-Ray Clinic',
      type: 'X-Ray Centre', ownershipType: 'Government', district: 'Nagpur', taluka: 'Kamptee',
      address: '11, Cantonment Road, Kamptee', pincode: '441001',
      phone: '071-XXXXXX23', email: 'xray@kamptee.example',
      gpsLat: 21.2210, gpsLng: 79.2009,
      owner: { name: 'Dr. Sunil Gadge', qualification: 'MBBS', phone: '98XXXXXX23' },
      doctors: [{ name: 'Dr. Sunil Gadge', qualification: 'MBBS', phone: '98XXXXXX23', registrationNumber: 'MCI-2016-MH-10023', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(880) }],
      technicalStaff: [],
      services: ['X-Ray'],
      equipment: [{ id: 'E023', name: 'X-Ray Unit', make: 'Wipro GE', model: 'Optima RF320', serialNumber: 'SN-XR-10023', lastCalibrationDate: daysFromNow(-300) }],
      status: 'Under Review', createdAt: daysFromNow(-30), updatedAt: daysFromNow(-3),
    },
    {
      id: 'C024', udcid: 'MH-NAG-2024-004', name: 'Hingna Rural Pathology Lab',
      type: 'Pathology Laboratory', ownershipType: 'Trust / NGO', district: 'Nagpur', taluka: 'Hingna',
      address: '6, MIDC Hingna, Near Water Tank', pincode: '440016',
      phone: '071-XXXXXX24', email: 'lab@hingnarul.example',
      gpsLat: 21.1040, gpsLng: 78.9760,
      owner: { name: 'Dr. Kavita Wankhede', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX24' },
      doctors: [{ name: 'Dr. Kavita Wankhede', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX24', registrationNumber: 'MCI-2009-MH-04924', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(560) }],
      technicalStaff: [],
      services: ['Blood Tests', 'Urine Analysis', 'HbA1c'],
      equipment: [{ id: 'E024', name: 'Semi-auto Analyser', make: 'Transasia', model: 'Erba Mannheim', serialNumber: 'SN-BA-4924', lastCalibrationDate: daysFromNow(-80) }],
      status: 'Rejected', createdAt: daysFromNow(-180), updatedAt: daysFromNow(-50),
    },

    // ── SATARA (2) ──────────────────────────────────────────
    {
      id: 'C025', udcid: 'MH-SAT-2024-001', name: 'Satara City Pathology Lab',
      type: 'Pathology Laboratory', ownershipType: 'Private', district: 'Satara', taluka: 'Satara City',
      address: '3, Shivaji Road, Satara City', pincode: '415001',
      phone: '021-XXXXXX25', email: 'lab@satarapath.example',
      gpsLat: 17.6805, gpsLng: 73.9987,
      owner: { name: 'Dr. Smita Bhosale', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX25' },
      doctors: [{ name: 'Dr. Smita Bhosale', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX25', registrationNumber: 'MCI-2010-MH-05225', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(470) }],
      technicalStaff: [{ name: 'Rajesh Kadam', qualification: 'DMLT', designation: 'Lab Technician', phone: '96XXXXXX25', registrationNumber: 'MPTB-2018-04225', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['Blood Tests', 'Urine Analysis', 'Thyroid Profile', 'Lipid Profile'],
      equipment: [{ id: 'E025', name: 'Biochemistry Analyser', make: 'Roche', model: 'Cobas c311', serialNumber: 'SN-BA-5225', lastCalibrationDate: daysFromNow(-50) }],
      status: 'Approved', createdAt: daysFromNow(-290), updatedAt: daysFromNow(-11), approvedAt: daysFromNow(-180), lastInspectionDate: daysFromNow(-85),
    },
    {
      id: 'C026', udcid: 'MH-SAT-2024-002', name: 'Patan Multicare Diagnostics',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Private', district: 'Satara', taluka: 'Patan',
      address: '7, Near Civil Hospital, Patan', pincode: '415206',
      phone: '021-XXXXXX26', email: 'info@patan-multicare.example',
      gpsLat: 17.3765, gpsLng: 73.9078,
      owner: { name: 'Dr. Nikhil Jagtap', qualification: 'MBBS, MS', phone: '98XXXXXX26' },
      doctors: [{ name: 'Dr. Nikhil Jagtap', qualification: 'MBBS, MS', phone: '98XXXXXX26', registrationNumber: 'MCI-2013-MH-07226', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(600) }],
      technicalStaff: [{ name: 'Ashwini Patil', qualification: 'BMLT', designation: 'Senior Technician', phone: '95XXXXXX26', registrationNumber: 'MPTB-2019-05826', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['Blood Tests', 'X-Ray', 'Ultrasound / Sonography', 'ECG'],
      equipment: [{ id: 'E026', name: 'Portable Ultrasound', make: 'SonoScape', model: 'S8', serialNumber: 'SN-US-7226', lastCalibrationDate: daysFromNow(-160) }],
      status: 'Inspection Scheduled', createdAt: daysFromNow(-80), updatedAt: daysFromNow(-3),
    },

    // ── KOLHAPUR (2) ────────────────────────────────────────
    {
      id: 'C027', udcid: 'MH-KOL-2024-001', name: 'Kolhapur Multicare Diagnostic Centre',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Private', district: 'Kolhapur', taluka: 'Kolhapur City',
      address: '25, Station Road, Kolhapur City', pincode: '416001',
      phone: '023-XXXXXX27', email: 'info@kolhapurmulti.example',
      gpsLat: 16.7050, gpsLng: 74.2433,
      owner: { name: 'Dr. Aarti Chougule', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX27' },
      doctors: [{ name: 'Dr. Aarti Chougule', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX27', registrationNumber: 'MCI-2009-MH-04627', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(430) }],
      technicalStaff: [{ name: 'Ganesh Gaikwad', qualification: 'DMLT', designation: 'Lab In-charge', phone: '93XXXXXX27', registrationNumber: 'MPTB-2017-03427', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['MRI Scan', 'CT Scan', 'Blood Tests', 'X-Ray', 'Ultrasound / Sonography'],
      equipment: [
        { id: 'E027a', name: 'MRI 1.5T', make: 'GE', model: 'SIGNA Artist', serialNumber: 'SN-MRI-4627', lastCalibrationDate: daysFromNow(-45) },
        { id: 'E027b', name: 'CT 64-slice', make: 'Philips', model: 'Brilliance 64', serialNumber: 'SN-CT-4627', lastCalibrationDate: daysFromNow(-95) },
      ],
      status: 'Approved', createdAt: daysFromNow(-400), updatedAt: daysFromNow(-14), approvedAt: daysFromNow(-270), lastInspectionDate: daysFromNow(-95),
    },
    {
      id: 'C028', udcid: 'MH-KOL-2024-002', name: 'Hatkanangle CT Imaging',
      type: 'CT Scan Centre', ownershipType: 'Private', district: 'Kolhapur', taluka: 'Hatkanangle',
      address: '11, Near Ichalkaranji Hospital, Hatkanangle', pincode: '416115',
      phone: '023-XXXXXX28', email: 'ct@hatkanangle.example',
      gpsLat: 16.6960, gpsLng: 74.4625,
      owner: { name: 'Dr. Shubhangi Patil', qualification: 'MBBS, DNB Radiology', phone: '98XXXXXX28' },
      doctors: [{ name: 'Dr. Shubhangi Patil', qualification: 'MBBS, DNB Radiology', phone: '98XXXXXX28', registrationNumber: 'MCI-2015-MH-09228', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(820) }],
      technicalStaff: [{ name: 'Rohit Joshi', qualification: 'DMRT', designation: 'CT Technologist', phone: '97XXXXXX28', registrationNumber: 'MPTB-2021-07728', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['CT Scan', 'X-Ray'],
      equipment: [{ id: 'E028', name: 'CT 64-slice', make: 'Toshiba', model: 'Aquilion 64', serialNumber: 'SN-CT-9228', lastCalibrationDate: daysFromNow(-140) }],
      status: 'Under Review', createdAt: daysFromNow(-40), updatedAt: daysFromNow(-6),
    },

    // ── CHHATRAPATI SAMBHAJINAGAR (2) ───────────────────────
    {
      id: 'C029', udcid: 'MH-CSN-2024-001', name: 'Aurangabad Path & Clinical Lab',
      type: 'Pathology Laboratory', ownershipType: 'Private', district: 'Chhatrapati Sambhajinagar', taluka: 'Aurangabad City',
      address: '5, Nirala Bazaar, Aurangabad City', pincode: '431001',
      phone: '024-XXXXXX29', email: 'lab@aurpath.example',
      gpsLat: 19.8762, gpsLng: 75.3433,
      owner: { name: 'Dr. Imran Qureshi', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX29' },
      doctors: [{ name: 'Dr. Imran Qureshi', qualification: 'MBBS, MD Pathology', phone: '98XXXXXX29', registrationNumber: 'MCI-2008-MH-04229', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(340) }],
      technicalStaff: [{ name: 'Ayesha Begum', qualification: 'DMLT', designation: 'Lab Technician', phone: '96XXXXXX29', registrationNumber: 'MPTB-2019-05229', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['Blood Tests', 'Urine Analysis', 'Thyroid Profile', 'HbA1c', 'COVID-19 RT-PCR', 'Culture & Sensitivity'],
      equipment: [{ id: 'E029', name: 'Haematology Analyser', make: 'Beckman Coulter', model: 'DxH 500', serialNumber: 'SN-HA-4229', lastCalibrationDate: daysFromNow(-20) }],
      status: 'Approved', createdAt: daysFromNow(-310), updatedAt: daysFromNow(-8), approvedAt: daysFromNow(-200), lastInspectionDate: daysFromNow(-75),
    },
    {
      id: 'C030', udcid: 'MH-CSN-2024-002', name: 'Paithan Multiservice Diagnostic',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Trust / NGO', district: 'Chhatrapati Sambhajinagar', taluka: 'Paithan',
      address: '3, Near Paithan Bus Depot', pincode: '431107',
      phone: '024-XXXXXX30', email: 'info@paithanmulti.example',
      gpsLat: 19.4748, gpsLng: 75.3811,
      owner: { name: 'Dr. Yogesh Landge', qualification: 'MBBS, MS', phone: '98XXXXXX30' },
      doctors: [{ name: 'Dr. Yogesh Landge', qualification: 'MBBS, MS', phone: '98XXXXXX30', registrationNumber: 'MCI-2012-MH-06830', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(590) }],
      technicalStaff: [{ name: 'Sonal Ghuge', qualification: 'BMLT', designation: 'Senior Technician', phone: '95XXXXXX30', registrationNumber: 'MPTB-2020-06530', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['Blood Tests', 'X-Ray', 'Ultrasound / Sonography', 'ECG', 'HbA1c'],
      equipment: [{ id: 'E030', name: 'Portable X-Ray', make: 'Mindray', model: 'DigiEye 580', serialNumber: 'SN-XR-6830', lastCalibrationDate: daysFromNow(-110) }],
      status: 'Inspection Completed', createdAt: daysFromNow(-110), updatedAt: daysFromNow(-4), lastInspectionDate: daysFromNow(-8),
    },
    // ── 2 Extra Bonus centres ──────────────────────────────
    {
      id: 'C031', udcid: 'MH-PUN-2024-007', name: 'Khed Rural Health & Diagnostics',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Trust / NGO', district: 'Pune', taluka: 'Khed',
      address: '15, Rajgurunagar, Khed', pincode: '410505',
      phone: '021-XXXXXX31', email: 'info@khedrural.example',
      gpsLat: 18.9285, gpsLng: 73.9265,
      owner: { name: 'Dr. Avinash Vaidya', qualification: 'MBBS, MS', phone: '98XXXXXX31' },
      doctors: [{ name: 'Dr. Avinash Vaidya', qualification: 'MBBS, MS', phone: '98XXXXXX31', registrationNumber: 'MCI-2011-MH-06431', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(410) }],
      technicalStaff: [{ name: 'Rohini Kamath', qualification: 'DMLT', designation: 'Lab Technician', phone: '94XXXXXX31', registrationNumber: 'MPTB-2018-04831', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['Blood Tests', 'Urine Analysis', 'X-Ray', 'ECG'],
      equipment: [{ id: 'E031', name: 'X-Ray Unit', make: 'Allengers', model: 'FW-Series', serialNumber: 'SN-XR-6431', lastCalibrationDate: daysFromNow(-150) }],
      status: 'Approved', createdAt: daysFromNow(-350), updatedAt: daysFromNow(-18), approvedAt: daysFromNow(-230), lastInspectionDate: daysFromNow(-95),
    },
    {
      id: 'C032', udcid: 'MH-MUM-2024-007', name: 'Marine Lines Precision Diagnostics',
      type: 'Multi-service Diagnostic Centre', ownershipType: 'Private', district: 'Mumbai City', taluka: 'Mumbai City',
      address: '201, Whitefield House, Marine Lines', pincode: '400002',
      phone: '022-XXXXXX32', email: 'info@marinelines-diag.example',
      gpsLat: 18.9440, gpsLng: 72.8231,
      owner: { name: 'Dr. Cyrus Irani', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX32' },
      doctors: [{ name: 'Dr. Cyrus Irani', qualification: 'MBBS, MD Radiology', phone: '98XXXXXX32', registrationNumber: 'MCI-2006-MH-02632', registrationAuthority: 'Maharashtra Medical Council', registrationExpiry: daysFromNow(310) }],
      technicalStaff: [{ name: 'Smita Lotlikar', qualification: 'BMLT', designation: 'Senior Lab Technician', phone: '92XXXXXX32', registrationNumber: 'MPTB-2016-02232', registrationAuthority: 'Maharashtra Para-Medical Training Board' }],
      services: ['MRI Scan', 'CT Scan', 'PET Scan', 'Blood Tests', 'Mammography', 'Echocardiography'],
      equipment: [
        { id: 'E032a', name: 'MRI 3T', make: 'Siemens', model: 'MAGNETOM Vida', serialNumber: 'SN-MRI-2632', lastCalibrationDate: daysFromNow(-15) },
        { id: 'E032b', name: 'PET-CT', make: 'GE', model: 'Discovery IQ', serialNumber: 'SN-PET-2632', lastCalibrationDate: daysFromNow(-40) },
      ],
      status: 'Approved', createdAt: daysFromNow(-550), updatedAt: daysFromNow(-5), approvedAt: daysFromNow(-400), lastInspectionDate: daysFromNow(-55),
    },
  ];

  // ─── Documents ───────────────────────────────────────────
  const documents: CentreDocument[] = [
    // C001 - Sahyadri MRI (Approved)
    { id: 'D001a', centreId: 'C001', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2019-04821', issuingAuthority: 'Directorate of Health Services, Pune', issueDate: '2019-03-01', expiryDate: daysFromNow(480) },
    { id: 'D001b', centreId: 'C001', title: 'AERB Radiation Safety Clearance', category: 'AERB Clearance', registration: 'AERB-PUN-2021-MRI-04821', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2021-04-01', expiryDate: daysFromNow(200) },
    { id: 'D001c', centreId: 'C001', title: 'Fire Safety NOC', category: 'Fire Safety', registration: 'PFSO-PUN-2022-04821', issuingAuthority: 'Maharashtra Fire Services', issueDate: '2022-01-15', expiryDate: daysFromNow(45) },

    // C002 - Deccan CT (Approved)
    { id: 'D002a', centreId: 'C002', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2020-06321', issuingAuthority: 'Directorate of Health Services, Pune', issueDate: '2020-06-01', expiryDate: daysFromNow(390) },
    { id: 'D002b', centreId: 'C002', title: 'AERB Clearance', category: 'AERB Clearance', registration: 'AERB-PUN-2022-CT-06321', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2022-06-15', expiryDate: daysFromNow(310) },
    { id: 'D002c', centreId: 'C002', title: 'Radiation Safety Certificate', category: 'Radiation Safety', registration: 'BARC-PUN-2022-06321', issuingAuthority: 'BARC', issueDate: '2022-07-01', expiryDate: daysFromNow(-20) },

    // C003 - Kasba Pathology (Approved)
    { id: 'D003a', centreId: 'C003', title: 'Lab Registration Certificate', category: 'Centre Registration', registration: 'MHMH-LAB-2017-03412', issuingAuthority: 'Directorate of Health Services, Pune', issueDate: '2017-08-01', expiryDate: daysFromNow(720) },
    { id: 'D003b', centreId: 'C003', title: 'Trade Licence', category: 'Trade Licence', registration: 'PMC-TL-2023-03412', issuingAuthority: 'Pune Municipal Corporation', issueDate: '2023-04-01', expiryDate: daysFromNow(160) },

    // C007 - Andheri Advanced (Approved)
    { id: 'D007a', centreId: 'C007', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2018-04112', issuingAuthority: 'Directorate of Health Services, Mumbai', issueDate: '2018-01-20', expiryDate: daysFromNow(365) },
    { id: 'D007b', centreId: 'C007', title: 'AERB MRI Clearance', category: 'AERB Clearance', registration: 'AERB-MUM-2021-MRI-04112', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2021-09-10', expiryDate: daysFromNow(250) },
    { id: 'D007c', centreId: 'C007', title: 'Fire Safety NOC', category: 'Fire Safety', registration: 'MFSO-MUM-2022-04112', issuingAuthority: 'Mumbai Fire Brigade', issueDate: '2022-11-01', expiryDate: daysFromNow(38) },

    // C008 - Borivali MRI (Approved)
    { id: 'D008a', centreId: 'C008', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2021-07011', issuingAuthority: 'Directorate of Health Services, Mumbai', issueDate: '2021-02-14', expiryDate: daysFromNow(540) },
    { id: 'D008b', centreId: 'C008', title: 'AERB MRI Clearance', category: 'AERB Clearance', registration: 'AERB-MUM-2022-MRI-07011', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2022-03-01', expiryDate: daysFromNow(400) },

    // C009 - Kurla Pathology (Approved, doctor expired)
    { id: 'D009a', centreId: 'C009', title: 'Lab Registration Certificate', category: 'Centre Registration', registration: 'MHMH-LAB-2015-05011', issuingAuthority: 'Directorate of Health Services, Mumbai', issueDate: '2015-05-01', expiryDate: daysFromNow(-10) },
    { id: 'D009b', centreId: 'C009', title: 'Trade Licence', category: 'Trade Licence', registration: 'MCGM-TL-2023-05011', issuingAuthority: 'MCGM', issueDate: '2023-03-01', expiryDate: daysFromNow(125) },

    // C012 - Andheri Maa Trust (Approved)
    { id: 'D012a', centreId: 'C012', title: 'Trust Registration', category: 'Centre Registration', registration: 'MHMH-TRUST-2019-06812', issuingAuthority: 'Charity Commissioner, Mumbai', issueDate: '2019-07-01', expiryDate: daysFromNow(290) },
    { id: 'D012b', centreId: 'C012', title: 'PNDT Registration', category: 'Other', registration: 'PNDT-MUM-2020-06812', issuingAuthority: 'Civil Surgeon, Mumbai', issueDate: '2020-08-15', expiryDate: daysFromNow(140) },

    // C013 - Thane X-Ray (Approved, doctor expiring soon)
    { id: 'D013a', centreId: 'C013', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2022-10213', issuingAuthority: 'Directorate of Health Services, Thane', issueDate: '2022-05-01', expiryDate: daysFromNow(44) },
    { id: 'D013b', centreId: 'C013', title: 'AERB X-Ray Clearance', category: 'AERB Clearance', registration: 'AERB-THA-2023-XR-10213', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2023-01-10', expiryDate: daysFromNow(360) },

    // C017 - Nashik CT (Approved)
    { id: 'D017a', centreId: 'C017', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2020-05717', issuingAuthority: 'Directorate of Health Services, Nashik', issueDate: '2020-11-01', expiryDate: daysFromNow(400) },
    { id: 'D017b', centreId: 'C017', title: 'AERB CT Clearance', category: 'AERB Clearance', registration: 'AERB-NAS-2021-CT-05717', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2021-12-15', expiryDate: daysFromNow(320) },

    // C018 - Sinnar Pathology (Approved, expiring)
    { id: 'D018a', centreId: 'C018', title: 'Lab Registration Certificate', category: 'Centre Registration', registration: 'MHMH-LAB-2018-04418', issuingAuthority: 'Directorate of Health Services, Nashik', issueDate: '2018-06-10', expiryDate: daysFromNow(55) },

    // C021 - Nagpur MRI (Approved)
    { id: 'D021a', centreId: 'C021', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2019-03721', issuingAuthority: 'Directorate of Health Services, Nagpur', issueDate: '2019-10-01', expiryDate: daysFromNow(500) },
    { id: 'D021b', centreId: 'C021', title: 'AERB MRI Clearance', category: 'AERB Clearance', registration: 'AERB-NAG-2021-MRI-03721', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2021-11-01', expiryDate: daysFromNow(380) },

    // C022 - Nagpur Multicare (Approved)
    { id: 'D022a', centreId: 'C022', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2018-06322', issuingAuthority: 'Directorate of Health Services, Nagpur', issueDate: '2018-09-15', expiryDate: daysFromNow(440) },
    { id: 'D022b', centreId: 'C022', title: 'AERB MRI & CT Clearance', category: 'AERB Clearance', registration: 'AERB-NAG-2022-MRICT-06322', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2022-01-20', expiryDate: daysFromNow(180) },

    // C025 - Satara Pathology (Approved)
    { id: 'D025a', centreId: 'C025', title: 'Lab Registration Certificate', category: 'Centre Registration', registration: 'MHMH-LAB-2020-05225', issuingAuthority: 'Directorate of Health Services, Satara', issueDate: '2020-07-01', expiryDate: daysFromNow(470) },
    { id: 'D025b', centreId: 'C025', title: 'Trade Licence', category: 'Trade Licence', registration: 'SMC-TL-2023-05225', issuingAuthority: 'Satara Municipal Council', issueDate: '2023-04-01', expiryDate: daysFromNow(150) },

    // C027 - Kolhapur Multicare (Approved)
    { id: 'D027a', centreId: 'C027', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2019-04627', issuingAuthority: 'Directorate of Health Services, Kolhapur', issueDate: '2019-05-20', expiryDate: daysFromNow(430) },
    { id: 'D027b', centreId: 'C027', title: 'AERB MRI Clearance', category: 'AERB Clearance', registration: 'AERB-KOL-2021-MRI-04627', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2021-06-01', expiryDate: daysFromNow(350) },

    // C029 - Aurangabad Path (Approved)
    { id: 'D029a', centreId: 'C029', title: 'Lab Registration Certificate', category: 'Centre Registration', registration: 'MHMH-LAB-2020-04229', issuingAuthority: 'Directorate of Health Services, CSN', issueDate: '2020-04-01', expiryDate: daysFromNow(340) },
    { id: 'D029b', centreId: 'C029', title: 'Trade Licence', category: 'Trade Licence', registration: 'AMC-TL-2023-04229', issuingAuthority: 'Aurangabad Municipal Corporation', issueDate: '2023-01-01', expiryDate: daysFromNow(60) },

    // C031 - Khed Rural (Approved)
    { id: 'D031a', centreId: 'C031', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2020-06431', issuingAuthority: 'Directorate of Health Services, Pune', issueDate: '2020-08-01', expiryDate: daysFromNow(410) },

    // C032 - Marine Lines (Approved)
    { id: 'D032a', centreId: 'C032', title: 'Centre Registration Certificate', category: 'Centre Registration', registration: 'MHMH-REG-2017-02632', issuingAuthority: 'Directorate of Health Services, Mumbai', issueDate: '2017-11-01', expiryDate: daysFromNow(310) },
    { id: 'D032b', centreId: 'C032', title: 'AERB MRI & PET-CT Clearance', category: 'AERB Clearance', registration: 'AERB-MUM-2022-MRI-PET-02632', issuingAuthority: 'Atomic Energy Regulatory Board', issueDate: '2022-08-01', expiryDate: daysFromNow(490) },
    { id: 'D032c', centreId: 'C032', title: 'Fire Safety NOC', category: 'Fire Safety', registration: 'MFSO-MUM-2023-02632', issuingAuthority: 'Mumbai Fire Brigade', issueDate: '2023-02-10', expiryDate: daysFromNow(100) },
  ];

  // ─── Application Events ──────────────────────────────────
  const applicationEvents: ApplicationEvent[] = [
    { id: 'AE001a', centreId: 'C001', fromStatus: '', toStatus: 'Submitted', actorRole: 'Centre', actorName: 'Dr. Priya Kulkarni', remarks: 'Initial submission', timestamp: daysFromNow(-320) },
    { id: 'AE001b', centreId: 'C001', fromStatus: 'Submitted', toStatus: 'Under Review', actorRole: 'Officer', actorName: 'Officer Bhosale A.', remarks: 'Application picked up for review', timestamp: daysFromNow(-310) },
    { id: 'AE001c', centreId: 'C001', fromStatus: 'Under Review', toStatus: 'Inspection Scheduled', actorRole: 'Officer', actorName: 'Officer Bhosale A.', remarks: 'Documents verified. Scheduling inspection.', timestamp: daysFromNow(-250) },
    { id: 'AE001d', centreId: 'C001', fromStatus: 'Inspection Scheduled', toStatus: 'Inspection Completed', actorRole: 'Officer', actorName: 'Officer Bhosale A.', remarks: 'Inspection completed satisfactorily', timestamp: daysFromNow(-210) },
    { id: 'AE001e', centreId: 'C001', fromStatus: 'Inspection Completed', toStatus: 'Approved', actorRole: 'District Admin', actorName: 'Admin Joshi P.', remarks: 'All requirements met. Application approved.', timestamp: daysFromNow(-200) },

    { id: 'AE005a', centreId: 'C005', fromStatus: '', toStatus: 'Submitted', actorRole: 'Centre', actorName: 'Dr. Ramesh Tilekar', remarks: 'Centre registration submitted', timestamp: daysFromNow(-60) },
    { id: 'AE005b', centreId: 'C005', fromStatus: 'Submitted', toStatus: 'Under Review', actorRole: 'Officer', actorName: 'Officer Patil K.', remarks: 'Under review', timestamp: daysFromNow(-50) },
    { id: 'AE005c', centreId: 'C005', fromStatus: 'Under Review', toStatus: 'Correction Required', actorRole: 'Officer', actorName: 'Officer Patil K.', remarks: 'AERB clearance document missing. Please upload and resubmit.', timestamp: daysFromNow(-10) },

    { id: 'AE019a', centreId: 'C019', fromStatus: '', toStatus: 'Submitted', actorRole: 'Centre', actorName: 'Dr. Sachin Naikare', remarks: 'Initial submission', timestamp: daysFromNow(-75) },
    { id: 'AE019b', centreId: 'C019', fromStatus: 'Submitted', toStatus: 'Under Review', actorRole: 'Officer', actorName: 'Officer Waghmare S.', remarks: 'Assigned for review', timestamp: daysFromNow(-65) },
    { id: 'AE019c', centreId: 'C019', fromStatus: 'Under Review', toStatus: 'Correction Required', actorRole: 'Officer', actorName: 'Officer Waghmare S.', remarks: 'Trade licence expired. Please renew and resubmit.', timestamp: daysFromNow(-20) },
    { id: 'AE019d', centreId: 'C019', fromStatus: 'Correction Required', toStatus: 'Resubmitted', actorRole: 'Centre', actorName: 'Dr. Sachin Naikare', remarks: 'Renewed trade licence uploaded.', timestamp: daysFromNow(-4) },
  ];

  // ─── Inspections ─────────────────────────────────────────
  const inspections: Inspection[] = [
    {
      id: 'INS001', centreId: 'C001', officerId: 'U004', officerName: 'Officer Bhosale A.',
      scheduledAt: daysFromNow(-210), conductedAt: daysFromNow(-210), status: 'Completed',
      gpsLat: 18.4648, gpsLng: 73.8578,
      checklist: [
        { id: 'CL001a', label: 'Radiation shielding adequate', result: 'Compliant' },
        { id: 'CL001b', label: 'Emergency equipment available', result: 'Compliant' },
        { id: 'CL001c', label: 'Staff qualifications verified', result: 'Compliant' },
        { id: 'CL001d', label: 'Equipment calibration up to date', result: 'Non-compliant', remarks: 'MRI calibration overdue by 2 weeks at time of inspection' },
        { id: 'CL001e', label: 'Patient privacy measures', result: 'Compliant' },
      ],
      remarks: 'Centre is generally well maintained. Calibration schedule corrected during inspection.', followUpRequired: false,
    },
    {
      id: 'INS006', centreId: 'C006', officerId: 'U004', officerName: 'Officer Bhosale A.',
      scheduledAt: daysFromNow(7), status: 'Scheduled',
      checklist: [], remarks: '', followUpRequired: false,
    },
    {
      id: 'INS014', centreId: 'C014', officerId: 'U005', officerName: 'Officer Desai R.',
      scheduledAt: daysFromNow(-10), conductedAt: daysFromNow(-5), status: 'Completed',
      checklist: [
        { id: 'CL014a', label: 'Lab layout meets standards', result: 'Compliant' },
        { id: 'CL014b', label: 'Waste disposal procedures', result: 'Compliant' },
        { id: 'CL014c', label: 'Equipment calibration', result: 'Compliant' },
        { id: 'CL014d', label: 'Staff protective equipment', result: 'Non-compliant', remarks: 'Some PPE items missing' },
      ],
      remarks: 'Minor PPE deficiency noted. Centre committed to remedy within 7 days.', followUpRequired: true, followUpDate: daysFromNow(2),
    },
    {
      id: 'INS026', centreId: 'C026', officerId: 'U004', officerName: 'Officer Bhosale A.',
      scheduledAt: daysFromNow(5), status: 'Scheduled',
      checklist: [], remarks: '', followUpRequired: false,
    },
    {
      id: 'INS030', centreId: 'C030', officerId: 'U006', officerName: 'Officer Ansari M.',
      scheduledAt: daysFromNow(-15), conductedAt: daysFromNow(-8), status: 'Completed',
      checklist: [
        { id: 'CL030a', label: 'Centre registration displayed', result: 'Compliant' },
        { id: 'CL030b', label: 'Equipment serviceable', result: 'Compliant' },
        { id: 'CL030c', label: 'Doctor qualification verified', result: 'Compliant' },
        { id: 'CL030d', label: 'Radiation safety (N/A for path lab)', result: 'Not Applicable' },
      ],
      remarks: 'Centre meets all applicable standards.', followUpRequired: false,
    },
  ];

  // ─── Complaints ──────────────────────────────────────────
  const complaints: Complaint[] = [
    {
      id: 'CMP001', trackingNumber: 'CMP-2024-00142', centreId: 'C009',
      complainantName: 'Ramesh Kadam', complainantContact: '98XXXXXX99',
      category: 'Document Issue', description: 'Centre registration displayed appears expired. Please verify.',
      status: 'Under Investigation', assignedOfficerId: 'U005',
      history: [
        { id: 'CH001a', complaintId: 'CMP001', action: 'Submitted', actorName: 'Ramesh Kadam', timestamp: daysFromNow(-12), remarks: 'Initial complaint submitted online' },
        { id: 'CH001b', complaintId: 'CMP001', action: 'Assigned', actorName: 'Admin Joshi P.', timestamp: daysFromNow(-10), remarks: 'Assigned to Officer Desai R. for investigation' },
        { id: 'CH001c', complaintId: 'CMP001', action: 'Under Investigation', actorName: 'Officer Desai R.', timestamp: daysFromNow(-8), remarks: 'Visiting centre this week for verification' },
      ],
      submittedAt: daysFromNow(-12),
    },
    {
      id: 'CMP002', trackingNumber: 'CMP-2024-00198', centreId: 'C001',
      complainantName: 'Priya Sharma', complainantContact: '87XXXXXX88',
      category: 'Service Quality', description: 'Long waiting time at MRI centre without proper prior intimation.',
      status: 'Resolved', assignedOfficerId: 'U004',
      history: [
        { id: 'CH002a', complaintId: 'CMP002', action: 'Submitted', actorName: 'Priya Sharma', timestamp: daysFromNow(-30), remarks: 'Complaint raised via online portal' },
        { id: 'CH002b', complaintId: 'CMP002', action: 'Resolved', actorName: 'Officer Bhosale A.', timestamp: daysFromNow(-20), remarks: 'Centre counselled. Appointment scheduling system implemented.' },
      ],
      submittedAt: daysFromNow(-30),
    },
    {
      id: 'CMP003', trackingNumber: 'CMP-2024-00215',
      complainantName: 'Anand Kulkarni', complainantContact: '96XXXXXX77',
      category: 'Billing', description: 'Overcharged for a CT scan at an unlisted centre near Nashik.',
      status: 'Open',
      history: [
        { id: 'CH003a', complaintId: 'CMP003', action: 'Submitted', actorName: 'Anand Kulkarni', timestamp: daysFromNow(-3), remarks: 'Complaint submitted online' },
      ],
      submittedAt: daysFromNow(-3),
    },
  ];

  // ─── Notifications ───────────────────────────────────────
  const notifications: Notification[] = [
    { id: 'N001', district: 'Pune', centreId: 'C001', message: 'Fire Safety NOC for Sahyadri MRI expiring in 45 days.', type: 'warning', read: false, createdAt: daysFromNow(-1) },
    { id: 'N002', district: 'Mumbai Suburban', centreId: 'C009', message: 'Centre registration for Kurla Metro Pathology Lab has expired.', type: 'error', read: false, createdAt: daysFromNow(-1) },
    { id: 'N003', district: 'Thane', centreId: 'C013', message: 'Centre registration for Thane X-Ray Studio expiring in 44 days.', type: 'warning', read: false, createdAt: daysFromNow(-1) },
    { id: 'N004', district: 'Nashik', centreId: 'C018', message: 'Lab registration for Sinnar Rural Pathology expiring in 55 days.', type: 'warning', read: false, createdAt: daysFromNow(-2) },
    { id: 'N005', district: 'Mumbai Suburban', centreId: 'C007', message: 'Fire Safety NOC for Andheri Advanced Diagnostics expiring in 38 days.', type: 'warning', read: true, createdAt: daysFromNow(-3) },
    { id: 'N006', district: 'Pune', centreId: 'C006', message: 'Inspection for Maval Multicare Diagnostic Hub is scheduled in 7 days.', type: 'info', read: false, createdAt: daysFromNow(-1) },
    { id: 'N007', district: 'Satara', centreId: 'C026', message: 'Inspection for Patan Multicare Diagnostics scheduled in 5 days.', type: 'info', read: false, createdAt: daysFromNow(-1) },
    { id: 'N008', district: 'Nagpur', centreId: 'C022', message: 'AERB clearance for Nagpur Central Multicare expiring in 180 days.', type: 'info', read: true, createdAt: daysFromNow(-5) },
    { id: 'N009', district: 'Pune', message: 'New complaint CMP-2024-00142 registered for Kurla Metro Pathology.', type: 'info', read: false, createdAt: daysFromNow(-12) },
    { id: 'N010', district: 'Mumbai Suburban', centreId: 'C002', message: 'Radiation Safety Certificate for Deccan CT expired 20 days ago.', type: 'error', read: false, createdAt: daysFromNow(-1) },
  ];

  // ─── Users ───────────────────────────────────────────────
  const users: AppUser[] = [
    { id: 'U001', name: 'Aditi Sharma', role: 'State Admin', email: 'aditi.sharma@mahacare.example' },
    { id: 'U002', name: 'Prakash Joshi', role: 'District Admin', district: 'Pune', email: 'prakash.joshi@mahacare.example' },
    { id: 'U003', name: 'Suchitra Naik', role: 'District Admin', district: 'Mumbai Suburban', email: 'suchitra.naik@mahacare.example' },
    { id: 'U004', name: 'Ajay Bhosale', role: 'Officer', district: 'Pune', email: 'ajay.bhosale@mahacare.example' },
    { id: 'U005', name: 'Rekha Desai', role: 'Officer', district: 'Mumbai Suburban', email: 'rekha.desai@mahacare.example' },
    { id: 'U006', name: 'Muzaffar Ansari', role: 'Officer', district: 'Chhatrapati Sambhajinagar', email: 'muzaffar.ansari@mahacare.example' },
    { id: 'U007', name: 'Dr. Priya Kulkarni', role: 'Centre', centreId: 'C001', email: 'info@sahyadrimri.example' },
  ];

  return { centres, documents, applicationEvents, inspections, complaints, notifications, users };
}
