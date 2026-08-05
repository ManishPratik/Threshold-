# Section 0 — Preface

## 0.1 Purpose of this document

The Company Reference exists so that the reasons behind the company's decisions survive the individuals who made them, and so that a person joining the company in year ten can find, in one place, what the company holds and why. It is the single authoritative record of those decisions.

This document is written for the current and future members of the company — founders, employees, contractors, and stewards — and for parties who need to understand the company's positions, including regulators, auditors, partners, and successors of the enterprise.

The Company Reference governs company-level normative content: the company's purpose and values, the principles it holds, the human problem it addresses, the products it commits to build and the charters those products serve, the interaction and engineering discipline that binds every product, and the process by which this document itself changes.

Atlas owns research findings, evidence, hypotheses, methodology, and field observations. Product Documents own product-specific operational content — backlogs, release notes, and deferred-feature registers. Engineering Documents own current architecture snapshots, technology-choice records, operations runbooks, and code-level documentation. This document does not contain marketing copy, external communications, personal opinion, or forward-looking predictions.

## 0.2 Relationship with Atlas

The company maintains two canonical documents. This one, the Company Reference, is one. The other is Atlas.

The Company Reference is normative. Every entry states a position the company holds. Every position is a decision.

Atlas is descriptive. Every entry records an observation, an experimental result, a hypothesis, a citation, or a finding. No entry in Atlas is a decision.

The two documents interact in one direction. An Atlas finding may prompt an amendment to a Company Reference position through the amendment process defined in Part VI. The Company Reference does not modify Atlas. A decision recorded here does not become a research finding.

When a Company Reference position rests on a specific Atlas finding, the position cites the Atlas entry by its permanent identifier. The Atlas entry is the source of the evidence; the Company Reference entry is the source of the decision made in light of that evidence. Neither document restates the other's content.

## 0.3 Scope

Every category of company knowledge has exactly one owner. The rule for locating a piece of knowledge is:

**The Company Reference** owns normative company-level content: purpose, values, founding principles, ethical boundaries, category position, strategy, positioning statement, governance charter, the human problem the company addresses and the assumptions the company makes about the humans it serves, product charters, product principles, product language rules, product roadmap, interaction philosophy, composition invariants, accessibility standard, copy voice, engineering principles, architectural invariants, data governance, security and privacy positions, the amendment process, and the decision log. Every entry above is a decision. Amendments are governed by Part VI.

**Atlas** owns descriptive research content: findings, evidence, observations, empirical user archetypes, behavioural models, methodology, field notes, experiment logs, hypotheses, and open research questions. Atlas is append-only. Superseded entries are marked, not deleted.

**Product Documents** own operational content scoped to a single product: product backlog, release notes, deferred-feature and rejected-feature registers, per-product architecture decisions, and product-scoped operational history. Product Documents live in the same repository as the product they document.

**Engineering Documents** own implementation content: current architecture snapshots, technology-choice records, operations runbooks, release procedures, deployment checklists, rollback procedures, backup-verification procedures, and code-level documentation. Engineering Documents live in the same repository as the code they document.

Where a piece of knowledge would appear coherently in more than one document, this Reference is the final arbiter of ownership. Content is never duplicated across documents; cross-references by permanent identifier are used instead.

## 0.4 Reading Order

This document has an ordered structure. Each Part presumes the Parts above it. The document is written so that no forward references are required — a reader who reads in order never needs to consult a later Part to understand an earlier one.

**Everyone** reads this Preface and Part I (Company) in full before their first substantive contribution. Other Parts are consulted as the reader's work requires. Atlas is a reference, not an onboarding document.

**Engineers** additionally read Part V (Engineering) before contributing code. They consult Part III (Product) for the charter of any product they will work on, and the Product Documents and Engineering Documents in the product's repository for operational context. They consult Atlas when they need to understand the evidence behind a company-level position.

**Founders and stewards** read the entire document in order. They rely on Part I to align on purpose and governance, and on Part VI to understand how the document itself changes over time.

The Immutable subsections of Part I are the definitional root of every other Part. A reader who begins in the middle without reading Part I returns to Part I when a term or principle is unfamiliar.

## 0.5 Amendment Policy

This document distinguishes two classes of content. **Immutable subsections** change rarely and only through the amendment process defined in Part VI (Change Governance). **Evolving subsections** change with normal editorial pace and every change is recorded in the Decision Log in Part VI.

Atlas findings may prompt an amendment to a Company Reference position. The amendment process determines whether the position changes, remains unchanged, or is replaced. An Atlas finding alone does not modify this document; only the amendment process does.

