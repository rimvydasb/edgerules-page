# Optimise Reference

`optimise` is the fourth knowledge metaphor after `func`, `ruleset`, and `loop`: a named, callable **linear optimisation
problem**. Rules compute the coefficients and gates; the solver picks the best feasible values for the declared decision
variables.

## Element syntax

```edgerules
{
    optimise factoryProduction(workers: number, sticks: number, plates: number): {
        using: "highs"                     // optional; data, link-checked like hitPolicy ("highs" is v1's only value)
        bottlenecks: true                  // optional, default false; adds bottleneck values at the cost of one
                                           // extra background solver call
        variables: {
            chairs: <number, integer: true, min: 0>
            tables: <number, integer: true, min: 0>
        }
        maximise: 15 * chairs + 40 * tables
        constraints: {
            workerCapacity: 1 * chairs + 3 * tables <= workers
            stickSupply:   4 * chairs + 4 * tables <= sticks
            plateSupply:   1 * chairs + 2 * tables <= plates
        }
        timeLimit: 1000                    // optional; milliseconds, passed through to the solver's own time limit
    }

    plan: factoryProduction(workers: 8, sticks: 40, plates: 12)
    workerWorth: plan.bottlenecks.workerCapacity
}
```

Section rules:

- **`variables` (required).** Each cell declares a decision variable as a Typed Input Wrapper — `min`, `max`, and
  `integer` are ordinary wrapper keys usable on any typed input. The base type is always `number` (integrality
  constrains a value, it does not introduce a type). **An omitted `min`/`max` means unbounded in that direction** —
  never a silent `min: 0`.
- **Indexed variables.** `<number[], ..., over: clients>` declares one decision variable per element of the list
  parameter `clients` — see "Indexed variables and constraint families" below.
- **`maximise` xor `minimise` (exactly one, required).** One section carries both the direction and the objective
  expression.
- **`constraints` (optional).** A named record of comparison expressions; the names are the audit surface — bottleneck
  values and (W3) infeasibility explanations report per named constraint. Only `<=`, `>=`, and `=` are allowed; strict
  `<` / `>` are a link error (E337 — LP has no strict inequalities, and silently relaxing them would be a lie).
  A constraint `for i in S return <comparison>` is a **family** of rows — see below.
- **`using` (optional).** Data, not a keyword; an unknown solver name is a link error (E333). `"highs"` is the only v1
  value.
- **`bottlenecks` (optional, boolean literal, default `false`).** Opt-in dual values — see below.
- **`timeLimit` (optional, positive integer literal, milliseconds).** A passthrough of the solver's own optional time
  limit — _not_ an engine guarantee. On exhaustion the solver returns its best-known feasible solution
  (`status: "feasible"`); a runaway solve without a limit is the host's orchestration problem.

`optimise` declares only at the model root (like `external func`); a nested declaration is a parse error. Calling the
element from any context is unrestricted. Parameters must be typed (E331); they are in scope by name inside the body,
which is otherwise a closed membrane — enclosing values must be passed as parameters (E101).

## Indexed variables and constraint families

When the candidates come from data, the model cannot name one variable per candidate.

- `<number[], ..., over: clients>` declares one decision variable per element of the list parameter `clients`, whatever
  its element type (`Client[]`, `number[]`). `min`, `max`, and `integer` apply to each element. Read one element as
  `call[i]`, sum them as `sum(for c in call return 30 * c)`, and use `count(clients)` for the length. One call site has
  at most 4,096 decision variables, counting every element.
- A constraint `for i in S return <comparison>` over a list `S` without decision variables is a **family**: one row
  per element, named `callAllowed[0]`, `callAllowed[1]`, … in diagnostics.
- A row without decision variables (a family element over a group with no candidates) is decided by the engine and
  never reaches the solver. A row that holds (`0 <= 1`) has the bottleneck value 0. A false row (`0 >= 1`) makes the
  result `"infeasible"` without a solver call; the E340 origin names the row.

```edgerules
{
    type Client: { name: <string> }

    optimise outreach(clients: Client[], callOk: number[], callValue: number[], teamMinutes: number): {
        variables: {
            call: <number[], integer: true, min: 0, max: 1, over: clients>
        }
        maximise: sum(for i in 0..(count(clients) - 1) return callValue[i] * call[i])
        constraints: {
            callAllowed: for i in 0..(count(clients) - 1) return call[i] <= callOk[i]
            time:        sum(for c in call return 30 * c) <= teamMinutes
        }
    }

    plan: outreach(
        clients: [{ name: "Ann" }, { name: "Ben" }, { name: "Cid" }],
        callOk: [1, 0, 1],
        callValue: [50, 80, 30],
        teamMinutes: 60
    )
    summary: {
        status: plan.status
        objective: plan.objective
        call: plan.call
    }
}
```

