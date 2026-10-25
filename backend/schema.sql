-- AEVORIX Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (staff: Doctors, Nurses, Lab, Pharmacists, Admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Doctor', 'Nurse', 'Lab', 'Pharmacist', 'Admin')),
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10),
    allergies JSONB DEFAULT '[]'::jsonb,
    nfc_uid VARCHAR(50) UNIQUE,
    nfc_status VARCHAR(20) DEFAULT 'Active' CHECK (nfc_status IN ('Active', 'Inactive', 'Revoked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagnoses table
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    condition_name VARCHAR(255) NOT NULL,
    diagnosed_date DATE NOT NULL,
    recorded_by UUID NOT NULL REFERENCES users(id),
    sha256_hash VARCHAR(64) NOT NULL,
    blockchain_tx_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage_instructions TEXT NOT NULL,
    prescribed_by UUID NOT NULL REFERENCES users(id),
    sha256_hash VARCHAR(64) NOT NULL,
    blockchain_tx_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Results table
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    result_value TEXT NOT NULL,
    target_range VARCHAR(255),
    recorded_by UUID NOT NULL REFERENCES users(id),
    sha256_hash VARCHAR(64) NOT NULL,
    blockchain_tx_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain Ledger table (immutable audit trail)
CREATE TABLE blockchain_ledger (
    block_index BIGSERIAL PRIMARY KEY,
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('diagnosis', 'prescription', 'lab_result', 'patient')),
    record_id UUID NOT NULL,
    patient_code VARCHAR(50) NOT NULL,
    data_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Access Logs table
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    patient_id UUID REFERENCES patients(id),
    action VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_patients_code ON patients(patient_code);
CREATE INDEX idx_patients_nfc_uid ON patients(nfc_uid);
CREATE INDEX idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_lab_results_patient ON lab_results(patient_id);
CREATE INDEX idx_blockchain_patient ON blockchain_ledger(patient_code);
CREATE INDEX idx_blockchain_record ON blockchain_ledger(record_type, record_id);
CREATE INDEX idx_access_logs_user ON access_logs(user_id);
CREATE INDEX idx_access_logs_patient ON access_logs(patient_id);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Users: Users can read their own record, Admins can read all
CREATE POLICY "Users can read own record" ON users
    FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'));

-- Patients: Role-based access
CREATE POLICY "Doctors/Nurses can read patients" ON patients
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Doctor', 'Nurse', 'Admin'))
    );

CREATE POLICY "Lab/Pharmacist can read assigned patients" ON patients
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Lab', 'Pharmacist', 'Admin'))
    );

-- Diagnoses: Role-based access
CREATE POLICY "Doctors can manage diagnoses" ON diagnoses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Doctor', 'Admin'))
    );

CREATE POLICY "Nurses/Lab can read diagnoses" ON diagnoses
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Nurse', 'Lab', 'Admin'))
    );

-- Prescriptions: Role-based access
CREATE POLICY "Doctors can manage prescriptions" ON prescriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Doctor', 'Admin'))
    );

CREATE POLICY "Pharmacists/Nurses can read prescriptions" ON prescriptions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Pharmacist', 'Nurse', 'Admin'))
    );

-- Lab Results: Role-based access
CREATE POLICY "Lab can manage lab results" ON lab_results
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Lab', 'Admin'))
    );

CREATE POLICY "Doctors/Nurses can read lab results" ON lab_results
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Doctor', 'Nurse', 'Admin'))
    );

-- Blockchain Ledger: Read-only for authorized roles
CREATE POLICY "Authorized roles can read blockchain" ON blockchain_ledger
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Doctor', 'Nurse', 'Lab', 'Pharmacist', 'Admin'))
    );

-- Access Logs: Admins can read all, users can read their own
CREATE POLICY "Admins can read all access logs" ON access_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
    );

