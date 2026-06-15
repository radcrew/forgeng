import type { AuthUser } from '@core/auth/auth.types';
import { DashboardController } from '@modules/dashboard/dashboard.controller';
import { DashboardService } from '@modules/dashboard/dashboard.service';

const user = { id: 2, role: 'student' } as AuthUser;

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: { student: jest.Mock; admin: jest.Mock };

  beforeEach(() => {
    service = {
      student: jest.fn().mockResolvedValue({ cohort: null }),
      admin: jest.fn().mockResolvedValue({ totalStudents: 0 }),
    };
    controller = new DashboardController(
      service as unknown as DashboardService,
    );
  });

  it('delegates the student dashboard with the user and cohortId', async () => {
    await controller.student(user, 3);
    expect(service.student).toHaveBeenCalledWith(user, 3);
  });

  it('passes an undefined cohortId straight through', async () => {
    await controller.student(user);
    expect(service.student).toHaveBeenCalledWith(user, undefined);
  });

  it('delegates the admin dashboard', async () => {
    await controller.admin();
    expect(service.admin).toHaveBeenCalledTimes(1);
  });
});