**output (`summary`):**

```json
{
  "status": "optimal",
  "objective": 80,
  "call": [1, 0, 1]
}
```

## Result type

Every `optimise` element gets a linker-synthesized result record: `status`, `objective`, one field per declared decision
variable (an indexed variable is a `number[]` in the order of its `over` list), `bottlenecks` with one field per named
constraint (a family is a `number[]`, one value per row), `solver`, and `notes`.

Status semantics:

- `"optimal"` — proven optimum; `objective` and the variable fields carry the verified solution.
- `"feasible"` — a best-known solution (e.g. `timeLimit` exhausted mid-search); values present, optimality unproven.
- `"infeasible"` / `"unbounded"` — no solution; `objective`, the variable fields, and the `bottlenecks` fields are
  `Missing`, and their origin is the E340/E341/E342 diagnosis below. Downstream rules branch on `status` without special
  cases.

Without a solution an indexed variable field is `Missing(number[])`. An empty `over` list gives the field `[]`, and an
empty family gives its bottleneck field `[]`.

`integer: true` variables are rounded to the nearest integer within tolerance (the 7.9999999-chairs guard) and
re-verified after rounding; a genuinely fractional value is a verification failure, never silently rounded.

### `solver` and `notes` — the explain surface

The record is the API; these two fields are what a naive reading of the numbers would get wrong.

- **`solver`** is the solving component's name and version _as the host registered it_
  (`registerSolver(handler, {name: 'highs-js', version: '1.15.1'})`). It is audit metadata: a solver version change can
  flip which of several tied optimal plans comes back, so a decision record that keeps the objective without the solver
  identity is not reproducible. `Missing` when the host registered no identity — never a reason to fail a decision.
- **`notes`** is a list of plain sentences describing what this particular outcome does and does not guarantee: the
  verification scope (feasibility and the objective are re-checked within tolerance; optimality is not), whether the
  solution is proven or merely best-known, the multiple-optima caveat, and — when bottleneck values are present — the
  degeneracy and MILP-locality caveats. It is an ordinary list, so a model can log it, return it, or branch on it.

Both are ordinary result fields, so `status`, `solver`, and `notes` are reserved names: a decision variable may not be
called any of them (E335).

## Infeasibility diagnostics

"Infeasible" means "your constraints contradict each other" — true, and useless on its own. When a solve comes back
infeasible the solving side runs a second, automatic solve of the **elastic relaxation**: every named constraint gains a
non-negative slack variable, the objective becomes "minimize total slack", and the answer says which rows had to give
and by how much. The engine turns that into one sentence, carried as the `origin` of every `Missing` field in the
result:

```json
{
  "why": "E340: optimise 'sourcing' is infeasible — the constraints contradict each other; the smallest fix relaxes 'demandMet' by 150 (= 250)"
}
```

Read it with `explain()`:

```edgerules
{
    optimise sourcing(units: number): {
        variables: {
            local: <number, min: 0, max: 60>
            imported: <number, min: 0, max: 40>
        }
        minimise: 3 * local + 5 * imported
        constraints: {
            demandMet: local + imported >= units
        }
    }

    split: sourcing(units: 250)
    why: explain(split.objective).origin
}
```

**output (`why`):**

```json
"E340: optimise 'sourcing' is infeasible — the constraints contradict each other; the smallest fix relaxes 'demandMet' by 150 (>= 250)"
```

| Code | Meaning                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| E340 | infeasible, with the per-constraint relaxation amounts (up to four named, then "and N more")                  |
| E341 | infeasible, and no diagnosis was available — the solving side ran none, or the diagnostic solve itself failed |
| E342 | unbounded: the objective improves without limit, so a constraint or a variable bound is missing               |

- **Not opt-in.** Unlike `bottlenecks`, the diagnostic costs nothing on the success path — it only ever runs when the
  answer is already "no". A model that never goes infeasible never pays for it.
- **Cost when it does run.** One extra solve, inside the declaration's remaining `timeLimit` budget. If it fails or the
  budget is spent, the result falls back to E341 and the decision still completes.
