import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from '@common/filters/prisma-exception.filter';

function makeError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('boom', {
    code,
    clientVersion: 'test',
  });
}

/** A mock ArgumentsHost exposing a json/status-spy Response. */
function makeHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  };
  return { host, status, json };
}

describe('PrismaExceptionFilter', () => {
  const filter = new PrismaExceptionFilter();

  it('maps P2002 (unique violation) to 409 Conflict', () => {
    const { host, status, json } = makeHost();

    filter.catch(makeError('P2002'), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.CONFLICT }),
    );
  });

  it('maps P2025 (record not found) to 404 Not Found', () => {
    const { host, status, json } = makeHost();

    filter.catch(makeError('P2025'), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.NOT_FOUND }),
    );
  });

  it('maps an unknown code to 500 with a generic message', () => {
    const { host, status, json } = makeHost();

    filter.catch(makeError('P2099'), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const [body] = json.mock.calls[0] as [{ message: string }];
    expect(body.message).toMatch(/something went wrong/i);
  });
});
