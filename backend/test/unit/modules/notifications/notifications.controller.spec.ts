import type { AuthUser } from '@core/auth/auth.types';
import { NotificationsController } from '@modules/notifications/notifications.controller';
import { NotificationsService } from '@modules/notifications/notifications.service';

const user = { id: 2, role: 'student' } as AuthUser;

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: {
    list: jest.Mock;
    unreadCount: jest.Mock;
    getPreferences: jest.Mock;
    updatePreferences: jest.Mock;
    markAllRead: jest.Mock;
    markRead: jest.Mock;
    deleteAll: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      unreadCount: jest.fn().mockResolvedValue({ count: 0 }),
      getPreferences: jest.fn().mockResolvedValue({}),
      updatePreferences: jest.fn().mockResolvedValue({}),
      markAllRead: jest.fn().mockResolvedValue({ count: 0 }),
      markRead: jest.fn().mockResolvedValue({ id: 1 }),
      deleteAll: jest.fn().mockResolvedValue({ count: 0 }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    controller = new NotificationsController(
      service as unknown as NotificationsService,
    );
  });

  it('delegates list with the user and query', async () => {
    const query = { unread: true } as never;
    await controller.list(user, query);
    expect(service.list).toHaveBeenCalledWith(user, query);
  });

  it('delegates unreadCount with the user', async () => {
    await controller.unreadCount(user);
    expect(service.unreadCount).toHaveBeenCalledWith(user);
  });

  it('delegates getPreferences with the user', async () => {
    await controller.getPreferences(user);
    expect(service.getPreferences).toHaveBeenCalledWith(user);
  });

  it('delegates updatePreferences with the user and dto', async () => {
    const dto = { feedbackEmail: false } as never;
    await controller.updatePreferences(user, dto);
    expect(service.updatePreferences).toHaveBeenCalledWith(user, dto);
  });

  it('delegates markAllRead with the user', async () => {
    await controller.markAllRead(user);
    expect(service.markAllRead).toHaveBeenCalledWith(user);
  });

  it('delegates markRead with the id and user', async () => {
    await controller.markRead(7, user);
    expect(service.markRead).toHaveBeenCalledWith(7, user);
  });

  it('delegates deleteAll with the user', async () => {
    await controller.deleteAll(user);
    expect(service.deleteAll).toHaveBeenCalledWith(user);
  });

  it('delegates delete with the id and user', async () => {
    await controller.delete(7, user);
    expect(service.delete).toHaveBeenCalledWith(7, user);
  });
});
