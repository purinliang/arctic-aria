export type QueryExecutor = {
  query(sql: string, parameters?: unknown[]): Promise<unknown[]>;
};
