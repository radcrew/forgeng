import { splitName } from './index';

describe('splitName', () => {
  it('splits a two-part name into first and last', () => {
    expect(splitName('Ada Lovelace', 'ada@example.com')).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('keeps the remaining words as the last name', () => {
    expect(splitName('Jean Luc Picard', 'jl@example.com')).toEqual({
      firstName: 'Jean',
      lastName: 'Luc Picard',
    });
  });

  it('treats a single word as the first name with an empty last name', () => {
    expect(splitName('Cher', 'cher@example.com')).toEqual({
      firstName: 'Cher',
      lastName: '',
    });
  });

  it('collapses extra whitespace between names', () => {
    expect(splitName('  Grace   Hopper  ', 'gh@example.com')).toEqual({
      firstName: 'Grace',
      lastName: 'Hopper',
    });
  });

  it('falls back to the email handle when the name is null', () => {
    expect(splitName(null, 'alan.turing@example.com')).toEqual({
      firstName: 'alan.turing',
      lastName: '',
    });
  });

  it('falls back to the email handle when the name is blank', () => {
    expect(splitName('   ', 'katherine@example.com')).toEqual({
      firstName: 'katherine',
      lastName: '',
    });
  });

  it('uses the full email when it has no @ handle', () => {
    expect(splitName(null, 'noatsign')).toEqual({
      firstName: 'noatsign',
      lastName: '',
    });
  });
});
