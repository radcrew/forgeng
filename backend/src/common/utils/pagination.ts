/** Returns the `skip` and `take` values for a Prisma query given 1-based page and page size. */
export function paginationParams(
  page: number,
  pageSize: number,
): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
