/**
 * Internal dependency-injection keys. These mirror the PHP SDK's PSR-11 identifiers
 * closely enough for debugging, while staying ergonomic for TypeScript.
 */
export const CONTAINER_KEYS = {
  Logger: "Psr.Log.LoggerInterface",
  HttpClient: "Psr.Http.Client.ClientInterface",
  RequestFactory: "Psr.Http.Message.RequestFactoryInterface",
  AuthClient: "NovaDigital.NovaPost.Http.AuthClientInterface",
  JwtTokenStorage: "NovaDigital.NovaPost.Storage.JwtTokenStorageInterface",
  TokenProvider: "NovaDigital.NovaPost.TokenProviderInterface",
  ResponseValidator: "NovaDigital.NovaPost.Http.ResponseValidatorInterface",
  RetryHandler: "NovaDigital.NovaPost.Http.RetryHandlerInterface",
  NovaPostClient: "NovaDigital.NovaPost.Http.NovaPostClient",
} as const;

export type ContainerKey = (typeof CONTAINER_KEYS)[keyof typeof CONTAINER_KEYS];
