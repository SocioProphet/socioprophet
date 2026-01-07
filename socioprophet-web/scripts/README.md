# Scripts

Helper shell scripts invoked by the **root Makefile**. These scripts are intentionally small, and each assumes it is run from inside `socioprophet-web/scripts`.

## Files

| Script | Description |
| --- | --- |
| `install_web.sh` | Installs dependencies in `client/` and `server/` sequentially using Yarn. |
| `run_web.sh` | Runs the server in the background and the client in the foreground. |

## install_web.sh

```bash
cd .. && cd client && yarn
cd .. && cd server && yarn
```

**Behavior:**
- Installs `client/` dependencies first.
- Installs `server/` dependencies second.
- Does not accept arguments or flags.

## run_web.sh

```bash
cd .. && cd server && (yarn run dev&)
cd .. && cd client && yarn run start
```

**Behavior:**
- Starts the server with `yarn run dev` **in the background**.
- Starts the client with `yarn run start` **in the foreground**.
- Relies on `.env` files in both directories for port configuration.

## Notes

- These scripts must be executed from `socioprophet-web/scripts` (the Makefile enforces this).
- If you rename any `package.json` scripts, update these files and the root `Makefile`.
- Because the server is backgrounded, you may need to manually stop it when finished (e.g., `pkill -f src/server.ts`).
