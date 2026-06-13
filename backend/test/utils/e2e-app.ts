import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Role, User } from '@prisma/client';
import { PrismaExceptionFilter } from '@common/filters/prisma-exception.filter';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@core/auth/auth.types';
import { PrismaService } from '@core/database/prisma.service';
import { AppModule } from '../../src/app.module';

/**
 * A deeply-mocked PrismaService. Every model method is a jest.fn() created on
 * access, so tests only stub the calls they care about.
 */
export type MockPrisma = {
  [model: string]: Record<string, jest.Mock>;
} & { $transaction: jest.Mock };

export function createMockPrisma(): MockPrisma {
  const cache = new Map<string, Record<string, jest.Mock>>();
  const target = {
    // Default $transaction runs the callback against the same mock client.
    $transaction: jest.fn((arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (tx: unknown) => unknown)(proxy)
        : Promise.all(arg as unknown[]),
    ),
  } as MockPrisma;

  const proxy = new Proxy(target, {
    get(obj, prop: string) {
      if (prop in obj) return (obj as Record<string, unknown>)[prop];
      // Client-level methods like `$queryRaw` are functions, not model delegates.
      if (prop.startsWith('$')) {
        (obj as Record<string, jest.Mock>)[prop] = jest.fn();
        return (obj as Record<string, jest.Mock>)[prop];
      }
      if (!cache.has(prop)) {
        // Lazily create a model delegate whose methods are auto-mocked.
        const delegate = new Proxy(
          {},
          {
            get(model: Record<string, jest.Mock>, method: string) {
              if (!model[method]) model[method] = jest.fn();
              return model[method];
            },
          },
        );
        cache.set(prop, delegate);
      }
      return cache.get(prop);
    },
  });

  return proxy;
}

/** A minimal authenticated user for guard/role testing. */
export function makeAuthUser(role: Role, overrides: Partial<User> = {}): User {
  return {
    id: 1,
    clerkId: null,
    email: 'user@example.com',
    emailVerified: true,
    name: 'Test User',
    role,
    bio: null,
    githubUrl: null,
    avatarUrl: null,
    registrationIp: null,
    registrationCountry: null,
    registrationCity: null,
    createdAt: new Date('2026-01-15T10:30:00.000Z'),
    ...overrides,
  } as User;
}

export interface E2EContext {
  app: INestApplication;
  prisma: MockPrisma;
  /** Set the user attached to every request, or null to simulate no auth. */
  setUser: (user: User | null) => void;
}

/**
 * Boots the full AppModule with Prisma mocked and the JWT guard replaced by a
 * stub that injects a configurable user. The real RolesGuard stays active so
 * role enforcement is genuinely exercised. Mirrors the global pipe/filter/prefix
 * wiring from main.ts.
 */
export async function createE2EApp(): Promise<E2EContext> {
  const prisma = createMockPrisma();
  let currentUser: User | null = null;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        if (currentUser) req.user = currentUser;
        return true;
      },
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.init();

  return {
    app,
    prisma,
    setUser: (user) => {
      currentUser = user;
    },
  };
}
