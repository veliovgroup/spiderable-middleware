# Roadmap

Planned work for `spiderable-middleware` (NPM) and `ostrio:spiderable-middleware` (Atmosphere). Delete an item once it ships, its record lives in the git history and release notes.

Constraints for every item: CommonJS, no runtime dependencies, no syntax or APIs newer than what Meteor@2 (Node.js 14) runs. No `fetch`, `AbortSignal.timeout`, `?.`, or `??` in `lib/`.

## Next release

Ideas from the sibling [`seo-middleware-nextjs`](https://github.com/veliovgroup/seo-middleware-nextjs) package and bugs found while comparing the two.

1. Support `http://` service URLs. `RE.proto` accepts `http://`, but `https.request` throws for it, and every bot request silently falls back to the app. Pick `http` or `https` from the URL protocol. This also allows offline tests against a local stub.
5. Warn at startup when `auth` is empty, instead of only warning after the service answers 401 or 403. Accept the `OSTR_AUTH` env variable next to `SPIDERABLE_SERVICE_AUTH` and `PRERENDER_SERVICE_AUTH`. Do not throw, that would be a breaking change.
6. Retry connection errors while no headers were sent. Add a `retries` option, default `1`. Never retry after the response started.
8. Add a `logger` option, an object with `info` and `warn` methods, defaulting to `console`.

## Not planned

- `fetch` and `AbortSignal.timeout`, they need Node.js 18.
- Aho-Corasick UA matching, it adds a runtime dependency.
- Deriving `rootURL` from the request, it trusts the spoofable `Host` header.
- Forwarding `accept-language` to the renderer, the service does not read it today.
- Renaming the `___bot` query parameter to `bot`, the service accepts both and falls back to the request `User-Agent`.

## Keep

The Next.js package lacks these. Keep them when porting ideas from it:

- HEAD requests go upstream as HEAD.
- The bot `User-Agent` keeps its original case.
- `only` and `onlyRE` allow-lists.
- `requestOptions` passthrough and the keep-alive agent.
- Configurable `timeout`, default 180 seconds.
