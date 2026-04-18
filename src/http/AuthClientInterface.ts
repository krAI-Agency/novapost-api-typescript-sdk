export interface AuthClientInterface {
  /**
   * @throws {AuthenticationException}
   * @throws {ApiException}
   */
  getToken(): Promise<string>;
}