**No amendment may contradict a governing principle defined in a higher section of this document.**

Every amendment records the date, the author, the section changed, and the substantive change. Superseded content is preserved in the Decision Log — no content is deleted from the historical record. Section numbering in Immutable subsections is stable and never reassigned; cross-references from Atlas, Product Documents, and Engineering Documents rely on this stability.

**When implementation and the Company Reference disagree, the Company Reference is authoritative until either the implementation is aligned or this document is formally amended.**

Full procedural detail — quorum, review, ratification, and the boundary between routine editorial change and formal amendment — is defined in Part VI. This Preface introduces only the discipline.

Section 0 ends here.

# Part I — Company

## 1.1 Purpose

The company exists to help a single person keep the promises they have made to themselves. This purpose is anchored to a single metric: the person's trust in their own word to themselves. The company defines this metric as Self-Trust and holds it as the primary metric that governs every product the company ships.

The purpose is bounded by what it excludes. The company does not exist to increase user productivity, throughput, efficiency, or output. The company does not exist to add commitments to a user's life; its purpose is to help the user hold the commitments they have already chosen.

The purpose survives the individuals who work for the company and the products it ships. If a product ever conflicts with the purpose, the product changes or is withdrawn; the purpose does not adapt to the product.

## 1.2 Mission

Purpose is the enduring reason the company exists. Mission is what the company works on while the purpose is being served. The mission is more specific than the purpose and broader than any single product.

The mission of the company is to build and maintain private software that helps a person reconstruct and preserve trust in their own word to themselves. Private means the person's record is theirs alone. Software means the primary output is executing code, not services, communities, or content.

The mission is orthogonal to any specific product. If a current product were withdrawn, the mission would remain in force and would direct the company to build a replacement that answers the same purpose.

## 1.3 Values

Values are the qualities the company holds when they conflict with expedient choices. The values below are peer principles. No value is subordinated to another as a matter of general rule; conflicts between values are resolved case by case through the governance process, and no value is silently traded for another.

**Integrity.** The company holds the user's word to themselves as sacred. Every feature, every metric, and every interaction respects that a promise kept is worth more than a task completed. Integrity is not traded for growth, efficiency, or market advantage.

**Privacy.** The user's record belongs to the user. The company does not collect, transmit, or store user data on infrastructure the user does not control. Privacy is not traded for convenience, distribution, or monetization.

**Calm.** The company builds software that reduces the cognitive cost of being who the user is trying to become. Calm is not traded for engagement, session length, or any metric that rewards keeping the user in the software longer than the user's own commitments require.

**Honesty.** The company does not exaggerate what its software does. It does not use urgency, streak-anxiety, or fear-of-loss to drive behavior. Honesty is not traded for conversion or retention tactics.

**Longevity.** The company builds for the person who will still be using the software in year ten. Longevity is not traded for the pace of trend-following or the temptation to reset the product's foundation for short-term novelty.

## 1.4 Founding Principles

Founding Principles are the load-bearing decisions the company holds indefinitely. Amendments to any Founding Principle require the highest form of amendment process defined in Part VI.

**P1 — The user's word is the unit of measurement.** The company measures trust one commitment at a time. Equal commitments carry equal weight regardless of duration, difficulty, or workload.

**P2 — The company's software removes decisions, never adds them.** Software the company ships answers "what should I do right now?" with one answer or with silence. It does not present the user with a dashboard or a menu of options at the moment of action.

**P3 — Silence is a valid output.** When there is nothing the user must do, the company's software says nothing. Absence of instruction is not a failure state and is not treated as one in any product the company ships.

**P4 — The record is honest.** The company records both kept and broken commitments. Broken commitments are not hidden, softened, or reweighted to protect a user's feelings. The record remains a faithful witness to the user's own conduct.

**P5 — The company holds no dark patterns.** No urgency invented for engagement, no streak used to induce guilt, no notification used to reclaim attention beyond what the user's own commitments require. This principle constrains every product the company will build.

**P6 — The single-user boundary.** Each installation of the company's software serves one person. Multi-user, cloud-shared, or account-based operation is outside the company's core products. Community, coaching, or shared-witness capabilities, if they enter a product, enter as optional extensions and never as prerequisites for the core software's function.

**P7 — The primary metric is integrity, not engagement.** Any secondary metric the company tracks — retention, session length, feature engagement — is subordinate to the primary metric of user integrity. When a secondary metric would grow at the expense of user integrity, the company chooses integrity.

