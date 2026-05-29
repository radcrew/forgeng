/** Strip trailing slash and append the NestJS global `/api` prefix. */
export const buildApiBase = (origin: string): string =>
  `${origin.replace(/\/$/, "")}/api`;
