import type { AuthUser } from '@core/auth/auth.types';
import { FeedbackController } from '@modules/feedback/feedback.controller';
import { FeedbackService } from '@modules/feedback/feedback.service';

const user = { id: 2, role: 'student' } as AuthUser;
const reviewer = { id: 1, role: 'admin' } as AuthUser;

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let service: { list: jest.Mock; create: jest.Mock };

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 7 }),
    };
    controller = new FeedbackController(service as unknown as FeedbackService);
  });

  it('delegates listing feedback for a submission', async () => {
    await controller.list(10, user);
    expect(service.list).toHaveBeenCalledWith(10, user);
  });

  it('delegates creating feedback with the reviewer and dto', async () => {
    const dto = { content: 'Nice', verdict: 'approved' } as never;
    await controller.create(10, reviewer, dto);
    expect(service.create).toHaveBeenCalledWith(10, reviewer, dto);
  });
});