## 1.5 Category

Category is what the company is understood to be by users, by the market, and by comparable actors. Naming the category is a decision open to future amendment; describing what the category IS anchors the company and requires the highest form of amendment to change.

The company builds software whose primary function is to help a person hold themselves to commitments they have already made. This function distinguishes the company from adjacent categories:

- **Task and productivity software** measures output; the company measures kept commitment.
- **Coaching software** places a second party — human or AI — as arbiter; the company treats the user as their own arbiter.
- **Accountability software** uses external stakes such as money or social pressure; the company uses only the user's own word.
- **Habit-tracking software** uses streaks and gamification to induce repetition; the company uses neither.

The category's mechanism is the user's word. The category's actor, witness, and beneficiary is the user themselves. The category's software is the record. Any product the company ships must fit inside this category. Any proposed product that would require the company to leave this category is subject to the highest form of amendment process before the company commits to build it.

The category name is not fixed by this Section. The shape of the category — the mechanism, the actor, the witness, the beneficiary, and the software's role as record — is fixed. If a name is later chosen for the category, the amendment enters this Section without altering the shape.

Section 1.5 ends here.

# Part II — Company Strategy

## 2.1 Strategy

Strategy is the company's answer to how it pursues its purpose. It is company-level; it does not specify what any individual product does.

The strategy holds five permanent postures.

**Depth over reach.** The company concentrates every resource on the single mechanism named in Part I: the user's word, recorded, held, and reflected back. It does not spread across adjacent mechanisms — task management, coaching, community — even when doing so would enlarge the addressable audience. Concentration is the strategy; dilution is the anti-strategy.

**Patience over velocity.** The company designs its timelines for the person who will still be using its software in year ten. It refuses growth tactics that trade year-ten trust for year-one acquisition. The company accepts a smaller cohort earlier when that cohort compounds toward the integrity outcome later.

**Small surface, full fidelity.** The company builds a small number of products that fully honor every Founding Principle rather than a larger number of products that partially honor them. A product that partially honors the principles is not shipped, is not shipped in a "beta" form, and is not shipped as an experiment. It waits.

**Wedge before breadth.** The company enters the world through the single audience most acutely feeling the pain the purpose addresses. Breadth follows depth of service to that wedge and never precedes it.

**Alignment over speed.** When the company must choose between shipping quickly and remaining aligned with the Founding Principles, it remains aligned. It accepts the delay. It records the delay in the Decision Log rather than shipping a product that would need to be walked back.

The strategy does not specify individual products. Every product the company builds inherits the strategy from this Section and operates consistently with all five postures.

## 2.2 Positioning

Positioning is the company's decision about how it represents itself to users, to the market, and to comparable actors. The positioning is a Founding-level commitment; it changes only through the amendment process.

The company positions itself as the software a person uses when they have already tried to keep a promise to themselves and want the record to hold them to it. The positioning filters both users and adjacent alternatives.

**What the company IS.** A record and a witness. A quiet piece of software that receives what the user has promised, tracks what the user has done, and shows the user the truth of that history. Nothing more, nothing less.

**What the company is NOT.** A coach. A community. A gamification layer. An accountability service that involves a second party. A productivity tool. A wellness platform. A behavior-change program.

**Whom the company speaks to.** People who have already recognized that their word to themselves is at stake and want a mechanism to hold themselves accountable to it. The company does not attempt to speak to those who have not yet recognized this; that recognition arrives without the company's intervention.

**Whom the company does not speak to.** Users seeking external motivation, gamification, community, or human accountability. These users are better served by other categories. The company neither poaches them from those alternatives nor competes for them.

The positioning acts as a filter. Users who fit the positioning find the company through their own search. Users who do not fit are directed to alternatives without any effort to convert them.

## 2.3 Success Criteria

Success Criteria define how the company judges its own success. The criteria are internal — they answer "did the company do its job?" — and are distinct from business metrics that measure market performance.

The company holds itself successful when all of the following hold:

**S1 — Users report rising Self-Trust over time.** Not measured through surveillance of the user's local record; such measurement would violate the Privacy value. Measured through user attestation, voluntary feedback, and independent research the company sponsors or observes.

**S2 — No Founding Principle has been compromised in pursuit of growth.** The company reviews each Principle annually against the year's decisions. A single compromise is treated as a failure of the year regardless of business outcomes.

**S3 — Every shipped product remains trustworthy under year-ten scrutiny.** A product a returning user opens in year ten works, respects their record, and does not embarrass its makers. Success requires this to remain true across every product currently in service.

