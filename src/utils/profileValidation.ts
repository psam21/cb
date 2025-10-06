/**
 * Validation utilities for profile fields
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate Lightning Address (lud16)
 * Format: user@domain.com
 */
export const validateLud16 = (value: string): ValidationResult => {
  if (!value) return { isValid: true }; // Optional field
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      isValid: false,
      error: 'Lightning Address must be in format: user@domain.com'
    };
  }
  
  return { isValid: true };
};

/**
 * Validate LNURL (lud06)
 * Format: starts with "lnurl1"
 */
export const validateLud06 = (value: string): ValidationResult => {
  if (!value) return { isValid: true }; // Optional field
  
  if (!value.toLowerCase().startsWith('lnurl1')) {
    return {
      isValid: false,
      error: 'LNURL must start with "lnurl1"'
    };
  }
  
  // Basic length check (LNURLs are typically long)
  if (value.length < 20) {
    return {
      isValid: false,
      error: 'LNURL appears too short. Please check the value.'
    };
  }
  
  return { isValid: true };
};

/**
 * Validate NIP-05 identifier
 * Format: user@domain.com
 */
export const validateNip05 = (value: string): ValidationResult => {
  if (!value) return { isValid: true }; // Optional field
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      isValid: false,
      error: 'NIP-05 identifier must be in format: user@domain.com'
    };
  }
  
  return { isValid: true };
};

/**
 * Validate website URL
 */
export const validateWebsite = (value: string): ValidationResult => {
  if (!value) return { isValid: true }; // Optional field
  
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        isValid: false,
        error: 'Website must start with http:// or https://'
      };
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid URL (e.g., https://example.com)'
    };
  }
};

/**
 * Validate display name
 */
export const validateDisplayName = (value: string): ValidationResult => {
  if (!value) return { isValid: true }; // Optional field
  
  if (value.length > 100) {
    return {
      isValid: false,
      error: 'Display name must be 100 characters or less'
    };
  }
  
  return { isValid: true };
};

/**
 * Validate about text
 */
export const validateAbout = (value: string): ValidationResult => {
  if (!value) return { isValid: true }; // Optional field
  
  if (value.length > 1000) {
    return {
      isValid: false,
      error: 'About text must be 1000 characters or less'
    };
  }
  
  return { isValid: true };
};

/**
 * Validate birthday
 */
export const validateBirthday = (value: string): ValidationResult => {
  if (!value) return { isValid: true }; // Optional field
  
  const date = new Date(value);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Please enter a valid date'
    };
  }
  
  if (date > now) {
    return {
      isValid: false,
      error: 'Birthday cannot be in the future'
    };
  }
  
  // Check if birthday is reasonable (not more than 150 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  
  if (date < minDate) {
    return {
      isValid: false,
      error: 'Please enter a reasonable date'
    };
  }
  
  return { isValid: true };
};

/**
 * Validate all profile fields
 */
export const validateProfileFields = (profile: Partial<{
  display_name?: string;
  about?: string;
  website?: string;
  birthday?: string;
  lud16?: string;
  lud06?: string;
  nip05?: string;
}>): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};
  
  const displayNameResult = validateDisplayName(profile.display_name || '');
  if (!displayNameResult.isValid) {
    errors.display_name = displayNameResult.error!;
  }
  
  const aboutResult = validateAbout(profile.about || '');
  if (!aboutResult.isValid) {
    errors.about = aboutResult.error!;
  }
  
  const websiteResult = validateWebsite(profile.website || '');
  if (!websiteResult.isValid) {
    errors.website = websiteResult.error!;
  }
  
  const birthdayResult = validateBirthday(profile.birthday || '');
  if (!birthdayResult.isValid) {
    errors.birthday = birthdayResult.error!;
  }
  
  const lud16Result = validateLud16(profile.lud16 || '');
  if (!lud16Result.isValid) {
    errors.lud16 = lud16Result.error!;
  }
  
  const lud06Result = validateLud06(profile.lud06 || '');
  if (!lud06Result.isValid) {
    errors.lud06 = lud06Result.error!;
  }
  
  const nip05Result = validateNip05(profile.nip05 || '');
  if (!nip05Result.isValid) {
    errors.nip05 = nip05Result.error!;
  }
  
  return errors;
};
