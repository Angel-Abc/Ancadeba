# Environment Variables

The editor server reads configuration from an `.env` file located at the repository root. The table below lists the supported variables.

## Editor server

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GAME_DIR` | Yes | n/a | Absolute or repo-relative path to the game folder whose JSON files are served. |
| `PORT` | No | `3001` | Port used by the editor server. |
| `RATE_LIMIT_MAX` | No | `120` | Maximum number of requests allowed per window per client IP. |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Duration (in milliseconds) of the rate limiting window. |
