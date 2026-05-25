# V4.0 Operating Style Sharing Release Gate

Status: required before promoting `FEATURE_FOUNDERS_V40_OPERATING_STYLE_SHARING`.

## Product Gate

- Public style cards are pride/social artifacts, not import authority.
- Comparison is inspiration-only and cannot grant resources, assets, capabilities, or permissions.
- Share copy avoids provider/runtime/debug jargon.

## QA Gate

- Public lookup works without entering a private town.
- Redaction tests reject secrets, tokens, wallet internals, Brain config, logs, and private event data.
- 390px and 1280px card screenshots are readable.

## Security Gate

- Public card endpoint is safe without authentication.
- Compare endpoint cannot mutate private town state.

## Migration And Rollback

- Feature flag default is off.
- Rollback disables public card generation/lookup and leaves existing private town state untouched.