**S4 — The company remains solvent enough to serve its current user cohort indefinitely.** Solvency is a means, not an end. The company does not measure success by revenue growth, valuation, or acquisition velocity. Solvency is the floor beneath which service becomes impossible.

**S5 — User integrity has not been exchanged for engagement.** No product improvement, no growth tactic, and no operational choice has increased user engagement metrics at the cost of the user's honesty with themselves.

**S6 — Every substantive decision has a record.** The Decision Log contains an entry for every choice large enough to have shaped the company. A missing record is a failure of governance regardless of the quality of the underlying decision.

Business metrics that other companies use to judge themselves — user acquisition, monthly active users, revenue per user, engagement time, feature-adoption rates — are not among the company's Success Criteria. The company tracks some of them internally to inform operational decisions; none of them determine whether the company has succeeded.

## 2.4 Decision Framework

The Decision Framework governs how strategic decisions are made — decisions that affect the shape of the company, its products, its positioning, or its principles. Operational decisions (which specific task to prioritize next, which bug to fix, which meeting to hold) are outside the scope of this Section.

Every strategic decision passes through a fixed sequence of tests. The tests are applied in order; a decision must pass each test before the next is considered.

**Test 1 — Purpose alignment.** Does the decision serve the Purpose defined in Part I §1.1? A decision that fails this test is not modified to make it pass; it is abandoned.

**Test 2 — Founding-Principle compliance.** Does the decision honor every Founding Principle defined in Part I §1.4? A decision that would violate any single Principle is rejected unless the Principle is first amended through the amendment process defined in Part VI. Amending a Founding Principle to permit a strategic decision requires the highest form of amendment.

**Test 3 — Value coherence.** Does the decision honor the Values defined in Part I §1.3? Because Values are peer principles, a decision that creates tension between two Values does not fail this test on that basis alone. When such tension exists, the decision is recorded with the Value trade-off explicit, and the trade-off is reviewed periodically to detect drift.

**Test 4 — Category consistency.** Does the decision leave the company inside the Category defined in Part I §1.5? A decision that would move the company outside the Category requires the highest form of amendment to the Category Section before the decision proceeds.

**Test 5 — Success-Criteria consistency.** Does the decision improve or preserve the Success Criteria in Section 2.3? A decision that would improve business metrics while degrading a Success Criterion is treated as a failure of the decision, not of the criterion.

Decisions that pass all five tests are executed and recorded in the Decision Log. Decisions that fail a test are recorded as considered-and-rejected in the same log, with the failing test named.

Deferral is a valid decision outcome. When the strategic question is under-specified, the framework's answer is to defer rather than to guess. Deferred decisions carry a review date and re-enter the framework at that time.

The framework specifies the tests each strategic decision must pass. It does not specify who applies them; authority to apply the tests is defined elsewhere in this document.

Section 2.4 ends here.

# Part III — Human Understanding

## 3.1 The Human Problem

The Human Problem is the region of the human condition the company holds itself responsible for. This Section defines that region in governing terms. Atlas holds any evidence and findings about how the region behaves; this Section defines only what the region is.

A human being makes commitments to themselves. Some are kept and some are broken. Whether the pattern of kept and broken commitments produces, sustains, or erodes the person's trust in their own word is a question the company treats as important. The answer to that question lives in Atlas, and it is not this Section's task to state it.

The company's responsibility is narrower than the psychology. The company holds itself responsible for the record — for whether the person can look at their own history with themselves and find it truthfully told. The company does not hold itself responsible for the causes of broken commitments, for the psychology of promising, for the reasons a person tries to change, or for what a person does with the record once they see it. Those regions of the human condition are important; they are not this company's region.

The Purpose defined in Part I §1.1 rests on this scope. Any expansion of the scope — any decision to become responsible for a region beyond the record — requires the highest form of amendment to this Section.

## 3.2 Human Model

The Human Model is the minimum set of governing assumptions the company holds about the humans its software serves. These assumptions inform every product decision. They are subject to amendment through the process defined in Part VI when Atlas evidence indicates an assumption is unfounded. Until such amendment, the company operates from these assumptions as if they were true.

**A1 — The user is an individual, not an aggregate.** The company designs for one person at a time. The user's word, history, and interpretation are personal. The company does not treat users as populations to be nudged, cohorts to be optimized, or averages to be modeled.

**A2 — The user is the arbiter of their own commitments.** The user decides what to promise, what counts as kept, and what counts as broken. The company does not adjudicate the user's conduct, does not grade the user, and does not offer a second-party opinion on the user's choices.

