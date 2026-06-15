import type { AuthUser } from '@core/auth/auth.types';
import { ApplicationsController } from '@modules/applications/applications.controller';
import { ApplicationsService } from '@modules/applications/applications.service';
import { VideoService } from '@modules/applications/video.service';

const user = { id: 9, role: 'applicant' } as AuthUser;

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let service: {
    stats: jest.Mock;
    list: jest.Mock;
    findMine: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    updateStatus: jest.Mock;
  };
  let video: { upload: jest.Mock };

  beforeEach(() => {
    service = {
      stats: jest.fn().mockResolvedValue({ total: 0 }),
      list: jest.fn().mockResolvedValue({ items: [] }),
      findMine: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      updateStatus: jest.fn().mockResolvedValue({ id: 1 }),
    };
    video = { upload: jest.fn().mockResolvedValue({ url: '/v.webm' }) };
    controller = new ApplicationsController(
      service as unknown as ApplicationsService,
      video as unknown as VideoService,
    );
  });

  it('delegates stats', async () => {
    await controller.stats();
    expect(service.stats).toHaveBeenCalledTimes(1);
  });

  it('delegates list with the query', async () => {
    const query = { status: 'pending' } as never;
    await controller.list(query);
    expect(service.list).toHaveBeenCalledWith(query);
  });

  it('delegates findMine with the user id only', async () => {
    await controller.findMine(user);
    expect(service.findMine).toHaveBeenCalledWith(9);
  });

  it('delegates create with the user and dto', async () => {
    const dto = { motivation: 'x' } as never;
    await controller.create(user, dto);
    expect(service.create).toHaveBeenCalledWith(user, dto);
  });

  it('delegates the video upload to the video service', async () => {
    const file = { buffer: Buffer.from('v') } as never;
    await controller.uploadVideoIntro(user, file);
    expect(video.upload).toHaveBeenCalledWith(user, file);
  });

  it('delegates findOne with the id', async () => {
    await controller.findOne(5);
    expect(service.findOne).toHaveBeenCalledWith(5);
  });

  it('delegates updateStatus with the id and dto', async () => {
    const dto = { status: 'accepted' } as never;
    await controller.updateStatus(5, dto);
    expect(service.updateStatus).toHaveBeenCalledWith(5, dto);
  });
});
