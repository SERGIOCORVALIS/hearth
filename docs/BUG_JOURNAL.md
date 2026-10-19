# Bug journal (Devpost bonus up to +10%)

## BUG-001 — MCP session required after initialize

- **Task:** Call `tools/list` from the simulator against `/mcp`.
- **Steps:** POST initialize without persisting `Mcp-Session-Id`; POST `tools/list` bare.
- **Expected:** Session continues or a clear protocol error.
- **Actual:** `400` missing session.
- **Severity:** Medium (blocks demo if the client drops the header).
- **Workaround:** Use SDK `StreamableHTTPClientTransport`, which stores the session id.
- **Recommendation:** Ship a one-page “stateful Streamable HTTP” cheat sheet for Alexa+ builders.

## BUG-002 — Bedrock unavailable on a fresh PC

- **Task:** Run the Converse agent without AWS credentials.
- **Steps:** Start simulator with no `AWS_*` env; send chat.
- **Expected:** Still produce a family plan via MCP.
- **Actual:** Hard failure without a fallback.
- **Severity:** High for PC-only judging.
- **Workaround:** Offline MCP router + automatic Bedrock failure fallback; care KB still retrieves.
- **Recommendation:** Treat Bedrock as enhancement; never gate the demo video on cloud credentials.

## BUG-003 — Unstable plan ids across suggest/confirm

- **Task:** Confirm a suggested plan by id.
- **Steps:** Suggest plans, then `confirm_plan` with `plan-cozy-classic`.
- **Expected:** Same option object returned.
- **Actual:** Early draft regenerated catalogs per call and could miss ids.
- **Severity:** Medium.
- **Workaround:** Stable plan templates + role-based personalization materialization.
- **Recommendation:** Prefer immutable template ids for hackathon MCP tools.

## BUG-004 — Care check-in with wrong member id

- **Task:** `log_care_checkin` after switching to Okonkwo (elder is Ngozi, not Elena).
- **Steps:** Agent hard-coded `m-elena`.
- **Expected:** Check-in attaches to the active household’s elder.
- **Actual:** Unknown member / wrong person.
- **Severity:** Medium.
- **Workaround:** Resolve `elder` / grandma aliases; fall back to first elder role; agents read profile members.
- **Recommendation:** Role-based member refs in tool schemas (`memberRole: elder`).

## BUG-005 — Demo autoplay stalled on React busy state

- **Task:** `Play demo` runs two scenarios back-to-back.
- **Steps:** Second step called while `busy` was captured true in a stale closure.
- **Expected:** Both household scenarios complete.
- **Actual:** Second send no-op’d.
- **Severity:** High for video recording.
- **Workaround:** `busyRef` guard instead of closure `busy` boolean.
- **Recommendation:** Autoplay/demo modes should use refs for in-flight locks.

## BUG-006 — Windows process kill leaves ports half-bound

- **Task:** Restart MCP after iterating.
- **Steps:** Kill node via port ownership; start again quickly.
- **Expected:** Clean listen on `:3100`.
- **Actual:** Occasional `EADDRINUSE` / zombie npm lifecycle exit `4294967295`.
- **Severity:** Low–Medium.
- **Workaround:** Wait 1s; `Get-NetTCPConnection` cleanup script before `npm run demo`.
- **Recommendation:** Document Windows port cleanup in README (noted in submission checklist).

## BUG-007 — Static UI + API same origin in Docker

- **Task:** Serve Vite build from the agent API.
- **Steps:** Open UI on `:8787` calling `/api/chat`.
- **Expected:** SPA + API without CORS pain.
- **Actual:** Dev mode uses Vite proxy; production needed explicit `SERVE_STATIC=1`.
- **Severity:** Low.
- **Workaround:** `express.static` + SPA fallback only when `SERVE_STATIC=1`.
- **Recommendation:** Keep dev (Vite) and prod (API static) paths documented separately.
