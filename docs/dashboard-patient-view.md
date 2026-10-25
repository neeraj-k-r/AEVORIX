# AEVORIX Dashboard - Patient View

## Overview

The Patient Dashboard (`/dashboard/patient/:patientCode`) provides a comprehensive view of a patient's medical records with a two-column responsive layout.

## Layout Structure

### Left Sidebar (Fixed Width: 288px / lg:w-72)
- **Patient Header**: Name (bold) + Patient Code (muted, monospace)
- **Vitals/Info Section**:
  - Blood Group with BloodDroplet icon
  - Allergies with AlertTriangle icon + red/peach alert pill badge
- **Vertical Navigation Menu** with Lucide icons:
  - Medical History (History icon) → Diagnoses
  - Treatments (Pill icon) → Prescriptions
  - Diagnostics (Activity icon) → Lab Results
  - Allergies (AlertTriangle icon) → Allergies
  - Access Logs (Clock icon) → Access Logs
- **Ledger Status**: Green verification badge "Ledger Connected"

### Main Content Area (Flexible, 2-Column Grid on lg+)
Responsive grid: 1 column on mobile, 2 columns on lg+

#### Card 1: Recent Diagnoses (Top-Left)
- Header: "Recent Diagnoses" + History icon + ✓ Blockchain Verified badge
- Rows with diagnosis name, date (DD-MM-YYYY), ✓ Blockchain Verified badge
- Example data for Rahul Sharma:
  - Type 2 Diabetes Mellitus — 12-10-2026
  - Hypertension — 15-09-2026

#### Card 2: Active Prescriptions & Dosage (Top-Right)
- Header: "Active Prescriptions & Dosage" + Pill icon + ✓ Verified badge
- Rows with medication name, dosage instructions, ✓ Blockchain Verified badge
- Example data:
  - Metformin 500mg — 1 tablet, twice daily with meals
  - Lisinopril 10mg — 1 tablet, daily in the morning

#### Card 3: Latest Laboratory Results (Bottom-Left, Full Width)
- Header: "Latest Laboratory Results" + Activity icon + ✓ Verified badge
- Rows with test name, result value + target range, ✓ Blockchain Verified badge
- Example data:
  - HbA1c (Glycated Hemoglobin) — 6.8% (Target < 7.0%)
  - eGFR — 84 mL/min (Target > 60)

## Role-Based Action Modals

### Add Record Button Visibility
| Role | Can Add |
|------|---------|
| Doctor | Diagnoses, Prescriptions |
| Lab | Lab Results |
| Admin | All |
| Nurse, Pharmacist | None (view only) |

### Modal Forms
Each modal includes:
- Blockchain Secured badge
- Role-specific form fields
- Client-side validation
- Submit with loading state
- Auto-refresh on success

#### Diagnosis Form
- Condition Name (text, required)
- Diagnosed Date (date, required)

#### Prescription Form
- Medication Name (text, required)
- Dosage Instructions (text, required)

#### Lab Result Form
- Test Name (text, required)
- Result Value (text, required)
- Target Range (text, optional)

## Data Source
All data fetched from backend API:
- `GET /api/patients/:code` - Patient info
- `GET /api/patients/:code/records` - Diagnoses, prescriptions, lab results
- `GET /api/access-logs/:code` - Access logs
- `POST /api/diagnoses` - Create diagnosis (Doctor/Admin)
- `POST /api/prescriptions` - Create prescription (Doctor/Admin)
- `POST /api/lab-results` - Create lab result (Lab/Admin)

## Components Created

### Pages
- `DashboardPatientPage` - Main dashboard page with two-column layout
- `menuItems.js` - Navigation configuration

### Components (dashboard/)
- `PatientSidebar` - Left sidebar with patient info and navigation
- `RecordCard` / `RecordRow` - Content cards with verified badges
- `AddRecordModal` - Role-based modal forms for adding records

### Tests
- `DashboardPatientPage.test.jsx`
- `PatientSidebar.test.jsx`
- `RecordCard.test.jsx`
- `AddRecordModal.test.jsx`

## Route Protection
Route protected by `ProtectedRoute` with `allowedRoles: ['Doctor', 'Nurse', 'Lab', 'Pharmacist', 'Admin']`

## Design Tokens Used
- Background: `#F8FAFC`
- Card Surface: `#FFFFFF` with `#E2E8F0` border
- Primary: `#1E8885` (teal)
- Verification Badge: `#E6F4EA` bg / `#137333` text
- Alert Badge: `#FCE8E6` bg / `#C5221F` text