**A3 — The user is capable of honesty with themselves when the mechanism supports it.** The company assumes the user wants a truthful record. The company builds mechanisms that make honesty easier than distortion, and it does not attempt to compensate for a user who is determined to deceive themselves.

**A4 — The user's attention is theirs, not the company's.** The company assumes every unit of user attention is a resource the user did not have to give. Interruption, notification, and re-engagement are expenditures the company justifies against the user's own commitments, never against the company's own metrics.

**A5 — The user's history belongs to the user.** The company assumes the user has the right to a complete, unedited, transportable copy of every record the company has stored about them. The company does not retain user data the user has not chosen to store.

These assumptions constrain every product the company builds. Any product feature that would require an assumption not on this list must first be added to the list through amendment, or the feature is not built.

## 3.3 Ethical Boundaries

Ethical Boundaries are the actions the company will not take under any circumstance, including circumstances where evidence would indicate the action would be effective, profitable, or user-preferred. Ethical Boundaries are not falsified by evidence; they are the boundaries within which evidence is applied.

The company holds the following ethical boundaries:

**B1 — The company does not sell, transfer, or license user data.** No form of data-sharing arrangement is available at any price. The user's data does not leave the user's control except by an explicit act the user takes to share it.

**B2 — The company does not use user data to influence third parties.** No advertising network, no research partnership, no policy analysis, no marketing model. The user's record has one purpose — to serve that user's own understanding of themselves — and no derivative purposes.

**B3 — The company does not deceive the user about the state of the record.** No omission designed to spare feelings. No reframing of a broken commitment as a partial success. No metric that inflates the user's sense of themselves beyond what their conduct earns. The user reads exactly what their conduct has produced.

**B4 — The company does not engineer compulsion.** No pattern that exploits variable reward. No mechanism that induces the user to engage when they had no reason to. No penalty that leverages fear-of-loss to compel engagement. The user's return to the company's software is voluntary on every occasion.

**B5 — The company does not weaponize the user's history against them.** No shame surface, no comparison to other users, no message that surfaces the user's failures for the company's engagement purposes. The record is available to the user; the record is not deployed against the user.

**B6 — The company does not accept commissions from third parties whose interest is not the user's.** No sponsorship, no affiliate model, no partner integration that would introduce a party whose incentives diverge from the user's.

**B7 — The company does not use the user's identity or record as leverage.** No structural mechanism that makes the user's departure with their record costly. The user leaves at any time with a complete copy of everything the company holds about them.

**B8 — The company does not simulate a person the user has not chosen to consult.** No implied second party — coach, mentor, avatar, or peer — inside the company's software unless the user explicitly requests such a presence. The default experience is the user with their own record; nothing else.

Ethical Boundaries are the outermost limit of the Decision Framework. A decision that would cross an Ethical Boundary is rejected without further examination. Amendment of an Ethical Boundary requires the highest form of amendment defined in Part VI and cannot be triggered by evidence alone.

## 3.4 Open Questions

Open Questions are the enduring research directions the company has chosen to pursue. They are not temporary research tasks; they are questions the company treats as permanently open regardless of what evidence has accumulated and regardless of which products the company builds. Atlas contains the current state of investigation for each question; this Section defines the questions themselves.

The company holds the following Open Questions:

**Q1 — How does a human come to trust their own word?** The mechanism by which self-trust is built, maintained, sustained, or lost. The company's responsibility (Section 3.1) rests on the record; this question is the underlying mechanism the record participates in.

**Q2 — What forms of self-communication are honest, and what forms are self-deception?** The line between a person telling themselves the truth about their own conduct and a person constructing a favorable narrative. The location of the line changes with the person, the moment, and the commitment.

**Q3 — How does the record itself change what is being recorded?** The observer effect in the human's own life — the way that the act of tracking a commitment interacts with the act of keeping it. Every act of recording is a potential intervention. Understanding when this intervention helps and when it distorts is a permanent research direction.

**Q4 — What is the moral weight of a promise a person makes to themselves?** How this weight is felt, how it accumulates, how it discharges, and how it varies across cultures, life stages, and belief systems. The company does not adjudicate this question; the company assumes the moral weight is real and treats the user's word accordingly. The empirical shape of the weight remains a research question.

**Q5 — How does a person recover self-trust after a serious failure of their own word?** The recovery process — including which conditions accelerate it, which conditions delay it, and which conditions cause the person to abandon the pursuit.

