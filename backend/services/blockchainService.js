const { generateRecordHash, generateLedgerHash } = require('../utils/cryptoHash');

/**
 * Creates a new blockchain ledger entry for a record
 * @param {Object} supabase - Supabase client
 * @param {Object} params - Ledger entry parameters
 * @returns {Promise<Object>} - The created ledger entry
 */
async function createLedgerEntry(supabase, params) {
  const { record_type, record_id, patient_code, record_payload } = params;

  // Generate hash of the record content
  const data_hash = generateRecordHash(record_payload);

  // Get the previous block's hash
  const { data: previousBlock } = await supabase
    .from('blockchain_ledger')
    .select('data_hash, block_index')
    .order('block_index', { ascending: false })
    .limit(1)
    .single();

  const previous_hash = previousBlock?.data_hash || '0';
  const block_index = (previousBlock?.block_index || 0) + 1;

  // Create the ledger entry
  const ledgerPayload = {
    block_index,
    record_type,
    record_id,
    patient_code,
    data_hash,
    previous_hash,
    timestamp: new Date().toISOString(),
  };

  // Generate hash of the ledger entry itself
  const ledger_hash = generateLedgerHash(ledgerPayload);

  const { data, error } = await supabase
    .from('blockchain_ledger')
    .insert({ ...ledgerPayload, ledger_hash })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create ledger entry: ${error.message}`);
  }

  return data;
}

/**
 * Gets the latest block for a specific record
 * @param {Object} supabase - Supabase client
 * @param {string} record_type - Type of record (diagnosis, prescription, lab_result)
 * @param {string} record_id - UUID of the record
 * @returns {Promise<Object|null>} - The latest ledger entry or null
 */
async function getLatestLedgerEntry(supabase, record_type, record_id) {
  const { data, error } = await supabase
    .from('blockchain_ledger')
    .select('*')
    .eq('record_type', record_type)
    .eq('record_id', record_id)
    .order('block_index', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get ledger entry: ${error.message}`);
  }

  return data || null;
}

/**
 * Verifies all records for a patient against the blockchain ledger
 * @param {Object} supabase - Supabase client
 * @param {string} patient_code - Patient code to verify
 * @returns {Promise<Array>} - Array of verification results
 */
async function verifyPatientRecords(supabase, patient_code) {
  const results = [];

  // Get patient ID
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('patient_code', patient_code)
    .single();

  if (!patient) {
    return [{ error: 'Patient not found', verified: false }];
  }

  const patient_id = patient.id;

  // Verify diagnoses
  const { data: diagnoses } = await supabase
    .from('diagnoses')
    .select('*, recorded_by:users(full_name, role)')
    .eq('patient_id', patient_id);

  if (diagnoses) {
    for (const diagnosis of diagnoses) {
      const verified = await verifySingleRecord(
        supabase,
        'diagnosis',
        diagnosis,
        patient_code
      );
      results.push({ ...verified, record: diagnosis });
    }
  }

  // Verify prescriptions
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*, prescribed_by:users(full_name, role)')
    .eq('patient_id', patient_id);

  if (prescriptions) {
    for (const prescription of prescriptions) {
      const verified = await verifySingleRecord(
        supabase,
        'prescription',
        prescription,
        patient_code
      );
      results.push({ ...verified, record: prescription });
    }
  }

  // Verify lab results
  const { data: labResults } = await supabase
    .from('lab_results')
    .select('*, recorded_by:users(full_name, role)')
    .eq('patient_id', patient_id);

  if (labResults) {
    for (const labResult of labResults) {
      const verified = await verifySingleRecord(
        supabase,
        'lab_result',
        labResult,
        patient_code
      );
      results.push({ ...verified, record: labResult });
    }
  }

  return results;
}

/**
 * Verifies a single record against the blockchain
 * @param {Object} supabase - Supabase client
 * @param {string} record_type - Type of record
 * @param {Object} record - The record data
 * @param {string} patient_code - Patient code
 * @returns {Promise<Object>} - Verification result
 */
async function verifySingleRecord(supabase, record_type, record, patient_code) {
  const ledgerEntry = await getLatestLedgerEntry(supabase, record_type, record.id);

  if (!ledgerEntry) {
    return {
      record_id: record.id,
      record_type,
      verified: false,
      reason: 'No blockchain entry found',
      computed_hash: generateRecordHash(buildRecordPayload(record_type, record)),
      stored_hash: null,
    };
  }

  const recordPayload = buildRecordPayload(record_type, record);
  const computed_hash = generateRecordHash(recordPayload);
  const verified = computed_hash === ledgerEntry.data_hash;

  return {
    record_id: record.id,
    record_type,
    verified,
    reason: verified ? 'Hash matches blockchain ledger' : 'Hash mismatch - potential tampering detected',
    computed_hash,
    stored_hash: ledgerEntry.data_hash,
    block_index: ledgerEntry.block_index,
    timestamp: ledgerEntry.timestamp,
  };
}

/**
 * Builds the canonical payload for a record based on its type
 * @param {string} record_type - Type of record
 * @param {Object} record - The record data
 * @returns {Object} - Canonical payload
 */
function buildRecordPayload(record_type, record) {
  const base = {
    patient_code: record.patient_code || '',
    record_type,
    record_id: record.id,
    date: record.diagnosed_date || record.created_at || record.timestamp,
    author_role: record.recorded_by?.role || record.prescribed_by?.role || 'Unknown',
  };

  switch (record_type) {
    case 'diagnosis':
      return {
        ...base,
        content: {
          condition_name: record.condition_name,
          diagnosed_date: record.diagnosed_date,
        },
      };
    case 'prescription':
      return {
        ...base,
        content: {
          medication_name: record.medication_name,
          dosage_instructions: record.dosage_instructions,
        },
      };
    case 'lab_result':
      return {
        ...base,
        content: {
          test_name: record.test_name,
          result_value: record.result_value,
          target_range: record.target_range,
        },
      };
    default:
      return base;
  }
}

/**
 * Verifies the entire blockchain chain integrity
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} - Chain verification result
 */
async function verifyChainIntegrity(supabase) {
  const { data: blocks, error } = await supabase
    .from('blockchain_ledger')
    .select('*')
    .order('block_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch ledger: ${error.message}`);
  }

  const results = {
    valid: true,
    total_blocks: blocks.length,
    mismatches: [],
  };

  let previousHash = '0';

  for (const block of blocks) {
    // Verify chain linkage
    if (block.previous_hash !== previousHash) {
      results.valid = false;
      results.mismatches.push({
        block_index: block.block_index,
        type: 'chain_break',
        expected: previousHash,
        actual: block.previous_hash,
      });
    }

    // Verify block hash
    const ledgerPayload = {
      block_index: block.block_index,
      record_type: block.record_type,
      record_id: block.record_id,
      patient_code: block.patient_code,
      data_hash: block.data_hash,
      previous_hash: block.previous_hash,
      timestamp: block.timestamp,
    };
    const computedHash = generateLedgerHash(ledgerPayload);
    if (block.ledger_hash && computedHash !== block.ledger_hash) {
      results.valid = false;
      results.mismatches.push({
        block_index: block.block_index,
        type: 'hash_mismatch',
        expected: block.ledger_hash,
        actual: computedHash,
      });
    }

    previousHash = block.data_hash;
  }

  return results;
}

module.exports = {
  createLedgerEntry,
  getLatestLedgerEntry,
  verifyPatientRecords,
  verifySingleRecord,
  verifyChainIntegrity,
  buildRecordPayload,
};