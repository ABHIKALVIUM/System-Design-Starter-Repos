1. Unsafe Method: GET mutated state — Caching proxies trigger unintended completions — Fixed by: Changed to PATCH — Alternative rejected: POST creates resources.
2. Schema Leakage: Leaked database internals — Exposes priority logic and tightly couples clients — Fixed by: Removed internal fields — Alternative rejected: Nesting fields.
3. Missing Versioning: Breaking changes lacked deprecation — Legacy clients break silently in production — Fixed by: Added X-API-Version and Deprecation headers — Alternative rejected: Path versioning.
