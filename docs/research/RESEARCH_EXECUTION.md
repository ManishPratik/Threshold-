# RESEARCH_EXECUTION

## Purpose

RESEARCH_EXECUTION defines the operating procedure for populating one Atlas topic from start to finish. It is the manual researchers follow after RESEARCH_QUEUE has selected the topic and RESEARCH_METHOD has defined the standards. One topic is executed at a time. The full ten-stage workflow completes for the current topic before the next topic begins.

## Governing Rules

- One topic at a time. A second topic does not open while the first is in progress.
- Stages proceed in order 1 → 10. A stage does not begin until the prior stage has satisfied its exit criteria.
- Every claim admitted to Atlas is traceable through the workflow's outputs back to source evidence.
- Contradiction search (Stage 5) is mandatory and cannot be skipped.
- Unknown (per RESEARCH_METHOD FP9) and Insufficient (per RESEARCH_METHOD FP10) are acceptable outcomes that complete the workflow like any other conclusion.
- Atlas is updated only after Stage 9 approves the entry and Stage 10 records the amendment-trigger check. Interim outputs live in the workflow log, not in Atlas.
- The Company Reference is not modified by this workflow. Stage 10 records only whether the surfacing threshold is met; the amendment process itself is separate and defined in the Company Reference.

---

## Stage 1 — Research Intake

**Objective.** Confirm the topic is admissible, current, and correctly prioritized before any investigation begins.

**Inputs.**
- The topic's current position in RESEARCH_QUEUE (Level, dependencies, expected Atlas outputs).
- The current state of the topic's expected Atlas sections (existing entries, if any).
- Confirmation that no other researcher is executing the same topic.

**Outputs.**
- A dated intake record naming the researcher, the topic identifier, and the working question that will be refined in Stage 2.
- A dependency check confirming that the Level-1 or Level-2 topics this investigation depends on have entries in Atlas at a confidence adequate to interpret the investigation.

**Exit criteria.**
- The topic has an assigned queue identifier and a single named researcher.
- Every dependency is either resolved (an Atlas entry exists at the required confidence) or flagged in the intake record as a known limitation of the investigation.
- No parallel execution of the same topic is underway.

---

## Stage 2 — Question Definition

**Objective.** Convert the topic into a single specific question the investigation will answer.

**Inputs.**
- The topic identifier from Stage 1.
- The expected Atlas outputs listed in RESEARCH_QUEUE for the topic.
- Related existing Atlas entries.

