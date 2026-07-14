# TaskLattice UI and Interaction System

Status: Implemented baseline

Version: 0.2

This contract applies the Vibe Designing evidence model to TaskLattice. It
covers the public landing page, authentication, and the protected control
workspace.

## Product intent

TaskLattice helps an operator declare, provision, inspect, and enter an
isolated Agent runtime. The interface must keep desired Agent configuration and
actual sandbox state distinguishable. It must never imply that a provisioning
request succeeded before the runtime reports success.

The public page establishes the value and trust boundary. The control console
prioritizes the operating task and current state over marketing expression.

## Visual intent

- Temperament: operational, precise, direct, and calm.
- Brand signal: signal green on deep ink, used for readiness, progress, and
  primary conversion rather than general decoration.
- Neutral system: warm off-white on the public and auth surfaces; neutral white
  and soft gray in the dense control console.
- Typography: Geist Variable with a compact display scale and readable body
  line height.
- Shape: rounded controls and surfaces, but hierarchy comes from spacing,
  borders, density, and contrast rather than a wall of equal cards.
- Motion: short state transitions only. Honor `prefers-reduced-motion`.

## Navigation contract

Desktop navigation is permanent and can collapse from 280 pixels to 72 pixels.
The preference persists locally. Collapsed navigation retains tooltips and
accessible names. The active item uses both surface and weight, not color
alone.

Mobile navigation is an overlay drawer. It opens from the menu button and
closes through its close button, backdrop click, navigation, or Escape. The
page returns to an unobstructed state after dismissal.

Unavailable future sections are visibly disabled, marked `Later`, and explain
their relationship to the current Agent path through a tooltip. They are not
presented as broken links.

The account control stays at the bottom of navigation and exposes the actual
identity provider plus sign out. The top bar contains route context, the
environment, and intentionally disabled future search.

## Authentication contract

The login page supports configured local credentials and optional OIDC SSO.
Local login and SSO resolve to the same TaskLattice session and protected API
boundary.

States:

- Loading: keep the form stable and prevent duplicate submission.
- Invalid credentials: show a persistent, text-labelled recovery message.
- Development defaults: explicitly warn that `admin / admin` is active.
- SSO unavailable: keep local login available and surface the provider error.
- SSO callback: show a single-purpose completion state, then validate the
  returned TaskLattice session before entering the workspace.
- Expired session: clear stored credentials and return to login.
- Sign out: clear local credentials even if provider logout is unavailable.

Production requires an explicit signing secret and local password/hash. OIDC
uses discovery, Authorization Code, PKCE, nonce, signed state storage, issuer,
audience, expiry, and provider signing-key validation.

## Component and accessibility rules

- Preserve semantic buttons, links, labels, headings, navigation, and main
  landmarks.
- Keep interactive targets at least 44 by 44 CSS pixels where touch applies.
- Never remove focus indicators; use visible `focus-visible` treatment.
- Keep DOM and visual order aligned.
- Do not use color as the only status signal.
- Provide a specific recovery action for failure and empty states.
- Keep animation under 300 milliseconds unless a documented spatial transition
  needs more time; animate transform and opacity by default.
- Avoid purple-blue default gradients, indiscriminate blur, emoji iconography,
  decorative bounce, and repeated equal-weight cards.

## Evidence gate

Use `release_gate` for changes intended for deployment. A pass requires:

1. Unit tests, type checking, and production build succeed.
2. Unauthenticated Agent API access returns 401.
3. Local login, session resolution, protected Agent access, and sign out work.
4. SSO start produces PKCE, nonce, state protection, and the configured redirect.
5. Desktop landing, login, expanded/collapsed console, and mobile layouts render
   without overflow or unreadable text.
6. Mobile navigation opens and closes with Escape.
7. The main CTA and primary control path produce visible feedback.
8. Browser console has no application errors or missing first-party assets.

Score landing pages with the Brand Landing profile and workspace pages with the
Product Console profile. Treat broken auth, a broken primary operation, generic
template output, or an inconsistent component system as blockers regardless of
the weighted score.