- **Amounts are in each constraint's own units** and describe the _smallest total_ relaxation, not the only one. Where
  two rows contradict each other on the same expression (`x >= 20` against `x <= 8`), the same total can be split
  between them in several equally optimal ways — the reported split is one of them, the total is the invariant.
- **Integrality is kept**, so the reported amounts are achievable in the model's units ("150 more units", not 149.7).

## The linear wall (E336–E339)

The objective and both sides of every constraint must be **affine** in the decision variables: constants and parameters
may appear anywhere; variables may only be scaled by constants and summed. Violations are rejected when the model links,
with the location and the specific rule named:

| Code | Rule                                                                                                                                         |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| E331 | every parameter must be typed                                                                                                                |
| E332 | template shape (non-root declaration, malformed `variables`/`constraints` records); `<number[]>` without `over:`, `over:` without `<number[]>`, or `over:` not naming a list parameter |
| E333 | unknown `using` solver name                                                                                                                  |
| E334 | `timeLimit` must be a positive integer literal                                                                                               |
| E335 | a variable name collides with a reserved result field (`status`, `objective`, `bottlenecks`, `solver`, `notes`) or a parameter               |
| E336 | not affine: `var * var`, a variable in a divisor, inside a function call, in an `if` condition or a list index, an external/optimise call inside the body, or an unsupported list shape |
| E337 | a constraint is not a `<=`/`>=`/`=` comparison over numbers, or a family that is nested or iterates a list of decision variables              |
| E338 | `min > max` (empty domain)                                                                                                                   |
| E339 | a declared variable is used in neither the objective nor any constraint                                                                      |

Over an indexed variable, only these list shapes are linear: `call[i]` with an index free of decision variables,
`for x in S return <affine>`, `for c in call return <affine>`, and `sum(...)` of either. These give E336 with a
specific hint:

| Shape           | Hint                                                     |
| --------------- | -------------------------------------------------------- |
| `count(call)`   | use `count(<over parameter>)`                            |
| `call[... > 0]` | a predicate filter over decision variables is not affine |
| `max(call)`     | only `sum` is linear over a list of decision variables   |

E340–E342 are **runtime** solver diagnostics, not link errors — see "Infeasibility diagnostics" above. Variable-free
subexpressions (`sqrt(workers)`, an `if` over parameters, any builtin over parameters) are fine anywhere — they fold to
constants before the solve. An `if` whose _condition_ is variable-free may even select between affine branches over
variables.

## Bottleneck values

For every named constraint, `bottlenecks.<name>` reports _how much the objective would improve per unit of relaxing that
constraint's limit_ — the dual value / shadow price. `bottlenecks.workerCapacity = 15` means one more worker adds 15 to
the objective; 0 means the constraint is not (marginally) the bottleneck.

- **Opt-in.** With the `bottlenecks:` flag absent or `false`, the fields are
  `Missing(number, "bottleneck values not requested in '<name>'")` and no dual computation happens anywhere. The result
  _type_ always carries the fields, so flipping the flag never changes a model's shape.
- **Pure LP** — values come free with the main solve. **MILP** (any `integer: true` variable) — the solving side
  performs the industry-standard fixed-integer re-solve (fix integers at their solution values, re-solve as LP, report
  that LP's duals), within the same `timeLimit` budget. If the re-solve fails, the fields are `Missing` while the
  decision still completes.
- **Caveats.** For an all-integer problem the fixed problem prices nothing — every dual is 0 (matching FICO, Gurobi, and
  CPLEX behaviour); meaningful shadow prices need a continuous variable somewhere. Under degeneracy the values are one
  valid pricing, not a unique one; for MILP they are valid locally (integers fixed), not a global sensitivity guarantee.
  These same caveats arrive with the result, in `notes`. Richer what-if analysis is the model author's technique: call
  the element repeatedly with varied inputs and compare objectives.

Both effects are shown against real solver output in [optimise-examples.md](optimise-examples.md) — the all-integer
factory reports zeros, the continuous blending model prices its protein floor at 1.50 per kilogram.

## Exactness caveat

Engine numbers are exact decimals; solvers speak f64. Coefficients cross that boundary once when the `LpProblem` is
built, and results cross back once when the record is produced — verification therefore checks within defined tolerances
(1e-6 feasibility/objective, 1e-5 integer rounding), never exact equality. The _objective value_ of a verified solution
is stable across solver versions; the variable values of a degenerate problem need not be.