**Outputs.**
- A single question statement, written as a question. Not a topic, not a hypothesis, not a research plan.
- A note recording what the question does not ask (the scope's outer boundary).
- The Atlas section (per Atlas Part II) in which the resulting entry will land.

**Exit criteria.**
- The question is answerable with evidence. Questions that cannot be answered with evidence are reframed or referred to the amendment process.
- The question does not presuppose its answer.
- A reader who has never seen the topic can read the question and understand what evidence would resolve it.

---

## Stage 3 — Source Collection

**Objective.** Assemble every admissible source that bears on the question.

**Inputs.**
- The question from Stage 2.
- The evidence hierarchy defined in RESEARCH_METHOD §3.
- Access to primary sources — studies, papers, books, interviews, direct observations, and documented first-person accounts.

**Outputs.**
- A source list. Each source is recorded with a permanent identifier, the publication or observation date, and a summary of the source's method.
- A separate list of sources considered and rejected, with the reason for rejection cited to RESEARCH_METHOD §3 or to the First Principles in §2.

**Exit criteria.**
- Every admissible source known to the researcher at the time is included.
- No source enters the workflow without a documented method.
- Rejected sources are recorded so a later reviewer can reproduce the rejection.

---

## Stage 4 — Evidence Extraction

**Objective.** Extract the specific claims each source makes that bear on the question.

**Inputs.**
- The source list from Stage 3.
- The question from Stage 2.

**Outputs.**
- Per source, a set of extracted claims. Each extracted claim carries the source identifier, the page or section reference, the claim as written in the source, and the researcher's paraphrase of the claim.
- A tier label per extracted claim (E1 through E5, per RESEARCH_METHOD §3), assigned on the basis of the source's documented method.
- A cross-reference from each extracted claim to the specific portion of the question it bears on.

**Exit criteria.**
- Every extracted claim is traceable to a specific location in a specific source.
- The tier label is defensible by reference to the source's documented method.
- No paraphrase departs from what the source states without a note recording the departure.

---

## Stage 5 — Contradiction Analysis

**Objective.** Search actively for evidence that contradicts the extracted claims. This stage is mandatory and cannot be skipped.

**Inputs.**
- The extracted claim set from Stage 4.
- The existing Atlas entries related to the question.
- Sources actively sought for their potential to contradict.

**Outputs.**
- A contradiction record listing every direct disagreement found between extracted claims, between extracted claims and existing Atlas entries, and between extracted claims and dissenting sources.
- Each contradiction cross-referenced to the specific claims that disagree.
- A note recording the tier and provenance of each side of each contradiction.

**Exit criteria.**
- The researcher has actively searched for dissenting sources, not only accepted the sources that agree with the initial claim set.
- Every contradiction found is recorded. No contradiction is dropped.
- Where no contradiction is found, the record explicitly states "No contradiction found at time of investigation," so future reviewers know the search was performed.

---

## Stage 6 — Mechanism Analysis

**Objective.** Assess whether the evidence explains why the phenomenon occurs, or only that it occurs.

**Inputs.**
- The extracted claim set from Stage 4.
- The contradiction record from Stage 5.

**Outputs.**
- A mechanism assessment per claim: mechanistic, correlational, or unknown-mechanism.
- A brief statement of the proposed mechanism where one exists, with references to the sources that establish it.
- A flag on claims that are correlational in the source but treated as mechanistic in the surrounding literature, and a flag on claims that are mechanistic in the source but not yet independently reproduced.

**Exit criteria.**
- Every claim carries a mechanism label.
- Mechanism labels are defensible by reference to source content.
- Correlational claims are not carried forward as mechanistic in later stages.

---

## Stage 7 — Confidence Assessment

**Objective.** Assign a confidence label to the composite answer the investigation produces.

**Inputs.**
- The extracted claim set and tier labels from Stage 4.
- The contradiction record from Stage 5.
- The mechanism assessment from Stage 6.

**Outputs.**
- A composite confidence label per the framework in RESEARCH_METHOD §5 (C1, C2, C3, C4, C5, Unknown, or Insufficient).
- A rationale connecting the tier distribution, the contradiction state, and the mechanism assessment to the assigned label.
- Where the composite is Unknown or Insufficient, an explicit statement of what evidence would move the answer to a decidable state.

**Exit criteria.**
- The confidence label is defensible by reference to the inputs.
- The label is not inflated by the researcher's investment in the topic.
- Unknown and Insufficient are treated as valid outcomes and recorded in full when they apply.

---

## Stage 8 — Atlas Entry Creation

**Objective.** Produce the Atlas entry that will be admitted to Atlas.

**Inputs.**
- The outputs of Stages 2 through 7.

**Outputs.**
- A draft Atlas entry containing every field defined in RESEARCH_METHOD §7: identifier, date, author, question, claim, source, method, evidence tier, confidence label, rationale, contradictions, open questions, supersession status, and method version.
- Cross-references to related Atlas entries created or affected by this investigation — Open Questions opened, prior entries superseded, prior entries contradicted.

**Exit criteria.**
- Every field defined in RESEARCH_METHOD §7 is populated.
- The draft entry is internally consistent: the claim matches the evidence, the confidence label matches the assessment, the contradictions match the record from Stage 5.
- The entry is written so a future reader who has never followed the investigation can retrieve the reasoning end-to-end from the entry alone.

---

## Stage 9 — Peer Review

**Objective.** Confirm the entry meets the standards defined in RESEARCH_METHOD before admission to Atlas.

**Inputs.**
- The draft entry from Stage 8.
- The workflow record from Stages 1 through 8.
- A reviewer independent of the researcher who authored the entry.

**Outputs.**
- A review record documenting the reviewer, the review date, and each field of the entry checked against RESEARCH_METHOD.
- Either an admission approval or a return to a specific prior stage with the reason for return recorded.

**Exit criteria.**
- The reviewer is independent of the authoring researcher.
- Every field is checked against the standard.
- A return to a prior stage identifies the specific stage and the specific deficiency; the researcher completes that stage and returns to Stage 9.
- Approval is dated and named. Approval admits the entry to Atlas.

---

## Stage 10 — Amendment Trigger

**Objective.** Determine whether the newly-admitted Atlas entry meets the surfacing threshold defined in RESEARCH_METHOD §6, and if so, deliver the surfacing to the Company Reference custodian.

**Inputs.**
- The admitted Atlas entry.
- The Company Reference sections the entry potentially bears on.
- The surfacing threshold defined in RESEARCH_METHOD §6.

**Outputs.**
- One of the following, recorded in the workflow log:
  - **No surfacing required.** The entry remains in Atlas without a Company Reference amendment request.
  - **Surfacing.** A surfacing record citing the Atlas entry identifier, naming the Company Reference sections the entry bears on, and stating the reason surfacing was warranted per RESEARCH_METHOD §6.

**Exit criteria.**
- The threshold check is documented against the criteria in RESEARCH_METHOD §6.
- No amendment is executed by this workflow. The Company Reference amendment process is a separate procedure that the surfacing can trigger.
- The workflow log records that the topic's execution has completed.

---

## Workflow Completion

After Stage 10 records its output, the workflow for this topic is complete. The researcher closes the workflow log and returns to RESEARCH_QUEUE to select the next topic. The next topic does not open until the closing record is filed.
