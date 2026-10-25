import { describe, it, expect } from 'vitest';
import { dashboardMenuItems } from '../pages/dashboard/menuItems';

describe('dashboardMenuItems', () => {
  it('exports 5 menu items', () => {
    expect(dashboardMenuItems).toHaveLength(5);
  });

  it('has correct structure for each item', () => {
    dashboardMenuItems.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('icon');
      expect(item).toHaveProperty('section');
      expect(typeof item.id).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(typeof item.icon).toBe('string');
      expect(typeof item.section).toBe('string');
    });
  });

  it('contains all required sections', () => {
    const sections = dashboardMenuItems.map((item) => item.section);
    expect(sections).toContain('diagnoses');
    expect(sections).toContain('prescriptions');
    expect(sections).toContain('lab-results');
    expect(sections).toContain('allergies');
    expect(sections).toContain('access-logs');
  });

  it('has correct labels', () => {
    const labels = dashboardMenuItems.map((item) => item.label);
    expect(labels).toContain('Medical History');
    expect(labels).toContain('Treatments');
    expect(labels).toContain('Diagnostics');
    expect(labels).toContain('Allergies');
    expect(labels).toContain('Access Logs');
  });

  it('has correct icons', () => {
    const icons = dashboardMenuItems.map((item) => item.icon);
    expect(icons).toContain('History');
    expect(icons).toContain('Pill');
    expect(icons).toContain('Activity');
    expect(icons).toContain('AlertTriangle');
    expect(icons).toContain('Clock');
  });
});