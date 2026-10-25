# NFC Card Management

## Overview

The NFC Card Management page (`/nfc-management`) provides a software simulation interface for configuring, verifying, and linking secure NFC patient cards to the blockchain before physical ESP32 hardware deployment.

## Features

### Left Column: NFC Card Reader Simulation

#### Smart Card Illustration with Wave Rings
- Animated concentric wireless wave rings that pulse when scanning
- Visual NTAG215 card representation
- Real-time reader status indicator

#### Scan NFC Card Button
- Simulates 1.5-second hardware scan delay
- Populates right column with patient data on success
- Shows animated scanning state with pulsing waves

#### NFC Status Toggle
- Switch between Active/Inactive/Blocked states
- Immediate visual feedback with badges

#### Reader Status Indicator
- **Ready (Simulated Mode)**: Default state
- **Scanning...**: During 1.5s scan delay
- **Card Detected**: After successful scan
- **Error**: On scan failure

### Right Column: Linked Patient Profile

#### Patient Information Display
- **Patient Name**: Rahul Sharma
- **Patient ID**: AEV-2026-8941
- **Card UID**: 04:A3:B2:C1:D0:9E
- **NFC Status**: Active/Inactive/Blocked

#### Action Buttons

##### Save & Sync to Blockchain
- Hashes UID-to-Patient mapping
- Creates immutable block in `blockchain_ledger`
- Redirects to `/dashboard/patient/AEV-2026-8941` on success

##### Unlink / Block Lost Card
- Sets `nfc_status` to `Blocked` in database
- Logs immutable revocation transaction to blockchain
- Updates UI to show Blocked status

## Mock Patient Data (Demo)

```javascript
{
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  patient_code: 'AEV-2026-8941',
  full_name: 'Rahul Sharma',
  blood_group: 'O+',
  allergies: ['Penicillin', 'Peanuts'],
  nfc_uid: '04:A3:B2:C1:D0:9E',
  nfc_status: 'Active'
}
```

## Hardware Integration (Future)

The simulation mode prepares for ESP32 + PN532 hardware integration:

```cpp
// ESP32 PN532 Integration Points
// 1. NFC UID reading via PN532
// 2. UID sent to backend /api/auth/nfc-scan
// 3. Backend returns patient profile
// 4. Frontend displays profile for verification
// 5. Doctor clicks "Save & Sync"
// 6. Backend writes to blockchain_ledger
```

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/nfc-scan` | POST | Mock NFC hardware scan |
| `/api/patients/:code` | GET | Fetch patient profile |
| `/api/blockchain/verify` | GET | Verify blockchain integrity |

## Route Protection

Protected by `ProtectedRoute` with allowed roles:
- Doctor
- Nurse
- Lab
- Pharmacist
- Admin

## Navigation

Accessible via:
- Navbar: "NFC Cards" link (CreditCard icon)
- Direct URL: `/nfc-management`

## Testing

Run tests:
```bash
cd frontend
npm run test -- NFCManagementPage
```