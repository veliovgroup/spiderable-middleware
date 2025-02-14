declare module 'spiderable-middleware' {

  import type { IncomingMessage, ServerResponse, RequestOptions } from 'http';
  import type { URL } from 'url';

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
     * Additional request options (merged into the HTTP request payload).
     */
    requestOptions?: RequestOptions;
    /**
     * When true, debug logging is enabled.
     */
    debug?: boolean;
    /**
     * A regular expression to match static file extensions.
     * (Not documented in the JS doc but used internally.)
     */
    staticExt?: RegExp;
  }

  export type NextFunction = (err?: unknown) => void;

  /**
   * Spiderable middleware class for rendering pages for bots/crawlers.
   *
   * @example
   * import Spiderable from 'spiderable-middleware';
   * const spiderable = new Spiderable({
   *   rootURL: 'http://example.com',
   *   auth: 'test:test'
   * });
   *
   * WebApp.connectHandlers.use(spiderable.handler);
   */
  export default class Spiderable {
    constructor(options?: SpiderableOptions);
    /**
     * Package name (set from package details).
     */
    NAME: string;
    /**
     * The user agent used when sending requests to the rendering service.
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
     * An array of "only" rules (strings or RegExp) or false if not defined.
     */
    only: (string | RegExp)[] | false;
    /**
     * A RegExp built from the "only" rules or false if not defined.
     */
    onlyRE: RegExp | false;
    /**
     * An array of bot user-agent patterns.
     */
    botsUA: string[];
    /**
     * The root URL of the application.
     */
    rootURL: string;
    /**
     * Request timeout (in milliseconds).
     */
    timeout: number;
    /**
     * A RegExp to match static file extensions.
     */
    staticExt: RegExp;
    /**
     * The rendering service URL.
     */
    serviceURL: string;
    /**
     * When true, URLs are sanitized (removing duplicate slashes).
     */
    sanitizeUrls: boolean;
    /**
     * An array of header names to ignore.
     */
    ignoredHeaders: string[];
    /**
     * Additional options to be merged into the HTTP request payload.
     */
    requestOptions: RequestOptions;
    /**
     * A RegExp built from the `ignoredHeaders` array.
     */
    headersRE: RegExp;
    /**
     * A RegExp built from the `botsUA` array.
     */
    botsRE: RegExp;
    /**
     * A RegExp built from the `ignore` option or false if not defined.
     */
    ignoreRE: RegExp | false;

    /**
     * Constructs the complete service URL used to request a rendered page.
     *
     * @param urlObj - A URL object representing the original request.
     * @param bua - Optional bot user-agent string (from the request headers).
     * @returns A complete URL string to the rendering service.
     */
    getServiceURL(urlObj: URL, bua?: string): string;

    /**
     * Processes the incoming request URL.
     *
     * @param req - The original HTTP request.
     * @returns A URL object if the request qualifies for rendering, or false otherwise.
     */
    getRequestURL(req: IncomingMessage): URL | false;

    /**
     * Express/connect–style middleware function.
     *
     * Processes the request and proxies a rendered response if applicable.
     *
     * @param req - The incoming HTTP request.
     * @param res - The HTTP response.
     * @param next - A function to call the next middleware.
     * @returns true if the middleware handled the request, false otherwise.
     */
    middleware(
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction
    ): boolean;

    /**
     * Alias for `middleware`. Can be used when mounting the middleware.
     */
    handler: (req: IncomingMessage, res: ServerResponse, next: NextFunction) => boolean;

    /**
     * Alias for `middleware`.
     */
    handle: (req: IncomingMessage, res: ServerResponse, next: NextFunction) => void;
  }
}

declare module 'meteor/ostrio:spiderable-middleware' {
  export * from 'spiderable-middleware';

  import Spiderable from 'spiderable-middleware';
  export default Spiderable;
}
