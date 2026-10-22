import { CohortsController } from '@modules/cohorts/cohorts.controller';
import { CohortsService } from '@modules/cohorts/cohorts.service';

describe('CohortsController', () => {
  let controller: CohortsController;
  let service: {
    list: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    enrollments: jest.Mock;
    enroll: jest.Mock;
    unenroll: jest.Mock;
  };

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      remove: jest.fn().mockResolvedValue(undefined),
      enrollments: jest.fn().mockResolvedValue([]),
      enroll: jest.fn().mockResolvedValue({ id: 1 }),
      unenroll: jest.fn().mockResolvedValue(undefined),
    };
    controller = new CohortsController(service as unknown as CohortsService);
  });

  it('delegates list', async () => {
    await controller.list();
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('delegates create with the dto and the admin', async () => {
    const dto = { name: 'Spring', capacity: 30 } as never;
    const admin = { id: 9, role: 'admin' } as never;
    await controller.create(dto, admin);
    expect(service.create).toHaveBeenCalledWith(dto, admin);
  });

  it('delegates findOne with the id', async () => {
    await controller.findOne(3);
    expect(service.findOne).toHaveBeenCalledWith(3);
  });

  it('delegates update with the id and dto', async () => {
    const dto = { name: 'Renamed' } as never;
    await controller.update(3, dto);
    expect(service.update).toHaveBeenCalledWith(3, dto);
  });

  it('delegates remove with the id', async () => {
    await controller.remove(3);
    expect(service.remove).toHaveBeenCalledWith(3);
  });

  it('delegates enrollments with the id', async () => {
    await controller.enrollments(3);
    expect(service.enrollments).toHaveBeenCalledWith(3);
  });

  it('delegates enroll with the id and dto', async () => {
    const dto = { userId: 1 } as never;
    await controller.enroll(3, dto);
    expect(service.enroll).toHaveBeenCalledWith(3, dto);
  });

  it('delegates unenroll with the cohort and user ids', async () => {
    await controller.unenroll(3, 1);
    expect(service.unenroll).toHaveBeenCalledWith(3, 1);
  });
});
