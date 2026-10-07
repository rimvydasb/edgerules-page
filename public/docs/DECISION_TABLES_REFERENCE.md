# Decision Tables Reference

A decision table maps a set of named inputs to a result by scanning ordered rule rows. The **hit policy is the
construct's name** — there is no `hitPolicy` attribute — so the semantics and the result type are visible at a glance,
to humans, LLMs, and the linker alike:

| Construct             | Semantics                                           | Result type            |
|-----------------------|-----------------------------------------------------|------------------------|
| `firstMatch({…})`     | first matching rule wins (rows ordered)             | `R` (the `then` shape) |
| `uniqueMatch({…})`    | exactly one rule may match; two matches → `Invalid` | `R`                    |
| `collectMatches({…})` | all matching rules, in row order                    | `R[]`                  |
| `bestMatch({…})`      | highest explicit `priority` among matches wins      | `R`                    |

## firstMatch

```edgerules
{
    applicant: { age: 23, income: 25000, segment: "retail" }

    risk: firstMatch({
        inputs: {
            age: applicant.age
            income: applicant.income
            segment: applicant.segment
        }
        rules: [
            { when: { age: 18..25, income: < 30000, segment: "retail" }, then: { level: "high",   limit: 1000 } }
            { when: { age: 18..25, income: >= 30000 },                   then: { level: "medium", limit: 5000 } }
            { when: { segment: "premium" },                              then: { level: "low",    limit: 20000 } }
        ]
        default: { level: "none", limit: 0 }
    })

    decision: risk.level
}
```

**output:**

```json
{
  "applicant": {
    "age": 23,
    "income": 25000,
    "segment": "retail"
  },
  "risk": {
    "level": "high",
    "limit": 1000
  },
  "decision": "high"
}
```

## Cells Are Unary Tests

Every `when` cell is a [unary test](../architecture/EBNF.md#unary-tests) over the named input — parsed, typed AST, not
a string. Conditions are **named, not positional**: each key in `when` refers to an input, and an omitted key means
"any".

| Cell                     | Meaning                                              |
|--------------------------|------------------------------------------------------|
| `age: any`               | always matches (same as omitting the cell)           |
| `age: 21`                | equality with the input                              |
| `income: < 30000`        | comparison (`>`, `>=`, `<`, `<=`, `!=` likewise)     |
| `age: 18..25`            | inclusive range membership                           |
| `segment: in ["a", "b"]` | membership in a value list                           |
| `segment: not("x")`      | negation of any test                                 |
| `age: >= 18 and <= 64`   | conjunction / disjunction of tests                   |
| `age: isAdult`           | a named unary test (or any 1-param boolean function) |

Named unary tests make table cells reusable vocabulary:

```edgerules
{
    isCore: >= 26 and <= 64
    band: firstMatch({
        inputs: { age: 30 }
        rules: [ { when: { age: isCore }, then: { name: "core" } } ]
        default: { name: "other" }
    })
}
```

## Semantics

1. Each `inputs` expression is evaluated **once** per table evaluation.
2. A rule matches when **all** its `when` cells match (omitted cell = `any`).
3. `firstMatch` / `uniqueMatch` / `bestMatch`: no match → `default` if present, otherwise a typed `Missing` with origin
   `no rule matched in '<field>'`. `collectMatches`: no match → empty list (`default` is not allowed there).
4. `bestMatch` rules carry an explicit integer `priority` field; rows are order-independent.
5. A `Missing`/`Invalid` input value fails every comparison cell but still matches `any` — tables degrade gracefully,
   and `default` keeps them total.

## Link-Time Checks

The linker validates the whole table before anything runs:

- every `when` key must name a declared input;
- every cell test is type-checked against its input expression's type (`segment: > 5` on a string input is a link
  error);
- all `then` results and the `default` must share one record shape, which becomes the static result type;
- `default` is rejected in `collectMatches`;
- `priority` is required on every `bestMatch` rule and rejected in the other policies;
- `rules` must be an inline literal list (v1).

## The Transparent Alternative: Plain Rulesets

Decision tables earn their keep when conditions form a **matrix over shared inputs**. For flat checklists, prefer plain
data — the result structure is self-evident with nothing to guess:

```edgerules
{
    checks: [
        { name: "age",     passed: applicant.age >= 18 }
        { name: "income",  passed: applicant.income >= 1000 }
        { name: "history", passed: applicant.defaults = 0 }
    ]
    failed: for check in checks[passed = false] return check.name
    status: if count(failed) = 0 then "ELIGIBLE" else "INELIGIBLE"
}
```

The two compose: a table's `inputs` can include a ruleset's `status`.
