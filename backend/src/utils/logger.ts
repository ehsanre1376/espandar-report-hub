import { Request, Response } from 'express';

interface LogData {
  [key: string]: unknown;
}

interface RequestLogData extends LogData {
  method: string;
  path: string;
  headers: {
    'user-agent'?: string;
    'authorization'?: string;
    'www-authenticate'?: string;
    'content-type'?: string;
  };
  query: unknown;
  body: string;
}

interface ResponseLogData extends LogData {
  statusCode: number;
  headers: NodeJS.Dict<number | string | string[]>;
  body: unknown;
}

export class Logger {
  private static formatMessage(prefix: string, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${prefix}] ${message}`;
    if (data) {
      logMessage += '\n' + JSON.stringify(data, null, 2);
    }
    return logMessage;
  }

  static auth(message: string, data?: LogData) {
    console.log(this.formatMessage('AUTH', message, data));
  }

  static ntlm(message: string, data?: LogData) {
    console.log(this.formatMessage('NTLM', message, data));
  }

  static error(message: string, error?: Error | { message?: string; stack?: string }) {
    console.error(this.formatMessage('ERROR', message, {
      message: error?.message,
      stack: error?.stack,
      details: error
    }));
  }

  static request(req: Request) {
    const data: RequestLogData = {
      method: req.method,
      path: req.path,
      headers: {
        'user-agent': req.headers['user-agent'],
        'authorization': req.headers['authorization'] ? '[PRESENT]' : '[NONE]',
        'www-authenticate': req.headers['www-authenticate'] ? '[PRESENT]' : '[NONE]',
        'content-type': req.headers['content-type']
      },
      query: req.query,
      body: req.body ? '[PRESENT]' : '[NONE]'
    };
    console.log(this.formatMessage('REQUEST', `${req.method} ${req.path}`, data));
  }

  static response(res: Response, body: unknown) {
    const data: ResponseLogData = {
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      body: body
    };
    console.log(this.formatMessage('RESPONSE', `Status: ${res.statusCode}`, data));
  }
}