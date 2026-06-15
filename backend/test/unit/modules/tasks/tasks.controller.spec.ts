import type { AuthUser } from '@core/auth/auth.types';
import { TasksController } from '@modules/tasks/tasks.controller';
import { TasksService } from '@modules/tasks/tasks.service';

const user = { id: 2, role: 'student' } as AuthUser;

describe('TasksController', () => {
  let controller: TasksController;
  let service: {
    list: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    controller = new TasksController(service as unknown as TasksService);
  });

  it('delegates list with the user and query', async () => {
    const query = { cohortId: 3 } as never;
    await controller.list(user, query);
    expect(service.list).toHaveBeenCalledWith(user, query);
  });

  it('delegates create with the dto', async () => {
    const dto = { title: 'x' } as never;
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates findOne with the id and user', async () => {
    await controller.findOne(5, user);
    expect(service.findOne).toHaveBeenCalledWith(5, user);
  });

  it('delegates update with the id and dto', async () => {
    const dto = { title: 'y' } as never;
    await controller.update(5, dto);
    expect(service.update).toHaveBeenCalledWith(5, dto);
  });

  it('delegates remove with the id', async () => {
    await controller.remove(5);
    expect(service.remove).toHaveBeenCalledWith(5);
  });
});
