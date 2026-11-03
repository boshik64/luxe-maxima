declare module "httpntlm" {
  type NtlmOptions = {
    url: string;
    username: string;
    password: string;
    domain?: string;
    workstation?: string;
    body?: string;
    headers?: Record<string, string>;
    rejectUnauthorized?: boolean;
    timeout?: number;
  };

  type NtlmResponse = {
    statusCode?: number;
    body?: string | Buffer;
  };

  function post(
    options: NtlmOptions,
    callback: (error: Error | null, response: NtlmResponse) => void,
  ): void;

  const httpntlm: { post: typeof post };
  export default httpntlm;
}
