# RESEARCH_QUEUE

## Purpose

RESEARCH_QUEUE defines the permanent research order for Atlas. It groups the topics the company holds itself responsible for investigating into three levels. Each level presumes the level above it: Level 1 topics ground Level 2 topics, which ground Level 3 topics. Investigations begin at Level 1 and proceed downstream, though every topic remains permanently open once entered.

This document does not perform research. It does not record findings. It defines only the order in which Atlas is populated and the shape of the outputs each topic is expected to produce.

Amendment of the level structure, of any topic, of any dependency, or of any expected-output category requires the formal amendment process defined in the Company Reference.

---

## LEVEL 1 — Foundational Human Questions

Level 1 topics investigate the species-level constants that shape every human the company serves. Findings at Level 1 are prerequisites for findings at Level 2 and Level 3. Investigations at Level 2 and Level 3 that lack Level 1 grounding are labeled as such in Atlas.

### 1.1 Human Nature
- **Why:** The company's Purpose rests on assumptions about the human that must be examined at the species level before anything downstream can be interpreted.
- **Dependencies:** None. Foundational.
- **Expected Atlas outputs:** Entries in Atlas §2.1 covering species-level cognitive architecture, drive structure, developmental invariants, and cross-cultural constants.

### 1.2 Motivation
- **Why:** The user acts on internal motivation; understanding what moves a human to act constrains what the company can plausibly build.
- **Dependencies:** Human Nature (1.1).
- **Expected Atlas outputs:** Entries in Atlas §2.2 covering sources of motivation, its structure, its decay, and its interaction with commitment.

### 1.3 Identity
- **Why:** Keeping a promise to oneself is an identity-level act; the company cannot design for self-commitment without understanding identity formation and revision.
- **Dependencies:** Human Nature (1.1), Motivation (1.2).
- **Expected Atlas outputs:** Entries in Atlas §2.3 covering identity formation, identity revision, and the relationship between identity and self-commitment.

### 1.4 Decision Making
- **Why:** Every user act is a decision; the product's role is to reduce decisions, not add them — this requires understanding how decisions are made and unmade.
- **Dependencies:** Human Nature (1.1), Attention (1.5).
- **Expected Atlas outputs:** Entries in Atlas §2.8 covering deliberate vs automatic decision, choice architecture from the human side, decision fatigue, and abandonment.

### 1.5 Attention
- **Why:** The company treats user attention as scarce and precious; understanding attention's structure and limits constrains every interaction decision.
- **Dependencies:** Human Nature (1.1).
- **Expected Atlas outputs:** Entries in Atlas §2.7 covering attention allocation, interruption cost, sustained attention, and recovery from disruption.

### 1.6 Emotion
- **Why:** The user's affective state at the moment of commitment, keeping, breaking, and self-observation shapes every product interaction; emotion cannot be ignored in a self-trust surface.
- **Dependencies:** Human Nature (1.1).
- **Expected Atlas outputs:** Entries in Atlas §2.6 covering the emotions that accompany self-commitment, self-broken commitments, and self-observation.

---

## LEVEL 2 — Transformation Questions

Level 2 topics investigate the processes by which a human changes what they do and who they are over time. Level 2 findings depend on Level 1 grounding.

### 2.1 Self-Trust
- **Why:** Self-Trust is the company's primary metric; the phenomenon at the center of the Purpose must be understood before the product's role in it can be defined.
- **Dependencies:** Identity (1.3), Motivation (1.2), Emotion (1.6), Decision Making (1.4).
- **Expected Atlas outputs:** Entries in Atlas §2.9 covering how self-trust is built, sustained, eroded, and reconstructed; the relationship between self-trust and observable behavior.

### 2.2 Behavior Change
- **Why:** The company's user is often attempting to change what they do; the general mechanism of behavior change constrains what any product can offer.
- **Dependencies:** Motivation (1.2), Decision Making (1.4), Identity (1.3).
- **Expected Atlas outputs:** Entries in Atlas §2.10 covering the process of behavior change, the conditions that accelerate or stall it, and the failure modes of attempted change.

