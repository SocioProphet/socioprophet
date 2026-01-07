# .yarn (Server)

## Purpose
This directory stores Yarn metadata for the server workspace.

## Contents
- `install-state.gz` – Yarn’s cached install state for faster dependency operations.

## Notes
- The file is auto-managed by Yarn. Avoid manual edits unless troubleshooting Yarn itself.
- Removing the file will force Yarn to rebuild its install state on the next install.
