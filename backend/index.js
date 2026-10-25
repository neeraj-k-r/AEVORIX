require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'aevorix-dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JWT Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role Authorization Middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user?.role 
      });
    }
    next();
  };
};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'AEVORIX Backend' });
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', role)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Log access
    await supabase.from('access_logs').insert({
      user_id: user.id,
      role: user.role,
      action: 'LOGIN',
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .eq('id', req.user.userId)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

// Example Protected Routes with RBAC
// Doctors can create diagnoses and prescriptions
app.post('/api/diagnoses', authenticateToken, authorizeRoles('Doctor', 'Admin'), async (req, res) => {
  const { patient_id, condition_name, diagnosed_date } = req.body;
  
  if (!patient_id || !condition_name || !diagnosed_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const recordData = {
      patient_id,
      condition_name,
      diagnosed_date,
      recorded_by: req.user.userId,
    };

    // Compute SHA-256 hash (in production, this would be done by DB trigger)
    const crypto = require('crypto');
    const sha256_hash = crypto.createHash('sha256').update(JSON.stringify(recordData)).digest('hex');

    const { data, error } = await supabase
      .from('diagnoses')
      .insert({ ...recordData, sha256_hash })
      .select()
      .single();

    if (error) throw error;

    // Log access
    await supabase.from('access_logs').insert({
      user_id: req.user.userId,
      role: req.user.role,
      patient_id,
      action: 'CREATE_DIAGNOSIS',
    });

    res.status(201).json(data);
  } catch (err) {
    console.error('Create diagnosis error:', err);
    res.status(500).json({ error: 'Failed to create diagnosis' });
  }
});

// Doctors can create prescriptions
app.post('/api/prescriptions', authenticateToken, authorizeRoles('Doctor', 'Admin'), async (req, res) => {
  const { patient_id, medication_name, dosage_instructions } = req.body;
  
  if (!patient_id || !medication_name || !dosage_instructions) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const recordData = {
      patient_id,
      medication_name,
      dosage_instructions,
      prescribed_by: req.user.userId,
    };

    const crypto = require('crypto');
    const sha256_hash = crypto.createHash('sha256').update(JSON.stringify(recordData)).digest('hex');

    const { data, error } = await supabase
      .from('prescriptions')
      .insert({ ...recordData, sha256_hash })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('access_logs').insert({
      user_id: req.user.userId,
      role: req.user.role,
      patient_id,
      action: 'CREATE_PRESCRIPTION',
    });

    res.status(201).json(data);
  } catch (err) {
    console.error('Create prescription error:', err);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Lab technicians can create lab results
app.post('/api/lab-results', authenticateToken, authorizeRoles('Lab', 'Admin'), async (req, res) => {
  const { patient_id, test_name, result_value, target_range } = req.body;
  
  if (!patient_id || !test_name || !result_value) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const recordData = {
      patient_id,
      test_name,
      result_value,
      target_range,
      recorded_by: req.user.userId,
    };

    const crypto = require('crypto');
    const sha256_hash = crypto.createHash('sha256').update(JSON.stringify(recordData)).digest('hex');

    const { data, error } = await supabase
      .from('lab_results')
      .insert({ ...recordData, sha256_hash })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('access_logs').insert({
      user_id: req.user.userId,
      role: req.user.role,
      patient_id,
      action: 'CREATE_LAB_RESULT',
    });

    res.status(201).json(data);
  } catch (err) {
    console.error('Create lab result error:', err);
    res.status(500).json({ error: 'Failed to create lab result' });
  }
});

// Pharmacists and Nurses can view prescriptions
app.get('/api/patients/:patientCode/prescriptions', authenticateToken, authorizeRoles('Pharmacist', 'Nurse', 'Doctor', 'Admin'), async (req, res) => {
  const { patientCode } = req.params;

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('patient_code', patientCode)
    .single();

  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const { data, error } = await supabase
    .from('prescriptions')
    .select('*, prescribed_by:users(full_name, role)')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  await supabase.from('access_logs').insert({
    user_id: req.user.userId,
    role: req.user.role,
    patient_id: patient.id,
    action: 'VIEW_PRESCRIPTIONS',
  });

  res.json(data || []);
});

// Nurses and Doctors can view lab results
app.get('/api/patients/:patientCode/lab-results', authenticateToken, authorizeRoles('Nurse', 'Doctor', 'Lab', 'Admin'), async (req, res) => {
  const { patientCode } = req.params;

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('patient_code', patientCode)
    .single();

  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const { data, error } = await supabase
    .from('lab_results')
    .select('*, recorded_by:users(full_name, role)')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  await supabase.from('access_logs').insert({
    user_id: req.user.userId,
    role: req.user.role,
    patient_id: patient.id,
    action: 'VIEW_LAB_RESULTS',
  });

  res.json(data || []);
});

// All authenticated users can view patient info
app.get('/api/patients/:patientCode', authenticateToken, authorizeRoles('Doctor', 'Nurse', 'Lab', 'Pharmacist', 'Admin'), async (req, res) => {
  const { patientCode } = req.params;

  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('patient_code', patientCode)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  await supabase.from('access_logs').insert({
    user_id: req.user.userId,
    role: req.user.role,
    patient_id: patient.id,
    action: 'VIEW_PATIENT',
  });

  res.json(patient);
});

// Mock NFC/Biometric scan endpoints (for hardware integration later)
app.post('/api/auth/nfc-scan', async (req, res) => {
  const { nfc_uid } = req.body;
  
  if (!nfc_uid) {
    return res.status(400).json({ error: 'NFC UID required' });
  }

  // Mock: In production, this would read from hardware
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('nfc_uid', nfc_uid)
    .eq('nfc_status', 'Active')
    .single();

  if (error || !patient) {
    return res.status(404).json({ error: 'Patient not found or NFC inactive' });
  }

  res.json({ patient, message: 'NFC scan successful' });
});

app.post('/api/auth/biometric-scan', async (req, res) => {
  const { patient_code, biometric_hash } = req.body;
  
  // Mock: In production, this would verify fingerprint/biometric
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('patient_code', patient_code)
    .single();

  if (error || !patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Mock biometric verification (always passes for demo)
  res.json({ patient, verified: true, message: 'Biometric verification successful' });
});

// Patient routes
app.get('/api/patients/:patientCode', async (req, res) => {
  const { patientCode } = req.params;
  
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('patient_code', patientCode)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  res.json(patient);
});

app.get('/api/patients/:patientCode/records', async (req, res) => {
  const { patientCode } = req.params;
  
  // Get patient ID first
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('patient_code', patientCode)
    .single();

  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Fetch all records in parallel
  const [diagnoses, prescriptions, labResults] = await Promise.all([
    supabase.from('diagnoses').select('*, recorded_by:users(full_name, role)').eq('patient_id', patient.id).order('diagnosed_date', { ascending: false }),
    supabase.from('prescriptions').select('*, prescribed_by:users(full_name, role)').eq('patient_id', patient.id).order('created_at', { ascending: false }),
    supabase.from('lab_results').select('*, recorded_by:users(full_name, role)').eq('patient_id', patient.id).order('created_at', { ascending: false })
  ]);

  res.json({
    diagnoses: diagnoses.data || [],
    prescriptions: prescriptions.data || [],
    lab_results: labResults.data || []
  });
});

// Blockchain verification endpoint
app.get('/api/blockchain/verify/:recordType/:recordId', async (req, res) => {
  const { recordType, recordId } = req.params;
  
  const { data: ledgerEntry, error } = await supabase
    .from('blockchain_ledger')
    .select('*')
    .eq('record_type', recordType)
    .eq('record_id', recordId)
    .single();

  if (error || !ledgerEntry) {
    return res.status(404).json({ error: 'Blockchain record not found' });
  }

  // Verify chain integrity
  const { data: previousBlock } = await supabase
    .from('blockchain_ledger')
    .select('data_hash')
    .eq('block_index', ledgerEntry.block_index - 1)
    .single();

  const isValid = !previousBlock || previousBlock.data_hash === ledgerEntry.previous_hash;

  res.json({
    ...ledgerEntry,
    chain_valid: isValid,
    verified_at: new Date().toISOString()
  });
});

// Access logs
app.get('/api/access-logs/:patientCode', async (req, res) => {
  const { patientCode } = req.params;
  
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('patient_code', patientCode)
    .single();

  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const { data: logs, error } = await supabase
    .from('access_logs')
    .select('*, user:users(full_name)')
    .eq('patient_id', patient.id)
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(logs || []);
});

// XAI Explainability endpoint (mock)
app.post('/api/ai/explain', async (req, res) => {
  const { record_type, record_id, question } = req.body;
  
  // Mock XAI response - in production, this would call an ML model
  const explanations = {
    diagnosis: `This diagnosis was made based on clinical presentation, lab results (HbA1c 7.2%, fasting glucose 145 mg/dL), and patient history. The AI model considered 15 features with highest weights on glucose levels and BMI.`,
    prescription: `Metformin 500mg BID is first-line therapy for Type 2 Diabetes per ADA 2024 guidelines. Dosage adjusted for renal function (eGFR > 45). Alternative: GLP-1 agonist if HbA1c target not met in 3 months.`,
    lab_result: `HbA1c of 7.2% indicates suboptimal glycemic control (target <7%). Trending up from 6.8% three months ago. Recommend medication intensification and dietary counseling.`
  };

  res.json({
    explanation: explanations[record_type] || 'Explanation not available for this record type.',
    confidence: 0.92,
    factors: [
      { feature: 'HbA1c', importance: 0.35, value: '7.2%' },
      { feature: 'Fasting Glucose', importance: 0.28, value: '145 mg/dL' },
      { feature: 'BMI', importance: 0.18, value: '29.4' },
      { feature: 'Age', importance: 0.12, value: '52' },
      { feature: 'Medication Adherence', importance: 0.07, value: 'Good' }
    ],
    generated_at: new Date().toISOString()
  });
});

// RAG Medical Query endpoint (mock)
app.post('/api/ai/query', async (req, res) => {
  const { query, patient_code } = req.body;
  
  // Mock RAG response - in production, this would query vector DB + LLM
  const mockResponses = {
    'diabetes': `Based on Rahul Sharma's records: HbA1c 7.2% (target <7%), on Metformin 500mg BID. Consider adding GLP-1 agonist or SGLT2 inhibitor per ADA 2024 guidelines. Monitor renal function.`,
    'medication': `Current medications: Metformin 500mg BID, Lisinopril 10mg daily, Cetirizine 10mg PRN. No drug interactions detected. Penicillin allergy noted - avoid beta-lactams.`,
    'allergy': `Patient has documented allergies: Penicillin (anaphylaxis risk), Peanuts. All prescriptions screened for cross-reactivity. Cephalosporins use with caution (1-2% cross-reactivity).`,
    'default': `I can help you query Rahul Sharma's medical records. Try asking about: diabetes management, current medications, allergies, lab trends, or treatment recommendations.`
  };

  const lowerQuery = query.toLowerCase();
  let response = mockResponses.default;
  
  if (lowerQuery.includes('diabetes') || lowerQuery.includes('glucose') || lowerQuery.includes('hba1c')) {
    response = mockResponses.diabetes;
  } else if (lowerQuery.includes('medication') || lowerQuery.includes('drug') || lowerQuery.includes('prescription')) {
    response = mockResponses.medication;
  } else if (lowerQuery.includes('allergy') || lowerQuery.includes('penicillin') || lowerQuery.includes('peanut')) {
    response = mockResponses.allergy;
  }

  res.json({
    answer: response,
    sources: [
      { type: 'lab_result', reference: 'HbA1c 7.2% (2024-11-15)' },
      { type: 'prescription', reference: 'Metformin 500mg BID' },
      { type: 'diagnosis', reference: 'Type 2 Diabetes Mellitus (2024-01-15)' },
      { type: 'allergy', reference: 'Penicillin, Peanuts' }
    ],
    confidence: 0.89,
    generated_at: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`AEVORIX Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;