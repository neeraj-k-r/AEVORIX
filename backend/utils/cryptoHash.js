const crypto = require('crypto');

/**
 * Canonicalizes a record payload by sorting keys in a deterministic order
 * @param {Object} payload - The record payload to canonicalize
 * @returns {string} - JSON string with sorted keys
 */
function canonicalizePayload(payload) {
  const canonicalOrder = [
    'patient_code',
    'record_type',
    'content',
    'date',
    'author_role',
    'record_id',
    'block_index',
    'previous_hash',
    'timestamp',
  ];

  const sortedKeys = Object.keys(payload).sort((a, b) => {
    const indexA = canonicalOrder.indexOf(a);
    const indexB = canonicalOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const canonical = {};
  for (const key of sortedKeys) {
    canonical[key] = payload[key];
  }

  return JSON.stringify(canonical);
}

/**
 * Generates a deterministic SHA-256 hash for a record payload
 * @param {Object} recordPayload - The record data to hash
 * @returns {string} - Hex-encoded SHA-256 digest
 */
function generateRecordHash(recordPayload) {
  const canonicalString = canonicalizePayload(recordPayload);
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Generates a hash for blockchain ledger entry
 * @param {Object} ledgerEntry - The ledger entry to hash
 * @returns {string} - Hex-encoded SHA-256 digest
 */
function generateLedgerHash(ledgerEntry) {
  const canonicalString = canonicalizePayload(ledgerEntry);
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Verifies a record's integrity by comparing computed hash with stored hash
 * @param {Object} recordPayload - Current record data from database
 * @param {string} storedHash - The hash stored in blockchain_ledger
 * @returns {boolean} - True if hashes match
 */
function verifyRecordIntegrity(recordPayload, storedHash) {
  const computedHash = generateRecordHash(recordPayload);
  return computedHash === storedHash;
}

module.exports = {
  generateRecordHash,
  generateLedgerHash,
  verifyRecordIntegrity,
  canonicalizePayload,
};