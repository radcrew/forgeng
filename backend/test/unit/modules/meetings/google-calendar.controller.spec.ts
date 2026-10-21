import { Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  GoogleCalendarAuthService,
  GoogleCalendarConnectError,
} from '@modules/meetings/google-calendar-auth.service';
import { GoogleCalendarController } from '@modules/meetings/google-calendar.controller';

describe('GoogleCalendarController', () => {
  let service: { finishConnect: jest.Mock };
  let res: { clearCookie: jest.Mock; redirect: jest.Mock };
  let controller: GoogleCalendarController;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    service = { finishConnect: jest.fn().mockResolvedValue(undefined) };
    res = { clearCookie: jest.fn(), redirect: jest.fn() };
    controller = new GoogleCalendarController(
      service as unknown as GoogleCalendarAuthService,
      {
        get: (key: string) =>
          key === 'frontendUrl' ? 'https://app.example' : 'test',
      } as never,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const callback = () =>
    controller.callback(
      'code',
      'state',
      undefined,
      { cookies: {} } as unknown as Request,
      res as unknown as Response,
    );

  it('sends the admin back with the result', async () => {
    await callback();

    expect(res.redirect).toHaveBeenCalledWith(
      'https://app.example/admin/meetings?googleCalendar=connected',
    );
  });

  it('sends the admin back with the reason a connection was refused', async () => {
    service.finishConnect.mockRejectedValue(
      new GoogleCalendarConnectError('scope'),
    );

    await callback();

    expect(res.redirect).toHaveBeenCalledWith(
      'https://app.example/admin/meetings?googleCalendar=scope',
    );
  });

  it('sends the admin back instead of showing an error page on other errors', async () => {
    service.finishConnect.mockRejectedValue(new Error('db down'));

    await callback();

    expect(res.redirect).toHaveBeenCalledWith(
      'https://app.example/admin/meetings?googleCalendar=token',
    );
  });
});
