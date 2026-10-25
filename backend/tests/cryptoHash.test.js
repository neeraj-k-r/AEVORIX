const { generateRecordHash, generateLedgerHash, verifyRecordIntegrity, canonicalizePayload } = require('../utils/cryptoHash');

describe('cryptoHash', () => {
  describe('canonicalizePayload', () => {
    it('sorts keys in canonical order', () => {
      const payload = {
        zebra: 'z',
        alpha: 'a',
        patient_code: 'AEV-2026-8941',
        record_type: 'diagnosis',
        content: { condition: 'Diabetes' },
        date: '2026-10-26',
        author_role: 'Doctor',
      };

      const canonical = canonicalizePayload(payload);
      const parsed = JSON.parse(canonical);

      const keys = Object.keys(parsed);
      expect(keys[0]).toBe('patient_code');
      expect(keys[1]).toBe('record_type');
      expect(keys[2]).toBe('content');
      expect(keys[3]).toBe('date');
      expect(keys[4]).toBe('author_role');
    });

    it('produces deterministic output for same input', () => {
      const payload = { b: 2, a: 1, c: 3 };
      const result1 = canonicalizePayload(payload);
      const result2 = canonicalizePayload(payload);
      expect(result1).toBe(result2);
    });

    it('handles nested objects', () => {
      const payload = {
        patient_code: 'AEV-2026-8941',
        content: { nested: { deep: 'value' } },
      };

      const canonical = canonicalizePayload(payload);
      expect(canonical).toContain('nested');
      expect(canonical).toContain('deep');
    });
  });

  describe('generateRecordHash', () => {
    it('generates consistent SHA-256 hash', () => {
      const payload = {
        patient_code: 'AEV-2026-8941',
        record_type: 'diagnosis',
        content: { condition_name: 'Type 2 Diabetes Mellitus', diagnosed_date: '2026-10-12' },
        date: '2026-10-12',
        author_role: 'Doctor',
      };

      const hash1 = generateRecordHash(payload);
      const hash2 = generateRecordHash(payload);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex is 64 chars
      expect(hash1).toMatch(/^[a-f0-9]+$/);
    });

    it('produces different hashes for different payloads', () => {
      const payload1 = { patient_code: 'AEV-2026-8941', record_type: 'diagnosis', content: { condition: 'Diabetes' }, date: '2026-10-12', author_role: 'Doctor' };
      const payload2 = { patient_code: 'AEV-2026-8941', record_type: 'diagnosis', content: { condition: 'Hypertension' }, date: '2026-10-12', author_role: 'Doctor' };

      const hash1 = generateRecordHash(payload1);
      const hash2 = generateRecordHash(payload2);

      expect(hash1).not.toBe(hash2);
    });

    it('is order-independent for same logical data', () => {
      const payload1 = { a: 1, b: 2, c: 3 };
      const payload2 = { c: 3, a: 1, b: 2 };

      const hash1 = generateRecordHash(payload1);
      const hash2 = generateRecordHash(payload2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateLedgerHash', () => {
    it('generates hash for ledger entry', () => {
      const ledgerEntry = {
        block_index: 1,
        record_type: 'diagnosis',
        record_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        patient_code: 'AEV-2026-8941',
        data_hash: 'abc123def456',
        previous_hash: '0',
        timestamp: '2026-10-26T12:00:00.000Z',
      };

      const hash = generateLedgerHash(ledgerEntry);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('verifyRecordIntegrity', () => {
    it('returns true when hashes match', () => {
      const payload = {
        patient_code: 'AEV-2026-8941',
        record_type: 'diagnosis',
        content: { condition_name: 'Type 2 Diabetes', diagnosed_date: '2026-10-12' },
        date: '2026-10-12',
        author_role: 'Doctor',
      };

      const storedHash = generateRecordHash(payload);
      const result = verifyRecordIntegrity(payload, storedHash);

      expect(result).toBe(true);
    });

    it('returns false when hashes do not match', () => {
      const payload = {
        patient_code: 'AEV-2026-8941',
        record_type: 'diagnosis',
        content: { condition_name: 'Type 2 Diabetes', diagnosed_date: '2026-10-12' },
        date: '2026-10-12',
        author_role: 'Doctor',
      };

      const tamperedPayload = { ...payload, content: { condition_name: 'Hypertension', diagnosed_date: '2026-10-12' } };
      const storedHash = generateRecordHash(payload);

      const result = verifyRecordIntegrity(tamperedPayload, storedHash);

      expect(result).toBe(false);
    });

    it('detects single field tampering', () => {
      const payload = {
        patient_code: 'AEV-2026-8941',
        record_type: 'lab_result',
        content: { test_name: 'HbA1c', result_value: '6.8%', target_range: '< 7.0%' },
        date: '2026-10-12',
        author_role: 'Lab',
      };

      const storedHash = generateRecordHash(payload);

      // Tamper with result_value
      const tamperedPayload = {
        ...payload,
        content: { ...payload.content, result_value: '9.5%' },
      };

      const result = verifyRecordIntegrity(tamperedPayload, storedHash);
      expect(result).toBe(false);
    });
  });
});