### 2.3 Habits
- **Why:** Repeated behavior is a substantial fraction of what users commit to; how habits form, persist, and dissolve constrains routine design.
- **Dependencies:** Behavior Change (2.2), Decision Making (1.4), Attention (1.5).
- **Expected Atlas outputs:** Entries in Atlas §2.4 covering habit formation, habit disruption, habit-commitment interaction, and habit-context binding.

### 2.4 Addiction
- **Why:** A subset of users pursue commitments to end compulsive behavior; the mechanism of addiction and recovery constrains what the product can offer this cohort.
- **Dependencies:** Habits (2.3), Motivation (1.2), Behavior Change (2.2), Emotion (1.6).
- **Expected Atlas outputs:** Entries in Atlas §2.5 covering addiction mechanisms, recovery patterns, relapse, and the relationship between self-trust and cessation.

### 2.5 Performance
- **Why:** Sustained capacity to act well over time interacts with self-commitment; performance research bears on how commitments and capacity relate.
- **Dependencies:** Behavior Change (2.2), Attention (1.5), Motivation (1.2).
- **Expected Atlas outputs:** Entries in Atlas §2.11 covering sustained performance, capacity limits, and the interaction of commitment with real-world constraints.

### 2.6 Meaning
- **Why:** Users keep commitments they find meaningful and abandon those they do not; the shape of felt meaning constrains what commitments the product can meaningfully hold.
- **Dependencies:** Identity (1.3), Motivation (1.2).
- **Expected Atlas outputs:** Entries in Atlas §2.13 covering the construction of meaning, meaning-commitment interaction, and the loss of meaning over time.

### 2.7 Suffering
- **Why:** The user's pain at self-broken promises, and the potential pain caused by the mechanism that records those breaks, must be understood before any product ships.
- **Dependencies:** Emotion (1.6), Identity (1.3), Self-Trust (2.1).
- **Expected Atlas outputs:** Entries in Atlas §2.14 covering the phenomenology of self-broken promises, shame dynamics, and the risks of a recording surface amplifying user pain.

### 2.8 Flourishing
- **Why:** The company's success is measured against user flourishing over decades; what it is for a human to live well is the far-horizon question that grounds everything downstream.
- **Dependencies:** All Level 2 topics above.
- **Expected Atlas outputs:** Entries in Atlas §2.15 covering the enduring conditions of human flourishing, its measurement, and its relationship to sustained self-trust.

---

## LEVEL 3 — Product Questions

Level 3 topics investigate mechanisms specifically relevant to what the company builds. Level 3 findings depend on Level 1 and Level 2 grounding.

### 3.1 Reflection
- **Why:** Every product from this company includes a reflection surface; the mechanism by which structured reflection interacts with self-trust must be understood.
- **Dependencies:** Self-Trust (2.1), Emotion (1.6), Attention (1.5).
- **Expected Atlas outputs:** Entries in Atlas §2.9 and §2.10 covering the effects of structured reflection on subsequent behavior, the risk of reflection becoming rumination, and the conditions under which reflection helps versus distorts.

### 3.2 Commitments
- **Why:** The unit the company operates on is the user's commitment; the shape, phrasing, and time-frame of commitments interact with the likelihood of keeping them.
- **Dependencies:** Self-Trust (2.1), Motivation (1.2), Identity (1.3).
- **Expected Atlas outputs:** Entries in Atlas §2.9 and §2.10 covering commitment-formulation effects on keeping, the effect of formal declaration, and the failure modes of over-broad or under-specified commitments.

### 3.3 Witness
- **Why:** A product from this company acts as a witness to the user's commitment; the effect of being witnessed — even by an inanimate record — on subsequent conduct must be understood.
- **Dependencies:** Self-Trust (2.1), Emotion (1.6), Commitments (3.2).
- **Expected Atlas outputs:** Entries in Atlas §2.9 and §2.14 covering the psychology of witnessing, the difference between self-witness and other-witness, and the ethical dimensions of a permanent record.

