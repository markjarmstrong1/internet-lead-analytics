# MANTIK Local Developer Agent

The agent is an optional Node.js process for local development. It is not part of the deployed Next.js server and must only be started on a trusted development machine.

## Start

From the repository root:

```bash
npm run agent
```

The process verifies that the current directory contains `package.json` and `src/`, binds only to `127.0.0.1:4318`, and prints a random pairing token. Keep the token private. Paste it into the Terminal page served from an approved local development origin, currently ports 3000 and 3001 on `localhost` or `127.0.0.1`.

Stop the process with Ctrl+C. The pairing token is generated per process and is not saved to disk.

## Capabilities in this first version

- Read-only Git branch and worktree status.
- Read-only diff for a single repository-relative path.
- Browse repository directories and read text files up to 128 KB.
- Run only the named `test`, `lint`, and `build` tasks.

There is no arbitrary shell endpoint, file-write endpoint, commit action, or push action. The Files panel is read-only in this version.

## Security boundaries

- Loopback binding only; do not reverse-proxy or tunnel this service to the public internet.
- Requests require an exact allowlisted Origin, expected Host, and a random per-process token.
- Commands use `spawn` with argument arrays and `shell: false`; the task name maps to fixed executable arguments.
- Child processes run from the detected repository root. Output is bounded and tasks have a timeout.
- Paths are normalized, traversal is rejected, resolved symlinks must remain within the repository, and common secret/dependency/build/Git directories are excluded from browsing.
- The pairing token is held in page component state and is not written to browser storage.

## Important limitation

This is a local-development convenience, not a hardened multi-user security boundary. Any process running as the same OS user can generally access that user's files. Do not use it on an untrusted computer, do not share the token, and stop the process when finished. Review changes and run lint, tests, and build locally before merging.
