import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Pill, FlaskConical, Stethoscope } from 'lucide-react';
import { Modal, Button, Input, Badge } from '../components';
import { useToast } from '../components/Toast';
import { useDiagnosesApi, usePrescriptionsApi, useLabResultsApi } from '../../hooks';

const typeConfig = {
  diagnosis: {
    title: 'Add Diagnosis',
    icon: Stethoscope,
    fields: [
      { name: 'condition_name', label: 'Condition Name', type: 'text', required: true, placeholder: 'e.g., Type 2 Diabetes Mellitus' },
      { name: 'diagnosed_date', label: 'Diagnosed Date', type: 'date', required: true },
    ],
    submitLabel: 'Add Diagnosis',
  },
  prescription: {
    title: 'Add Prescription',
    icon: Pill,
    fields: [
      { name: 'medication_name', label: 'Medication Name', type: 'text', required: true, placeholder: 'e.g., Metformin' },
      { name: 'dosage_instructions', label: 'Dosage Instructions', type: 'text', required: true, placeholder: 'e.g., 500mg twice daily with meals' },
    ],
    submitLabel: 'Add Prescription',
  },
  lab_result: {
    title: 'Add Lab Result',
    icon: FlaskConical,
    fields: [
      { name: 'test_name', label: 'Test Name', type: 'text', required: true, placeholder: 'e.g., HbA1c' },
      { name: 'result_value', label: 'Result Value', type: 'text', required: true, placeholder: 'e.g., 6.8%' },
      { name: 'target_range', label: 'Target Range', type: 'text', placeholder: 'e.g., < 7.0%' },
    ],
    submitLabel: 'Add Lab Result',
  },
};

export default function AddRecordModal({ isOpen, onClose, recordType, patientId, userRole }) {
  const { error: showError, success: showSuccess } = useToast();
  const { createDiagnosis } = useDiagnosesApi();
  const { createPrescription } = usePrescriptionsApi();
  const { createLabResult } = useLabResultsApi();

  const config = typeConfig[recordType];
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && config) {
      const initialData = {};
      config.fields.forEach((field) => {
        if (field.type === 'date') {
          initialData[field.name] = new Date().toISOString().split('T')[0];
        } else {
          initialData[field.name] = '';
        }
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen, config]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    config.fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      let result;
      const payload = {
        patient_id: patientId,
        ...formData,
      };

      if (recordType === 'diagnosis') {
        result = await createDiagnosis(payload);
      } else if (recordType === 'prescription') {
        result = await createPrescription(payload);
      } else if (recordType === 'lab_result') {
        result = await createLabResult(payload);
      }

      showSuccess(`${config.title} added successfully`);
      onClose();
      return result;
    } catch (err) {
      showError(err.message || `Failed to add ${recordType}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !config) return null;

  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={config.title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="patient_id" value={patientId} />
        <input type="hidden" name="record_type" value={recordType} />

        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
          <span className="font-medium text-primary">{config.title}</span>
          <Badge variant="primary">Blockchain Secured</Badge>
        </div>

        {config.fields.map((field) => (
          <Input
            key={field.name}
            id={field.name}
            label={field.label}
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            error={errors[field.name]}
            autoComplete="off"
          />
        ))}

        <div className="flex justify-end gap-3 pt-4 border-t border-card-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {config.submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}