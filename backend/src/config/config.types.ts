/** Shape returned by `configuration()` — keys match top-level `ConfigService` paths. */
export interface AppConfiguration {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  corsOrigin: string[];
  database: {
    url: string;
  };
}
