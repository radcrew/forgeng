import { UsersController } from '@modules/users/users.controller';
import { UsersService } from '@modules/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    list: jest.Mock;
    getById: jest.Mock;
    notifyWalletMissing: jest.Mock;
    recordPayment: jest.Mock;
    paymentStats: jest.Mock;
    enrollments: jest.Mock;
    updateRole: jest.Mock;
  };

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue({ items: [] }),
      getById: jest.fn().mockResolvedValue({ id: 1 }),
      notifyWalletMissing: jest.fn().mockResolvedValue({ sent: true }),
      recordPayment: jest.fn().mockResolvedValue({ id: 1 }),
      paymentStats: jest.fn().mockResolvedValue({ wallets: [] }),
      enrollments: jest.fn().mockResolvedValue([]),
      updateRole: jest.fn().mockResolvedValue({ id: 1 }),
    };
    controller = new UsersController(service as unknown as UsersService);
  });

  it('delegates list with the query', async () => {
    const query = { role: 'student' } as never;
    await controller.list(query);
    expect(service.list).toHaveBeenCalledWith(query);
  });

  it('delegates getById with the id', async () => {
    await controller.getById(1);
    expect(service.getById).toHaveBeenCalledWith(1);
  });

  it('delegates notifyWalletMissing with the id', async () => {
    await controller.notifyWalletMissing(1);
    expect(service.notifyWalletMissing).toHaveBeenCalledWith(1);
  });

  it('delegates recordPayment with the id and dto', async () => {
    const dto = { amount: '250', currency: 'USDC' } as never;
    await controller.recordPayment(1, dto);
    expect(service.recordPayment).toHaveBeenCalledWith(1, dto);
  });

  it('delegates paymentStats with the id', async () => {
    await controller.paymentStats(1);
    expect(service.paymentStats).toHaveBeenCalledWith(1);
  });

  it('delegates enrollments with the id', async () => {
    await controller.enrollments(1);
    expect(service.enrollments).toHaveBeenCalledWith(1);
  });

  it('delegates updateRole with the id and dto', async () => {
    const dto = { role: 'admin' } as never;
    await controller.updateRole(1, dto);
    expect(service.updateRole).toHaveBeenCalledWith(1, dto);
  });
});