Open Questions do not have final answers. Findings that accumulate in Atlas inform, but do not close, the questions this Section names. A question is removed from this Section only through the highest form of amendment, and only when the company has decided the question is no longer within its scope of responsibility.

Section 3.4 ends here.

# Part IV — Product Philosophy

## 4.1 Product Philosophy

Product Philosophy is the company's answer to what a product IS inside this company's shape. It applies to every product the company has built, every product it currently ships, and every product it will build.

A product from this company is a tool, not a habitat. The user opens it, uses it for a purpose the user brought with them, and closes it. The user does not live inside the company's products; the user visits.

A product from this company is small. It has a narrow function that inherits from the Purpose in Part I §1.1. It does not attempt to encompass adjacent functions even when the market would reward such expansion. Each product's scope is decided once and defended thereafter.

A product from this company is quiet. It speaks when there is something the user must hear and remains silent otherwise. Silence is a first-class output per Part I §1.4 (P3); noise is a design failure.

A product from this company is durable. It is designed for the user who returns to it after a year of absence, and it is designed so that a user active in year ten opens the same product they knew in year one — grown, but not renamed, refactored, or replaced with a successor product.

A product from this company is architectural. The user relies on its structure — the shape of the record, the position of the anchor, the meaning of a completed action — and the company does not change that structure to serve internal convenience. Structural change requires the same amendment discipline that governs this document.

A product from this company is complete when it honors its charter, not when it stops receiving features. Feature accumulation is not evidence of product maturity; the company distinguishes a mature product from a growing product and holds mature products to a stricter constraint against further change.

## 4.2 Product Principles

Product Principles are the load-bearing constraints every product from the company embodies. They are more specific than the Founding Principles in Part I §1.4 and more general than any implementation. Amendment of any Product Principle requires the amendment process defined in Part VI.

**PP1 — Every product operates on the user's word, and nothing else.** No inferred goals, no derived intents, no computed motivations. The product acts on what the user has explicitly told it and does not act on what the product has guessed about the user.

**PP2 — Every product is legible.** At any moment, the user understands what the product is doing and why. There are no hidden states, no invisible calculations, and no opaque outputs.

**PP3 — Every product's default is safe for the user.** When a product must act without instruction, its action is the one that preserves the user's data, preserves the user's control, and can be undone.

**PP4 — Every product's destructive action is named, deliberate, and confirmable.** Loss is not a side effect. When a product destroys, replaces, or archives user data, it does so only after the user has explicitly named the intended outcome.

**PP5 — Every product acts consistently across time.** Its behavior on the same input in year one is its behavior on the same input in year ten. Changes that alter this consistency are treated as breaking changes and require the same amendment discipline as governing decisions.

**PP6 — Every product is complete without further input.** A newly-installed product with no user data still respects every principle in this Part. Empty states are not degenerate cases; they are first-class product surfaces.

**PP7 — Every product remembers only what the user has asked it to remember and forgets whatever the user has asked it to forget.** The product does not retain shadow copies, telemetry, or derived state that the user cannot see or delete.

**PP8 — Every product speaks the user's language.** Errors, prompts, and messages use terms the user has been given, not internal terms invented for engineering convenience. The product does not disclose implementation to the user.

## 4.3 Interaction Philosophy

Interaction Philosophy governs how a product from this company behaves in the moment it meets the user. It is the temporal counterpart to the Design Philosophy in Section 4.4, which governs the structural shape.

**Cadence.** The product's cadence is the user's cadence. The product does not initiate; it responds. The product does not push the user toward a rhythm the user did not choose. The user opens the product when they choose to; the product does not summon the user.

**Timing.** When the product has something to say, it says it once and at the moment the user is present to hear it. It does not repeat, does not escalate, and does not remind unless the user has explicitly asked for a reminder. Notification is an intrusion; the product treats it as such and uses it only when the user has consented to be intruded upon.

**Tone.** The product speaks with the plainness of a witness. It does not celebrate, it does not scold, and it does not cheer. It reports. Warmth in a product from this company comes from what is true about the user's own conduct, not from the product's affect.

**Response.** The product responds within the frame of the user's own actions. When the user completes a commitment, the product acknowledges the completion and moves on. When the user misses a commitment, the product records the miss and moves on. The product does not extract additional interaction from either outcome.

**Silence.** The product's silence is intentional. When there is nothing for the user to hear, the product produces nothing. Empty surfaces are valid; blank spaces are valid; the absence of a message is valid. The product does not fill silence with content in order to signal aliveness.

