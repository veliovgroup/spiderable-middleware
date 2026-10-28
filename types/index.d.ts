/// <reference path="./meteor.d.ts" />

/**
 * Instances are callable middleware functions,
 * pass the instance directly to `app.use()`.
 */
interface Spiderable {
  (
    req: Spiderable.IncomingMessageLike,
    res: Spiderable.ServerResponseLike,
    next: Spiderable.NextFunction
  ): void;
}

declare class Spiderable extends Function {
  constructor(options?: Spiderable.SpiderableOptions);

  /**
   * Package name.
   */
  NAME: string;
  /**
   * User agent sent to the rendering service.
   */
  userAgent: string;
  /**
   * Authentication credentials.
   */
  auth: string;
  /**
   * When true, enables debug logging.
   */
  debug: boolean;
  /**
   * Array of "only" rules, or false if not defined.
   */
  only: (string | RegExp)[] | false;
  /**
   * RegExp built from "only" rules, or false if not defined.
   */
  onlyRE: RegExp | false;
  /**
   * Bot user-agent patterns.
   */
  botsUA: string[];
  /**
   * Application root URL.
   */
  rootURL: string;
  /**
   * Request timeout in milliseconds.
   */
  timeout: number;
  /**
   * Static file extension matcher.
   */
  staticExt: RegExp;
  /**
   * Rendering service URL.
   */
  serviceURL: string;
  /**
   * When true, duplicate slashes in URLs are sanitized.
   */
  sanitizeUrls: boolean;
  /**
   * Header names ignored while proxying responses.
   */
  ignoredHeaders: string[];
  /**
   * Extra HTTPS request options.
   */
  requestOptions: Spiderable.RequestOptions;
  /**
   * Logger receiving warnings and debug messages.
   */
  logger: Spiderable.Logger;
  /**
   * Extra attempts after a connection error, before the rendering service answered.
   */
  retries: number;
  /**
   * RegExp built from `ignoredHeaders`.
   */
  headersRE: RegExp;
  /**
   * RegExp built from `botsUA`.
   */
  botsRE: RegExp;
  /**
   * RegExp built from `ignore`, or false if not defined.
   */
  ignoreRE: RegExp | false;

  /**
   * Builds rendering-service request URL.
   */
  getServiceURL(urlObj: globalThis.URL, bua?: string): string;

  /**
   * Parses request URL and returns URL object when request qualifies for rendering.
   */
  getRequestURL(req: Spiderable.IncomingMessageLike): globalThis.URL | false;

  /**
   * Express/connect-style middleware.
   */
  middleware(
    req: Spiderable.IncomingMessageLike,
    res: Spiderable.ServerResponseLike,
    next: Spiderable.NextFunction
  ): boolean;

  /**
   * Alias for `middleware`.
   */
  handler: (
    req: Spiderable.IncomingMessageLike,
    res: Spiderable.ServerResponseLike,
    next: Spiderable.NextFunction
  ) => boolean;

  /**
   * Alias for `middleware`.
   */
  handle: (
    req: Spiderable.IncomingMessageLike,
    res: Spiderable.ServerResponseLike,
    next: Spiderable.NextFunction
  ) => void;
}

declare namespace Spiderable {
  export interface IncomingMessageLike {
    method?: string;
    url?: string;
    headers: Record<string, string | string[] | undefined>;
    on(event: 'error', listener: (error: Error) => void): unknown;
  }

  export interface ServerResponseLike {
    headersSent: boolean;
    writableEnded: boolean;
    setHeader(name: string, value: number | string | readonly string[]): void;
    writeHead(statusCode?: number): unknown;
    write(chunk: string | Uint8Array): unknown;
    end(chunk?: string | Uint8Array): unknown;
    on(event: 'error', listener: (error: Error) => void): unknown;
    on(event: 'close' | 'finish', listener: () => void): unknown;
    destroy(error?: Error): unknown;
    setTimeout(msecs: number, callback?: () => void): unknown;
  }

  export interface Logger {
    info(...args: unknown[]): unknown;
    warn(...args: unknown[]): unknown;
  }

  export interface RequestOptions {
    headers?: Record<string, number | string | readonly string[] | undefined>;
    [key: string]: unknown;
  }

  /**
   * Configuration options for Spiderable.
   */
  export interface SpiderableOptions {
    /**
     * The URL of the rendering service.
     * Defaults to the environment variable `SPIDERABLE_SERVICE_URL` or `PRERENDER_SERVICE_URL` if not provided.
     */
    serviceURL?: string;
    /**
     * The root URL of your application.
     * Defaults to the environment variable `ROOT_URL` if not provided.
     */
    rootURL?: string;
    /**
     * Authentication credentials in the form "username:password".
     * Defaults to the environment variable `SPIDERABLE_SERVICE_AUTH`, `PRERENDER_SERVICE_AUTH`, or `OSTR_AUTH`.
     */
    auth?: string;
    /**
     * When true, duplicate slashes in URLs will be sanitized.
     */
    sanitizeUrls?: boolean;
    /**
     * An array of bot user-agent patterns.
     */
    botsUA?: string[];
    /**
     * An array of header names to ignore when proxying responses.
     */
    ignoredHeaders?: string[];
    /**
     * An array of URL paths to ignore.
     */
    ignore?: string[];
    /**
     * An array of rules (strings or RegExp) for URLs that should be rendered exclusively.
     */
    only?: (string | RegExp)[];
    /**
     * A RegExp to match URLs that should be rendered exclusively.
     */
    onlyRE?: RegExp;
    /**
     * Request timeout in milliseconds.
     */
    timeout?: number;
    /**
     * Additional HTTPS request options merged into the rendering-service request.
     */
    requestOptions?: RequestOptions;
    /**
     * When true, debug logging is enabled.
     */
    debug?: boolean;
    /**
     * Extra attempts when the connection to the rendering service fails
     * before it answered. Never retries after the response started.
     * Defaults to `1`.
     */
    retries?: number;
    /**
     * Object with `info` and `warn` methods receiving log messages.
     * Defaults to `console`.
     */
    logger?: Logger;
    /**
     * A regular expression to match static file extensions.
     */
    staticExt?: RegExp;
  }

  export type NextFunction = (err?: unknown) => void;
}

export = Spiderable;
