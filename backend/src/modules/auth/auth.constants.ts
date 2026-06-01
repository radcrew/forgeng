/**
 * Password policy shared by registration and password reset.
 * 72 is bcrypt's effective byte limit; tweak the rest as policy evolves.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

/** At least one letter and one digit. */
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const PASSWORD_MESSAGE = 'Password must contain a letter and a digit.';
