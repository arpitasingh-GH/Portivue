import { EvidenceLabel, Profile } from '../types/portfolio';

export function isValidUsername(username: string): { valid: boolean; message: string } {
  const clean = username.trim().toLowerCase();
  if (clean.length < 3) return { valid: false, message: 'Username must be at least 3 characters long.' };
  if (clean.length > 30) return { valid: false, message: 'Username must be 30 characters or fewer.' };
  if (clean === 'ansh-shrivastava') {
    return { valid: false, message: '"ansh-shrivastava" is reserved for the sample demonstration profile.' };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean)) {
    return { valid: false, message: 'Use only lowercase letters, numbers, and single hyphens.' };
  }
  return { valid: true, message: 'Valid username format.' };
}

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getEvidenceLabel(evidenceUrl: string | null | undefined): EvidenceLabel {
  if (evidenceUrl && evidenceUrl.trim().length > 0 && isValidHttpUrl(evidenceUrl)) {
    return 'Evidence linked';
  }
  return 'Self-reported';
}
