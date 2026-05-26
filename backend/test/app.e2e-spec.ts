import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  it('GET /api/healthz returns 200', () => {
    return request(app.getHttpServer())
      .get('/api/healthz')
      .expect(200)
      .expect((res) => {
        const body = res.body as { status?: string; database?: string };
        expect(body.status).toBeDefined();
        expect(body.database).toBeDefined();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
