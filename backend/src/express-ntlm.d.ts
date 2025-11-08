declare module 'express-ntlm' {
  type RequestHandler = (req: any, res: any, next?: any) => any;

  interface NtlmOptions {
    debug?: (prefix: string, message: string) => void;
    domain: string;
    domaincontroller: string;
    tlsOptions?: any;
    badrequest?: RequestHandler;
    forbidden?: RequestHandler;
    internalservererror?: RequestHandler;
  }

  interface NtlmUser {
    UserName: string;
    DomainName: string;
    Workstation: string;
  }

  function ntlm(options: NtlmOptions): RequestHandler;
  
  export = ntlm;
}

