const { buildRecordPayload } = require('../services/blockchainService');

describe('blockchainService', () => {
  describe('buildRecordPayload', () => {
    it('builds diagnosis payload correctly', () => {
      const record = {
        id: 'diag-1',
        patient_code: 'AEV-2026-8941',
        condition_name: 'Type 2 Diabetes Mellitus',
        diagnosed_date: '2026-10-12',
        recorded_by: { role: 'Doctor' },
      };

      const payload = buildRecordPayload('diagnosis', record);

      expect(payload.patient_code).toBe('AEV-2026-8941');
      expect(payload.record_type).toBe('diagnosis');
      expect(payload.record_id).toBe('diag-1');
      expect(payload.date).toBe('2026-10-12');
      expect(payload.author_role).toBe('Doctor');
      expect(payload.content.condition_name).toBe('Type 2 Diabetes Mellitus');
      expect(payload.content.diagnosed_date).toBe('2026-10-12');
    });

    it('builds prescription payload correctly', () => {
      const record = {
        id: 'rx-1',
        patient_code: 'AEV-2026-8941',
        medication_name: 'Metformin',
        dosage_instructions: '500mg twice daily with meals',
        prescribed_by: { role: 'Doctor' },
      };

      const payload = buildRecordPayload('prescription', record);

      expect(payload.patient_code).toBe('AEV-2026-8941');
      expect(payload.record_type).toBe('prescription');
      expect(payload.record_id).toBe('rx-1');
      expect(payload.author_role).toBe('Doctor');
      expect(payload.content.medication_name).toBe('Metformin');
      expect(payload.content.dosage_instructions).toBe('500mg twice daily with meals');
    });

    it('builds lab_result payload correctly', () => {
      const record = {
        id: 'lab-1',
        patient_code: 'AEV-2026-8941',
        test_name: 'HbA1c',
        result_value: '6.8%',
        target_range: '< 7.0%',
        recorded_by: { role: 'Lab' },
      };

      const payload = buildRecordPayload('lab_result', record);

      expect(payload.patient_code).toBe('AEV-2026-8941');
      expect(payload.record_type).toBe('lab_result');
      expect(payload.record_id).toBe('lab-1');
      expect(payload.author_role).toBe('Lab');
      expect(payload.content.test_name).toBe('HbA1c');
      expect(payload.content.result_value).toBe('6.8%');
      expect(payload.content.target_range).toBe('< 7.0%');
    });

    it('handles missing recorded_by gracefully', () => {
      const record = {
        id: 'diag-1',
        patient_code: 'AEV-2026-8941',
        condition_name: 'Diabetes',
        diagnosed_date: '2026-10-12',
      };

      const payload = buildRecordPayload('diagnosis', record);

      expect(payload.author_role).toBe('Unknown');
    });
  });
});