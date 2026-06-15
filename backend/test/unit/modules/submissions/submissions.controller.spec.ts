import type { AuthUser } from '@core/auth/auth.types';
import { SubmissionsController } from '@modules/submissions/submissions.controller';
import { SubmissionsService } from '@modules/submissions/submissions.service';

const user = { id: 2, role: 'student' } as AuthUser;

describe('SubmissionsController', () => {
  let controller: SubmissionsController;
  let service: {
    list: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    resubmit: jest.Mock;
  };

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      resubmit: jest.fn().mockResolvedValue({ id: 1 }),
    };
    controller = new SubmissionsController(
      service as unknown as SubmissionsService,
    );
  });

  it('delegates list with the user and query', async () => {
    const query = { status: 'submitted' } as never;
    await controller.list(user, query);
    expect(service.list).toHaveBeenCalledWith(user, query);
  });

  it('delegates create with the dto and user', async () => {
    const dto = { taskId: 5 } as never;
    await controller.create(dto, user);
    expect(service.create).toHaveBeenCalledWith(dto, user);
  });

  it('delegates findOne with the id and user', async () => {
    await controller.findOne(10, user);
    expect(service.findOne).toHaveBeenCalledWith(10, user);
  });

  it('delegates resubmit with the id, dto, and user', async () => {
    const dto = { content: 'redone' } as never;
    await controller.resubmit(10, dto, user);
    expect(service.resubmit).toHaveBeenCalledWith(10, dto, user);
  });
});
