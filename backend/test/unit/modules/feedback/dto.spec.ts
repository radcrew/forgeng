import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { CreateFeedbackDto } from '@modules/feedback/dto/create-feedback.dto';

function failingProps(obj: Record<string, unknown>): string[] {
  const instance = plainToInstance(CreateFeedbackDto, obj);
  return validateSync(instance).map((e) => e.property);
}

describe('CreateFeedbackDto', () => {
  const valid = { content: 'Nice work', verdict: 'approved' };

  it('accepts valid feedback', () => {
    expect(failingProps(valid)).toEqual([]);
  });

  it('rejects feedback that is only spaces', () => {
    expect(failingProps({ ...valid, content: '  \n ' })).toContain('content');
  });

  it('trims spaces around the feedback', () => {
    const instance = plainToInstance(CreateFeedbackDto, {
      ...valid,
      content: '  Nice work  ',
    });
    expect(instance.content).toBe('Nice work');
  });

  it('rejects feedback over 4,000 characters', () => {
    expect(failingProps({ ...valid, content: 'a'.repeat(4001) })).toContain(
      'content',
    );
  });
});