### 3.4 Memory
- **Why:** The product's record is a form of external memory; how the user relates to their own past — accurate, distorted, avoided — constrains how the product renders history.
- **Dependencies:** Identity (1.3), Emotion (1.6), Self-Trust (2.1).
- **Expected Atlas outputs:** Entries in Atlas §2.3 and §2.9 covering autobiographical memory, memory distortion patterns, and the effect of external memory aids on identity.

### 3.5 Ritual
- **Why:** Product interactions of the kind the company builds have ritual properties; understanding ritual's mechanism separates useful ceremony from decorative theatre.
- **Dependencies:** Meaning (2.6), Identity (1.3), Habits (2.3).
- **Expected Atlas outputs:** Entries in Atlas §2.4 and §2.13 covering ritual's psychological function, the difference between ritual and habit, and the failure modes of ritual becoming rote.

### 3.6 Feedback
- **Why:** The product returns the record to the user as feedback; how feedback affects subsequent commitment and conduct constrains what a product can safely surface.
- **Dependencies:** Self-Trust (2.1), Emotion (1.6), Behavior Change (2.2).
- **Expected Atlas outputs:** Entries in Atlas §2.9 and §2.10 covering positive-feedback effects, negative-feedback effects, the timing of feedback, and the failure modes of feedback distorting the recorded behavior.

### 3.7 Recovery
- **Why:** Users who break commitments must have a coherent path back; understanding what supports recovery from self-broken promises is essential to every product's arc design.
- **Dependencies:** Suffering (2.7), Self-Trust (2.1), Addiction (2.4), Emotion (1.6).
- **Expected Atlas outputs:** Entries in Atlas §2.5, §2.9, and §2.14 covering the recovery process, the conditions that support or delay it, and the risk of recovery mechanisms creating dependency.

### 3.8 Accountability
- **Why:** The company positions its products distinct from external-accountability tools; understanding the mechanisms of external, internal, and self-accountability clarifies what the company's mechanism is and is not.
- **Dependencies:** Self-Trust (2.1), Identity (1.3), Motivation (1.2).
- **Expected Atlas outputs:** Entries in Atlas §2.9 covering the taxonomy of accountability mechanisms, the effect of accountability presence on conduct, and the specific role of self-witness within the taxonomy.

### 3.9 Intervention
- **Why:** A product from this company delivers interventions in the form of surfaced prompts; understanding intervention timing, dosage, and effect on the user constrains every scheduling decision.
- **Dependencies:** Attention (1.5), Behavior Change (2.2), Habits (2.3).
- **Expected Atlas outputs:** Entries in Atlas §2.7 and §2.10 covering intervention efficacy, fatigue effects, dosing patterns, and the difference between prompted and unprompted action.

### 3.10 Long-term Adherence
- **Why:** The company measures success at the year-ten horizon; understanding what sustains a user's adherence to a self-selected practice over decades is the terminal product question.
- **Dependencies:** All Level 2 topics — Self-Trust (2.1), Meaning (2.6), Flourishing (2.8) especially.
- **Expected Atlas outputs:** Entries in Atlas §2.9, §2.10, §2.13, and §2.15 covering adherence over decades, the failure modes of long-term practice, and the interactions between adherence, meaning, and flourishing.

---

## Governing Rules

- Level order is normative: Level N must have sufficient grounding before Level N+1 investigations can be interpreted at full confidence.
- Dependencies within a level indicate prerequisite investigation, not strict serial ordering.
- Every topic remains permanently open — Atlas entries continue to accumulate past the first investigation of any topic.
- No topic is closed by achieving a finding. Topics are removed from this queue only through the formal amendment process, and only when the company has decided the topic is no longer within its scope of responsibility.
- Adding a new topic to any level requires the formal amendment process.
- The expected Atlas outputs listed per topic are the categories of entry the topic produces; they are not exhaustive lists of entries to be created.
