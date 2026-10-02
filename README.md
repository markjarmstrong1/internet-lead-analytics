# Internet Lead Analytics

Internet Lead Analytics is a dealership analytics system built to answer business questions about what happens to Internet leads from the moment they enter the dealership's system through engagement, follow-up, appointments, and outcomes.

The system is designed around evidence rather than assumptions.

## Governing Principle

> **Do not build features merely because they sound useful. Build the ability to reliably answer a business question.**

The system follows:

**Capture evidence → normalize it → analyze it → report what happened.**

Every substantial feature should exist because it helps answer a defined business question.

## Analytical Hierarchy

```text
Business Question
        ↓
Answer / Report
        ↓
Metric
        ↓
Observed Behavior
        ↓
Canonical Event
        ↓
Source Evidence
```

Analytical conclusions should be traceable back through this chain.

## Evidence Rules

### Evidence is not interpretation

Observed source information and the meaning assigned to that information are separate concepts.

The system must preserve original evidence while allowing normalized classifications and interpretations to evolve.

### Tasks are not proof of actions

A CRM task represents workflow activity.

A completed task does not automatically prove that the requested action occurred.

Actual action evidence should come from observed events such as an outbound email, text, call, or other qualifying communication.

### Status is not customer behavior

CRM status and process status are system classifications.

A status should not automatically be treated as evidence that the customer engaged, responded, visited, or purchased.

### Missing evidence is not zero

The system must distinguish between:

* confirmed zero activity
* unknown activity
* missing evidence
* unresolved evidence

The absence of evidence must not be converted into a false zero.

### Inference requires a rule

When the system derives a meaning that was not explicitly stated by the source, the rule used to make that inference must be defined and documented.

### Association is not causation

The system may identify relationships and patterns in observed data.

An association between an action and an outcome must not be presented as proof that the action caused the outcome unless the analytical methodology genuinely supports a causal conclusion.

### Evidence remains traceable

Important metrics and management-facing conclusions should be traceable to the events and source evidence supporting them.

Source evidence must not be silently rewritten by interpretation or classification.

### Insufficient evidence must remain visible

If the available evidence cannot reliably answer a business question, the system should state that limitation rather than manufacture certainty.

When evidence or identity is insufficient, the next feature should improve the evidence layer rather than build a report on top of an unreliable foundation.

## Canonical Data Model

The primary analytical model is based on timeline evidence.

```text
Timeline Record
(customer / opportunity context)
        │
        │ 1
        │
        │ *
Timeline Event
        │
        ├── occurred_at
        ├── raw_type
        ├── actor
        ├── category
        ├── channel
        ├── direction
        └── details / raw data
        │
        ↓
Evidence / Correlation
        │
        └── Task and workflow evidence
```

The canonical timeline is the foundation for understanding what happened.

Tasks remain important workflow evidence, but they are not the canonical representation of customer or dealership actions when stronger timeline evidence exists.

## Data Integrity

The system is designed to synchronize data safely rather than simply import files.

Synchronization must distinguish between:

* **New** — data that does not yet exist
* **Updated** — existing data with changed information
* **Unchanged** — existing data that matches the canonical representation
* **Invalid** — data that cannot safely be accepted

Imports should be idempotent.

Repeated synchronization of unchanged source data must not create unintended duplicates or changes.

Identity must be based on authoritative source identifiers whenever available.

Fixture filenames and other convenient labels must not be treated as canonical customer identity.

## Analytics Principles

Metrics must have clearly defined inputs and rules.

Where applicable, a metric should identify:

* population
* numerator
* denominator
* time window
* qualifying events
* classification
* limitations
* supporting evidence

The system distinguishes between:

* **Descriptive** — what happened
* **Associational** — relationships or patterns in what happened
* **Causal** — evidence supporting a cause-and-effect relationship

The system should default to descriptive and associational analysis unless the methodology supports causal inference.

## Product Direction

The long-term goal is to move beyond activity counts and reliably answer questions such as:

* What happened to each Internet lead?
* What actions did we actually take?
* How did the customer respond?
* Where are leads dropping out of the process?
* Which outreach methods are associated with different outcomes?
* Which processes are associated with appointments or sales?
* Where are opportunities being lost?
* Where are we spending effort without observable customer response?

The north-star analytical question is:

> **Show me which actions are associated with better outcomes.**

That question must be answered through evidence, not assumptions.

## Development Order

Development should proceed in this order:

```text
Structure
    ↓
Visual Language
    ↓
Component Behavior
    ↓
Real Data Wiring
    ↓
Real Analytics
    ↓
Reports / Advanced Analysis
```

Do not rush downstream functionality while upstream structure, evidence, or identity remains unreliable.

## Visual and Analytical Language

The project maintains a separate vocabulary library defining the meaning of important analytical and product terms.

Core distinctions include:

* observed vs interpreted
* calculated vs estimated
* known vs unknown
* zero vs missing evidence
* workflow activity vs action evidence
* employee activity vs automation
* status vs customer behavior
* association vs causation

These distinctions should remain consistent throughout the application.

## Trust Model

The system should make it possible for a user to move from a high-level conclusion down to the evidence supporting it.

```text
Business Question
        ↓
Analytical Answer
        ↓
Metric
        ↓
Observed Behavior
        ↓
Canonical Event
        ↓
Source Evidence
```

If the evidence cannot support the conclusion, the system should say so.

The purpose of Internet Lead Analytics is not to make the data look complete.

The purpose is to make the truth of what happened easier to understand.