**Duration.** A session with a product from this company is short by design. The product does not extend the session, does not offer additional flows once the user's business is finished, and does not detain the user with related capabilities. When the user's task is complete, the interaction ends.

**Return.** The product is designed for return, not for retention. A user who returns after a year of absence finds the product where they left it, with their data intact and the interaction still legible. The product does not require re-onboarding, does not renegotiate the user's setup, and does not present itself as changed beyond the changes the user has been notified about.

## 4.4 Design Philosophy

Design Philosophy governs the structural shape of every product the company builds. It is the enduring counterpart to the Interaction Philosophy in Section 4.3, which governs behavior in the moment.

**Simplicity of shape.** A product from this company has a small number of surfaces the user encounters, and each surface has a small number of elements. The product does not accumulate surfaces to accommodate features; features accumulate to the surfaces they belong to, or they are refused.

**Editorial density.** A product from this company treats the user's reading as work. Every visible element earns its place. Decorative content is absent. Repetition, filler, and unnecessary framing are absent. What remains is the material the user needs to see.

**Textual primacy.** The product's meaning is carried in language, not in imagery. Icons, illustrations, and graphical decoration are subordinate to text. When a product from this company must choose between an image and a sentence, it chooses the sentence.

**Hierarchy of attention.** Each surface presents a single primary focus. Secondary content is smaller, quieter, and clearly subordinate. The user always knows where to look first without being told.

**Consistency across surfaces.** The same term names the same thing across every surface of every product from this company. A concept introduced in one surface has the same meaning in every surface it reappears in. Vocabulary drift is a design failure that requires correction, not a stylistic choice.

**Permanence over novelty.** A product from this company chooses design patterns that will still read as trustworthy in year ten over design patterns that read as modern in year one. Trend-following is not a design method; enduring clarity is.

**Restraint over expression.** A product from this company does not perform. Its design does not attempt to signal the maker's craft, taste, or personality. It attempts only to disappear behind the user's task.

**Truth in emptiness.** Empty states are designed with the same care as populated states. A product with no user data does not degrade into a placeholder; it presents a coherent surface that honors every principle in this Part.

**Legibility across abilities.** The design accommodates every human entitled to use the product. Legibility for users with vision impairment, motor limitation, cognitive load, or linguistic difference is not an accessibility layer added on top of the design; it is the design's baseline.

**The record is the aesthetic.** The visual weight of a product from this company is the weight of the user's own history. Beauty comes from a truthful record, cleanly rendered. The design does not add beauty the record has not earned.

Section 4.4 ends here.

# Part V — Engineering Philosophy

## 5.1 Engineering Philosophy

Engineering Philosophy is the company's answer to what engineering IS inside this company's shape. It applies to every implementation the company has built, currently ships, and will build, regardless of the technology of the day.

Engineering exists to serve the company's Product Philosophy. It does not exist for its own sake. The measure of engineering quality is not the elegance of the code, the cleverness of the architecture, or the novelty of the tools used. The measure is whether the company's Product Principles hold true in the built artifact.

Engineering in this company is patient. It accepts the timeline required to build a system that will not need to be replaced in year five. It refuses shortcuts that would produce a product faster but at the cost of the durability the company requires of every product.

Engineering in this company is conservative. It reaches for the smallest technology that answers the requirement. It does not adopt tools for their newness, does not adopt dependencies whose owners would require the company to reshape products around them, and does not depend on external systems the company does not understand or cannot replace.

Engineering in this company is auditable. Every engineering choice large enough to shape a product is recorded, dated, and explained. Undocumented engineering choices are treated as governance failures. A future engineer opens the record and reads why the current shape was chosen without having to reconstruct the reasoning from artefacts alone.

Engineering in this company is honest about tradeoffs. When a choice is made under a constraint — time, headcount, uncertainty — the constraint is named. The company does not describe forced choices as considered choices, and it does not present engineering shortcuts as engineering decisions.

Engineering in this company is bounded by governance. Engineering does not decide what the product does; that is decided upstream. Engineering does not decide the company's ethical boundaries; those are set elsewhere in this document. Engineering executes within the constraints the rest of this document defines, and it raises alarms when a required implementation would violate one.

When any engineering principle in this Part conflicts with a principle established earlier in this document, the earlier principle prevails without exception.

## 5.2 Architectural Principles

Architectural Principles are the load-bearing constraints every implementation of every product in this company satisfies, regardless of the architectural style chosen to satisfy them. Amendment of any Architectural Principle requires the amendment process defined elsewhere in this document.

**AP1 — Each part of a system has one responsibility.** Whatever unit of composition the era favors, each has one reason to exist. A part that answers to two responsibilities is decomposed until singularity is restored.

