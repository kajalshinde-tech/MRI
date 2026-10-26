// ============================================================
// lib/types.ts  — All TypeScript interfaces for MahaCare Registry
// ============================================================

export type Role = 'State Admin' | 'District Admin' | 'Officer' | 'Centre';

export type FacilityType =
  | 'MRI Centre'
  | 'CT Scan Centre'
  | 'Pathology Laboratory'
  | 'X-Ray Centre'
  | 'Sonography Centre'
  | 'Multi-service Diagnostic Centre';

export type OwnershipType = 'Private' | 'Trust / NGO' | 'Government' | 'Public-Private Partnership';

export type CentreStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Correction Required'
  | 'Resubmitted'
  | 'Inspection Scheduled'
  | 'Inspection Completed'
  | 'Approved'
  | 'Rejected';

export type ValidityStatus = 'Valid' | 'Expiring Soon' | 'Expired' | 'Not Applicable';

export type ComplaintStatus = 'Open' | 'Assigned' | 'Under Investigation' | 'Resolved' | 'Closed';

export type InspectionStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';

export type ChecklistResult = 'Compliant' | 'Non-compliant' | 'Not Applicable';

export interface Person {
  name: string;
  qualification: string;
  phone: string;
  email?: string;
}

export interface Doctor extends Person {
  registrationNumber: string;
  registrationAuthority: string;
  registrationExpiry: string;
  specialisation?: string;
}

export interface TechnicalStaff extends Person {
  designation: string;
  registrationNumber: string;
  registrationAuthority: string;
}

export interface Equipment {
  id: string;
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  lastCalibrationDate: string;
}

export interface CentreDocument {
  id: string;
  centreId: string;
  title: string;
  category: 'Centre Registration' | 'Fire Safety' | 'Radiation Safety' | 'AERB Clearance' | 'Trade Licence' | 'Professional Registration' | 'Other';
  registration: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  attachment?: { name: string; dataUrl: string; type: string };
}

export interface ApplicationEvent {
  id: string;
  centreId: string;
  fromStatus: CentreStatus | '';
  toStatus: CentreStatus;
  actorRole: Role;
  actorName: string;
  remarks: string;
  timestamp: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  result: ChecklistResult;
  remarks?: string;
}

export interface InspectionPhoto {
  id: string;
  name: string;
  dataUrl: string;
  capturedAt: string;
  gpsLat?: number;
  gpsLng?: number;
}

export interface Inspection {
  id: string;
  centreId: string;
  officerId: string;
  officerName: string;
  scheduledAt: string;
  conductedAt?: string;
  status: InspectionStatus;
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
  gpsCapturedAt?: string;
  photos?: InspectionPhoto[];
  verifiedDocumentIds?: string[];
  checklist: ChecklistItem[];
  remarks: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

export interface ComplaintEvent {
  id: string;
  complaintId: string;
  action: string;
  actorName: string;
  timestamp: string;
  remarks: string;
}

export interface Complaint {
  id: string;
  trackingNumber: string;
  centreId?: string;
  complainantName: string;
  complainantContact: string;
  category: 'Service Quality' | 'Document Issue' | 'Staff Behaviour' | 'Equipment' | 'Billing' | 'Other';
  description: string;
  status: ComplaintStatus;
  assignedOfficerId?: string;
  history: ComplaintEvent[];
  submittedAt: string;
}

export interface Notification {
  id: string;
  district: string;
  centreId?: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  role: Role;
  district?: string;
  centreId?: string;
  email: string;
}

export interface DiagnosticCentre {
  id: string;
  udcid: string;
  name: string;
  type: FacilityType;
  ownershipType: OwnershipType;
  district: string;
  taluka: string;
  address: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  gpsLat?: number;
  gpsLng?: number;
  owner: Person;
  doctors: Doctor[];
  technicalStaff: TechnicalStaff[];
  services: string[];
  equipment: Equipment[];
  status: CentreStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  lastInspectionDate?: string;
}

export interface Database {
  centres: DiagnosticCentre[];
  documents: CentreDocument[];
  applicationEvents: ApplicationEvent[];
  inspections: Inspection[];
  complaints: Complaint[];
  notifications: Notification[];
  users: AppUser[];
}
