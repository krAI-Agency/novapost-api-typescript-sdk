export interface TokenProviderInterface {
  get(): Promise<string>;

  refresh(): Promise<string>;
}