**AP2 — Boundaries between parts are explicit.** A part exposes a boundary. Consumers use only what the boundary makes available. Reaching past the boundary into another part's internals is a violation, not a convenience.

**AP3 — Distinct concerns are separated in the system's structure.** Reading and writing data is separated from acting on data. Business rules are separated from the mechanics of persistence. Presentation is separated from decision. The specific separations vary by era; the discipline of separation does not.

**AP4 — State is minimized.** When a value can be derived from another value, it is derived rather than stored. Duplicated state that requires manual synchronization is a source of untruth and is refused.

**AP5 — Failures are handled explicitly.** No error is swallowed silently. No error surfaces to the user as an unnamed condition. Errors are named at the layer where they occur, propagated to the layer that can respond, and either resolved or surfaced with a name the user understands.

**AP6 — The architecture is auditable.** Every load-bearing decision — a boundary drawn, an invariant enforced, a constraint accepted — is recorded and dated. A future engineer opens the record and understands why the current shape exists.

**AP7 — The system is decomposable.** A part can be understood in isolation from the whole. A part can be tested in isolation from the whole. A part can be replaced without cascading changes to unrelated parts. Systems that cannot be decomposed are restructured until they can.

**AP8 — Changes are backward-compatible by default.** Every shape the software has published — to users, to other parts, or to storage — evolves additively. Breaking changes are named breaking changes and are handled through explicit transition, not through hidden accommodation.

**AP9 — Complexity is justified.** Every layer, every indirection, every abstraction earns its place by answering a concrete need. Complexity added in anticipation of a need that has not yet arrived is refused.

**AP10 — Engineering preserves simplicity. Complexity must justify its existence. Simplicity is the default.**

## 5.3 Data Philosophy

Data Philosophy governs how the company treats data — the user's data primarily, and every derived or inferred datum secondarily.

**Data is the user's.** Every piece of data the company holds about a user is the user's, not the company's. The company holds it as a custodian, not as an owner. This principle constrains every engineering choice that touches user data.

**Data is honest.** The stored representation of the user's history matches what the user has done, without distortion, without aggregation that hides the individual event, and without interpretation that reshapes the raw record.

**Storage is minimal.** The company stores what the product requires to function and nothing more. Every stored field justifies its existence against the company's product principles. Speculative storage is refused.

**Data is durable.** Data the user has entrusted to the company's software survives across software updates and across changes in the underlying storage technology. Continuity is the engineering's responsibility, not the user's.

**Data is transportable.** The company's stored data is exportable in a shape the user can read, understand, and move to a different system. The export is complete, verbatim, and free from lock-in through proprietary encoding.

**The user controls what is retained.** The user deletes what they choose to delete, and the deletion is complete. The company does not retain shadow copies or remnants after the user has asked for erasure.

**The user controls what crosses boundaries.** Data that leaves the storage the company controls leaves only because the user has explicitly acted to move it. There is no background export, no ambient sync, no implicit sharing.

## 5.4 Security & Privacy Philosophy

Security & Privacy Philosophy governs how the company protects the user's data and the user's participation.

**Privacy by design.** Privacy is a property of the software, not a promise about the company. The user's data is protected because the software is built to prevent it from leaving without explicit user action, not because the company holds a policy against leaking it. Structural privacy is preferred over policy privacy in every design.

**The user's identity is not required.** The company's software does not require the user to identify themselves to it. Anonymous use is the default. Any identity a user chooses to associate with their data is a convenience layer over a system that functions without it.

**Least privilege.** Every part of the system has the smallest access to the user's data compatible with its function. Parts that do not need to read user data do not read it. Parts that do not need to write user data do not write it. This principle extends to every external party the software incorporates.

**Explicit user control.** Every operation the software performs on the user's data is either initiated by the user or transparent to the user. The user retains the authority to observe, halt, or reverse any operation the software performs with their record.

**Failure is safe.** When the software fails, the failure mode preserves user data and preserves user privacy. Crashes do not leak, corruption does not expose, and unavailability does not force the user to accept a degraded privacy state to continue.

**Security is continuous.** Security is an ongoing responsibility, not an event. The company reviews its security posture on a recurring basis and holds itself accountable to the year-ten user, not to the year-one shipping deadline.

**Privacy failures are first-class failures.** A privacy breach — a leak, an unauthorized share, an accidental disclosure — is a first-order failure of the software and requires the same governance response as loss of the user's data.

Section 5.4 ends here.