CREATE POLICY "Users can read own access logs" ON access_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Function to compute SHA-256 hash of record data
CREATE OR REPLACE FUNCTION compute_record_hash(record_data JSONB)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(digest(record_data::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get previous blockchain hash
CREATE OR REPLACE FUNCTION get_previous_hash()
RETURNS VARCHAR(64) AS $$
DECLARE
    prev_hash VARCHAR(64);
BEGIN
    SELECT data_hash INTO prev_hash
    FROM blockchain_ledger
    ORDER BY block_index DESC
    LIMIT 1;
    RETURN COALESCE(prev_hash, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-populate blockchain ledger
CREATE OR REPLACE FUNCTION log_to_blockchain()
RETURNS TRIGGER AS $$
DECLARE
    record_data JSONB;
    data_hash VARCHAR(64);
    prev_hash VARCHAR(64);
    rec_type VARCHAR(50);
    rec_id UUID;
    p_code VARCHAR(50);
BEGIN
    -- Determine record type and ID based on table
    IF TG_TABLE_NAME = 'diagnoses' THEN
        rec_type := 'diagnosis';
        rec_id := NEW.id;
        SELECT patient_code INTO p_code FROM patients WHERE id = NEW.patient_id;
        record_data := jsonb_build_object(
            'id', NEW.id,
            'patient_id', NEW.patient_id,
            'condition_name', NEW.condition_name,
            'diagnosed_date', NEW.diagnosed_date,
            'recorded_by', NEW.recorded_by
        );
    ELSIF TG_TABLE_NAME = 'prescriptions' THEN
        rec_type := 'prescription';
        rec_id := NEW.id;
        SELECT patient_code INTO p_code FROM patients WHERE id = NEW.patient_id;
        record_data := jsonb_build_object(
            'id', NEW.id,
            'patient_id', NEW.patient_id,
            'medication_name', NEW.medication_name,
            'dosage_instructions', NEW.dosage_instructions,
            'prescribed_by', NEW.prescribed_by
        );
    ELSIF TG_TABLE_NAME = 'lab_results' THEN
        rec_type := 'lab_result';
        rec_id := NEW.id;
        SELECT patient_code INTO p_code FROM patients WHERE id = NEW.patient_id;
        record_data := jsonb_build_object(
            'id', NEW.id,
            'patient_id', NEW.patient_id,
            'test_name', NEW.test_name,
            'result_value', NEW.result_value,
            'target_range', NEW.target_range,
            'recorded_by', NEW.recorded_by
        );
    ELSIF TG_TABLE_NAME = 'patients' THEN
        rec_type := 'patient';
        rec_id := NEW.id;
        p_code := NEW.patient_code;
        record_data := jsonb_build_object(
            'id', NEW.id,
            'patient_code', NEW.patient_code,
            'full_name', NEW.full_name,
            'blood_group', NEW.blood_group,
            'allergies', NEW.allergies,
            'nfc_uid', NEW.nfc_uid
        );
    END IF;

    -- Compute hash
    data_hash := compute_record_hash(record_data);
    prev_hash := get_previous_hash();

    -- Insert into blockchain ledger
    INSERT INTO blockchain_ledger (record_type, record_id, patient_code, data_hash, previous_hash)
    VALUES (rec_type, rec_id, p_code, data_hash, prev_hash);

    -- Update the record with hash
    IF TG_TABLE_NAME IN ('diagnoses', 'prescriptions', 'lab_results') THEN
        NEW.sha256_hash := data_hash;
        NEW.blockchain_tx_id := 'blk_' || (SELECT block_index FROM blockchain_ledger WHERE data_hash = data_hash LIMIT 1);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for blockchain logging
CREATE TRIGGER trigger_diagnoses_blockchain
    BEFORE INSERT ON diagnoses
    FOR EACH ROW EXECUTE FUNCTION log_to_blockchain();

CREATE TRIGGER trigger_prescriptions_blockchain
    BEFORE INSERT ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION log_to_blockchain();

CREATE TRIGGER trigger_lab_results_blockchain
    BEFORE INSERT ON lab_results
    FOR EACH ROW EXECUTE FUNCTION log_to_blockchain();

CREATE TRIGGER trigger_patients_blockchain
    BEFORE INSERT ON patients
    FOR EACH ROW EXECUTE FUNCTION log_to_blockchain();

-- Seed Data for Test Patient Rahul Sharma (AEV-2026-8941)
-- Note: Password hashes are for 'password123' - replace in production!

-- Insert test users
INSERT INTO users (id, email, password_hash, role, full_name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'dr.rao@aevorix.com', '$2a$10$xJwK5vZ8Y7Q6R5T4Y3U2IuK1J2H3G4F5E6D7C8B9A0', 'Doctor', 'Dr. Priya Rao'),
    ('22222222-2222-2222-2222-222222222222', 'nurse.mehta@aevorix.com', '$2a$10$xJwK5vZ8Y7Q6R5T4Y3U2IuK1J2H3G4F5E6D7C8B9A0', 'Nurse', 'Nurse Anjali Mehta'),
    ('33333333-3333-3333-3333-333333333333', 'lab.kumar@aevorix.com', '$2a$10$xJwK5vZ8Y7Q6R5T4Y3U2IuK1J2H3G4F5E6D7C8B9A0', 'Lab', 'Lab Tech Rajesh Kumar'),
    ('44444444-4444-4444-4444-444444444444', 'pharma.shah@aevorix.com', '$2a$10$xJwK5vZ8Y7Q6R5T4Y3U2IuK1J2H3G4F5E6D7C8B9A0', 'Pharmacist', 'Pharmacist Vikram Shah'),
    ('55555555-5555-5555-5555-555555555555', 'admin@aevorix.com', '$2a$10$xJwK5vZ8Y7Q6R5T4Y3U2IuK1J2H3G4F5E6D7C8B9A0', 'Admin', 'System Admin');

-- Insert test patient Rahul Sharma
INSERT INTO patients (id, patient_code, full_name, blood_group, allergies, nfc_uid, nfc_status) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AEV-2026-8941', 'Rahul Sharma', 'O+', '["Penicillin", "Peanuts"]', '04:A3:B2:C1:D0:9E', 'Active');

-- Insert sample diagnoses for Rahul Sharma
INSERT INTO diagnoses (patient_id, condition_name, diagnosed_date, recorded_by, sha256_hash) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Type 2 Diabetes Mellitus', '2024-01-15', '11111111-1111-1111-1111-111111111111', ''),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hypertension', '2024-03-22', '11111111-1111-1111-1111-111111111111', ''),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Seasonal Allergic Rhinitis', '2024-06-10', '11111111-1111-1111-1111-111111111111', '');

-- Insert sample prescriptions for Rahul Sharma
INSERT INTO prescriptions (patient_id, medication_name, dosage_instructions, prescribed_by, sha256_hash) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Metformin', '500mg twice daily with meals', '11111111-1111-1111-1111-111111111111', ''),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lisinopril', '10mg once daily in the morning', '11111111-1111-1111-1111-111111111111', ''),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cetirizine', '10mg once daily at bedtime as needed for allergies', '11111111-1111-1111-1111-111111111111', '');

-- Insert sample lab results for Rahul Sharma
INSERT INTO lab_results (patient_id, test_name, result_value, target_range, recorded_by, sha256_hash) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'HbA1c', '7.2%', '< 7.0%', '33333333-3333-3333-3333-333333333333', ''),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fasting Blood Glucose', '145 mg/dL', '70-100 mg/dL', '33333333-3333-3333-3333-333333333333', ''),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lipid Panel - Total Cholesterol', '210 mg/dL', '< 200 mg/dL', '33333333-3333-3333-3333-333333333333', ''),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Blood Pressure', '142/88 mmHg', '< 130/80 mmHg', '22222222-2222-2222-2222-222222222222', '');

-- Insert sample access logs
INSERT INTO access_logs (user_id, role, patient_id, action) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Doctor', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VIEW_PATIENT'),
    ('11111111-1111-1111-1111-111111111111', 'Doctor', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE_DIAGNOSIS'),
    ('22222222-2222-2222-2222-222222222222', 'Nurse', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VIEW_PATIENT'),
    ('33333333-3333-3333-3333-333333333333', 'Lab', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE_LAB_RESULT'),
    ('44444444-4444-4444-4444-444444444444', 'Pharmacist', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VIEW_PRESCRIPTION');

-- Update sequence for blockchain_ledger block_index
SELECT setval('blockchain_ledger_block_index_seq', (SELECT COALESCE(MAX(block_index), 0) FROM blockchain_ledger));