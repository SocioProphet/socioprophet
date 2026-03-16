# Vue Shell Stabilization Checklist

## Acceptance criteria

- source parses cleanly
- install works
- dev server boots
- build works
- typecheck passes or has a bounded explicit error list
- portal shell route exists
- auth gate for `@socioprophet.ai` exists
- logout/session behavior exists
- legacy React app remains intact during migration

## Near-term sequence

1. import donor shell into `/socioprophet-web/app-vue`
2. inspect manifests and runtime assumptions
3. normalize package manager/runtime
4. boot dev shell
5. wire minimal auth
6. add blank post-login shell
