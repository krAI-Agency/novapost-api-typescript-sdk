export interface JwtTokenStorageInterface {
  save(token: string): Promise<void> | void;
  get(): Promise<string | null> | string | null;
  delete(): Promise<void> | void;
}
