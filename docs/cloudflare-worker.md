# CloudFlare Worker Integration

Step-by-step integration instructions for ostr.io pre-rendering via CloudFlare Workers

1. Sign up for ostr.io
2. Add server/domain following on-boarding guidance
3. Verify domain ownership using `DNS TXT` record adding via CloudFlare interface
4. Inside server's panel click on <kbd>add</kbd> next to "Pre-rendering & SSR for SEO"
5. Inside server's pre-rendering panel scroll down to <kbd>integration guide</kbd>
6. In the first <kbd>CURL</kbd> tab grab "Authorization Header" starting from `Basic...` and ending with closing double-quotes
7. __Create CF Worker:__
    - Workers > Create: Create Worker via CloudFlare Dashboard
    - Workers > Settings > Variables: Place copied header as `OSTR_AUTH` to WebWorker's environment variables OR replace `env.OSTR_AUTH` with Authentication Header value from step 6
    - Workers > Settings > <kbd>Edit Code</kbd>: [Paste CF Worker Code](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/cloudflare.worker.js)
9. __Connect Worker to a website__
    - Websites > example.com > Workers Routes > [Add Route]
    - Route: `*.example.com/*`
    - Worker: Select newly created worker
    - Click on <kbd>save</kbd>
10. __Purge cache:__ Websites > example.com > Caching > Configuration > <kbd>Purge Everything</kbd>
11. __Check `X-Prerender-Id` header to confirm that pre-rendering works__
    - Request using cURL: `curl -v -A GoogleBot https://example.com/`
    - Ensure `X-Prerender-Id` header returned with response
    - Check ostr.io: Rendering statistics will appear in real-time
12. Further reading:
    - [Speed-up rendering](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#speed-up-rendering)
    - [Detect requests from pre-rendering](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#detect-request-from-pre-rendering-engine-during-runtime)
