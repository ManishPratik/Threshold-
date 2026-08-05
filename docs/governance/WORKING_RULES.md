# WORKING_RULES

## Mission

Help a single person keep the promises they made to themselves. Primary metric: Self-Trust.

## Non-Negotiable Principles

- The user's word is the unit of measurement.
- Software removes decisions, never adds them.
- Silence is a valid output.
- The record is honest.
- No dark patterns.
- Single-user boundary.
- Primary metric is integrity, not engagement.
- Never sell, transfer, or license user data.
- Never use user data to influence third parties.
- Never deceive the user about the record.
- Never engineer compulsion.
- Never weaponize user history against the user.
- Never accept commissions from misaligned third parties.
- Never use identity or record as leverage.
- Never simulate a second party the user has not chosen.

## Product Rules

- Act only on what the user explicitly said. No inferred goals.
- Every product is legible. No hidden state.
- Default is safe. Actions are reversible where the action allows.
- Destructive actions are named, deliberate, and confirmable.
- Behavior is consistent across time. Same input, same output in year one and year ten.
- Every product is complete without further input. Empty states are first-class.
- Remember only what the user asked to remember. Forget what the user asked to forget.
- Speak the user's language. No implementation vocabulary in UI.
- Cadence is the user's. The product does not summon the user.
- Say something once, at the right moment. No repetition.
- Report; do not cheer or scold.
- Fill no silence. Empty is valid.
- Sessions are short. End when the user's task ends.
- Design for return, not retention.

## Engineering Rules

- Each part has one responsibility.
- Boundaries between parts are explicit.
- Concerns are separated in the structure.
- State is minimized; derive rather than duplicate.
- Failures are handled explicitly. No silent swallow.
- Every load-bearing decision is recorded and dated.
- The system is decomposable and testable in parts.
- Changes are backward-compatible by default. Breaking changes are named.
- Complexity must justify itself. Simplicity is the default.
- Data is the user's. Store the minimum required.
- Data is exportable verbatim; deletion is complete.
- No background export, no ambient sync, no implicit sharing.
- Privacy is structural, not policy.
- Least privilege for every part and every dependency.
- Failure is safe. Crashes do not leak.
- Security is continuous.
- Privacy breach is a first-order failure.

## Decision Order

Purpose → Principles → Strategy → Human Understanding → Product → Engineering → Implementation.

Apply every decision through this order top-to-bottom. Reject early at the level that first fails the decision. Never let a lower level override a higher one; a lower-level need that conflicts with a higher level requires amendment of the higher level, or the decision is abandoned.

## Working Rules

- Cite file:line for every claim about code, files, or runtime state.
- Never hedge. Every factual claim carries evidence or explicit uncertainty.
- Never label severity without file:line evidence in the same paragraph.
- Verify before claiming absence, existence, contents, or behavior. Use grep, ls, Read, or route citation.
- Smallest safe change per turn.
- Never expand scope. Never introduce new abstractions the amendment process has not approved.
- Preserve backward compatibility unless the amendment process authorizes otherwise.
- Report A/B/C/D on completion: user outcome improved, user friction removed, engineering work completed, remaining friction.
- When implementation and the Company Reference disagree, the Company Reference is authoritative until either the implementation is aligned or the Reference is amended.
- Ethical Boundaries cannot be crossed by any decision.
- One conscious decision per session. Silence is a valid session outcome.
- Every session opens by identifying the current milestone and closes with a written summary.

## Source of Truth

**Company Reference.** Governing normative decisions — purpose, values, principles, product charters, UX and engineering philosophy, governance. Read at the start of any session that touches strategy, philosophy, or a load-bearing decision. Amendments require the formal process defined in Part VI.

**Atlas.** Descriptive research corpus — findings, evidence, hypotheses, user archetypes, open research questions. Append-only. Read when justifying a decision with evidence, when investigating human understanding, or when the Company Reference cites an Atlas entry by identifier.

**Product Documents.** Per-product operational content — backlog, release notes, deferred-feature registers, product-scoped decisions. Live in the same repository as the product. Read when working on a specific product.

**Engineering Documents.** Implementation content — architecture snapshots, technology-choice records, operations runbooks, release procedures, code documentation. Live in the same repository as the code. Read when contributing code or operating a system.
