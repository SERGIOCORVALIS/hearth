# Tunnel proof

- Checked: `2026-10-16T18:25:07.687Z`
- Base: `http://127.0.0.1:3100`
- Public host: **no (local dry-run)**
- All endpoints OK: **YES**

| Path                           | Status | ms  | Notes                                                                            |
| ------------------------------ | ------ | --- | -------------------------------------------------------------------------------- |
| `/health`                      | 200    | 134 | {"ok":true,"protocolVersion":"2025-11-25","transport":"streamable-http","securit |
| `/legal/privacy.html`          | 200    | 11  | <!doctype html> <html lang="en"> <head> <meta charset="utf-8" /> <title>Hearth P |
| `/legal/terms.html`            | 200    | 5   | <!doctype html> <html lang="en"> <head> <meta charset="utf-8" /> <title>Hearth T |
| `/assets/icon-72.png`          | 200    | 6   | bytes=293                                                                        |
| `/assets/carousel-600x900.png` | 200    | 5   | bytes=9095                                                                       |

## Video insert (10–15s)

Record 10–15s in browser: open /health, then /legal/privacy.html, then /assets/icon-72.png
