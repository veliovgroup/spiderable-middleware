# Roadmap

Planned work for `spiderable-middleware` (NPM) and `ostrio:spiderable-middleware` (Atmosphere). Delete an item once it ships, its record lives in the git history and release notes.

Constraints for every item: CommonJS, no runtime dependencies, no syntax or APIs newer than what Meteor@2 (Node.js 14) runs. No `fetch`, `AbortSignal.timeout`, `?.`, or `??` in `lib/`.

## Next release

Ideas from the sibling [`seo-middleware-nextjs`](https://github.com/veliovgroup/seo-middleware-nextjs) package and bugs found while comparing the two.

6. Retry connection errors while no headers were sent. Add a `retries` option, default `1`. Never retry after the response started.

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
