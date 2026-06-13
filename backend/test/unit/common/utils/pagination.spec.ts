import { paginationParams } from '@common/utils/pagination';

describe('paginationParams', () => {
  it('returns skip 0 for the first page', () => {
    expect(paginationParams(1, 20)).toEqual({ skip: 0, take: 20 });
  });

  it('skips a full page worth of rows for the second page', () => {
    expect(paginationParams(2, 20)).toEqual({ skip: 20, take: 20 });
  });

  it('scales skip with the page number', () => {
    expect(paginationParams(5, 10)).toEqual({ skip: 40, take: 10 });
  });

  it('uses the page size as take', () => {
    expect(paginationParams(3, 50)).toEqual({ skip: 100, take: 50 });
  });
});
