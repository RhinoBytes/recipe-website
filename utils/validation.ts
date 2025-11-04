/**
 * Email validation utility
 * Uses a simple but safe validation approach that avoids ReDoS vulnerabilities
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Safe email validation without regex to avoid ReDoS
  if (!email || typeof email !== 'string') return false;
  
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  
  // Must have exactly one @ symbol
  if (atIndex === -1 || atIndex !== trimmed.lastIndexOf('@')) {
    return false;
  }
  
  // Check basic structure: something@something.something
  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);
  
  if (localPart.length === 0 || domainPart.length < 3) {
    return false;
  }
  
  const dotIndex = domainPart.indexOf('.');
  if (dotIndex === -1 || dotIndex === 0 || dotIndex === domainPart.length - 1) {
    return false;
  }
  
  // No spaces allowed
  if (trimmed.includes(' ')) {
    return false;
  }
  
  return true;
}

/**
 * Password validation utility with enhanced security requirements
 * @param password - Password to validate
 * @param minLength - Minimum password length (default: 8)
 * @returns true if password is valid, false otherwise
 */
export function isValidPassword(password: string, minLength = 8): boolean {
  if (!password || typeof password !== 'string') return false;
  
  // Check minimum length
  if (password.length < minLength) return false;
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) return false;
  
  return true;
}

/**
 * Get detailed password validation errors
 * @param password - Password to validate
 * @returns Array of error messages
 */
export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  
  if (!password) {
    errors.push("Password is required");
    return errors;
  }
  
  if (password.length < 8) {
    errors.push("At least 8 characters");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("One uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("One lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("One number");
  }
  
  return errors;
}

/**
 * Username validation utility
 * @param username - Username to validate
 * @returns true if username is valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  
  const trimmed = username.trim();
  
  // Length between 3 and 30 characters
  if (trimmed.length < 3 || trimmed.length > 30) return false;
  
  // Only alphanumeric characters, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return false;
  
  // Must start with a letter or number (not underscore or hyphen)
  if (!/^[a-zA-Z0-9]/.test(trimmed)) return false;
  
  // Must end with a letter or number (not underscore or hyphen)
  if (!/[a-zA-Z0-9]$/.test(trimmed)) return false;
  
  return true;
}

/**
 * Validate email, password, and optionally username
 * @param email - Email address to validate
 * @param password - Password to validate
 * @param username - Username to validate (optional, for registration)
 * @param isRegistration - Whether this is a registration form
 * @returns Object with validation errors
 */
export function validateAuthForm(
  email: string,
  password: string,
  username?: string,
  isRegistration?: boolean
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Email validation
  if (!email) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  // Password validation
  if (!password) {
    errors.password = "Password is required.";
  } else if (isRegistration && !isValidPassword(password)) {
    const passwordErrors = getPasswordErrors(password);
    errors.password = `Password must include: ${passwordErrors.join(", ")}.`;
  } else if (!isRegistration && password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  // Username validation (only for registration)
  if (isRegistration && username !== undefined) {
    if (!username) {
      errors.username = "Username is required.";
    } else if (!isValidUsername(username)) {
      if (username.length < 3) {
        errors.username = "Username must be at least 3 characters.";
      } else if (username.length > 30) {
        errors.username = "Username must be 30 characters or less.";
      } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.username = "Username can only contain letters, numbers, underscores, and hyphens.";
      } else if (!/^[a-zA-Z0-9]/.test(username) || !/[a-zA-Z0-9]$/.test(username)) {
        errors.username = "Username must start and end with a letter or number.";
      } else {
        errors.username = "Username is invalid.";
      }
    }
  }

  return errors;
}

/**
 * Sanitize user input by removing potentially harmful characters
 * @param input - User input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

/**
 * Utility to combine CSS class names
 * @param classes - Array of class names
 * @returns Combined class string
 */
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
