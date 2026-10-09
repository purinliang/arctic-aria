# Chat

Authenticated users open a compact, non-modal bottom-right chat window using
a circular primary MessageCircle button. The window fades open/closed without
scaling or movement;
reduced-motion users get an immediate transition. Escape or Close dismisses it
and returns focus to the opener. The workspace remains usable.

The compact header contains a small chat icon, Aria Chat and Close. Search UI
is intentionally omitted for now; the retained backend search matches literal
text in user messages and Gemini replies within seven days. Conversation history
uses server-side pagination through Older messages. The retention hint is
intentionally omitted from the interface; seven-day storage/search/cleanup
behaviour is unchanged. Header uses shared card-header padding (16px horizontal,
8px vertical); the composer uses shared dialog padding (16px on all sides), with
an 8px control gap.
The single-line auto-resizing composer grows to five lines, then scrolls
internally. Desktop supports Enter to send, Shift+Enter for a newline and IME
composition; touch devices retain normal keyboard newline entry and use Send.
The panel tracks the visual viewport so its composer stays above the keyboard.
The blue arrow sends. A pending user message appears immediately, followed by
Thinking. Only sending is blocked while a reply is pending; history remains
usable. Thinking appears in a left-aligned secondary bubble matching assistant
replies. It is a temporary status, never a persisted assistant message.
Working on it is the centralized future tool-execution label; this feature does
not execute tools. Failures use distinct inline system notices, not assistant
bubbles. Central codes cover internal, provider unavailable, invalid key,
unconfigured provider, rate limit, network and timeout failures. Configuration
errors offer Settings; retryable failures offer Retry with the same request ID.
Failed user messages and composer drafts remain available. Unconfirmed messages
remain in the session cache until confirmed or expired. Plain text replies are
escaped by React, not rendered as HTML. Empty conversation shows a centered
welcome; initial history loading uses a subtle spinner, not a dashed frame.
Message bubbles contain only message text: user messages on the right, assistant
messages on the left. Names and timestamps are not rendered. A compact centered
date separator appears only when consecutive messages cross a calendar day in
the configured app timezone: Today, Yesterday, or the localized weekday. Stored
timestamps remain unchanged.

Gemini uses only the user's enabled provider, saved encrypted key and selected
model. Disabled/unconfigured users see an Open Settings action. No global key
fallback, app data access or mutation tools are provided. Only up to eight
completed exchanges from the previous seven days are supplied as AI context.
The user's messages are sent to Google using the SDK's explicit
[contents/role format](https://github.com/googleapis/js-genai#how-to-structure-contents-argument-for-generatecontent).

Recent history uses user-scoped sessionStorage with stale-while-refresh reads.
At most 100 exchanges are cached. Expired entries are removed on reads and by
a workspace timer, even while the window is closed. Sign-out clears the cache.
Cache failures do not break live data. Provider enabled state
is always refreshed, never trusted from cached history. Browser-tab closure
clears session history; server history remains available for seven days.

## Data Model

Migration 0045 adds `ai_chat_exchanges`: UUID request ID, owning user ID (cascade
on account deletion), user text (1–4,000 characters), optional reply (up to
16,000 characters), model, pending/complete/failed status, lease UUID, creation
and update timestamps. Complete status requires a reply, other statuses forbid
one. Indexes support user/time pagination, retention deletion and one pending
exchange per user across server processes. All reads/writes enforce ownership.
Search is parameterized literal substring matching, not SQL pattern syntax.

Request IDs make successful resends idempotent. Retrying a failed message must
use the same text and obtains a new lease. Completion writes require that lease
and pending status so stale responses cannot overwrite newer intent. Abandoned
pending writes become failed after 90 seconds. The SDK has a 30-second timeout
and does not automatically retry generation. A transport failure can be retried
using the same ID; a previously completed exchange returns its saved reply.

All queries exclude entries at or beyond seven days old. Owner-scoped access
also deletes expired records. The existing authorized 15-minute cron route
deletes expired history globally, including inactive accounts. Physical deletion
therefore occurs on the next successful cron invocation, not exactly at expiry;
expired content is never searchable or supplied as context. No archive or
secondary note table is created. Keys never enter history or browser caches.

## Validation

Focused tests cover ownership/validation boundaries, disabled AI, context roles,
duplicate IDs, retryable failures and user-scoped cache expiry. Live checks use
disposable development accounts and a fake provider, never real credentials or
billable Google requests. Native live-key operation remains a developer check.

Repeatable local browser/database check (production build on localhost required):

```bash
cd apps/web
BASE_URL=http://127.0.0.1:3001 node --env-file-if-exists=.env.local scripts/check-chat-live.mjs --confirm-development
```
