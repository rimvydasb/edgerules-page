# Decision Layers Reference

An EdgeRules model separates decision logic into five layers. Each layer has its own keyword set and its own dependency
rules, and maps to an element of the DMN decision requirements graph (DRG).

| Layer     | Declaration                           | Purpose                                                           | Closest DMN element                                      |
|-----------|---------------------------------------|-------------------------------------------------------------------|----------------------------------------------------------|
| Structure | `type`, `owner`                       | Domain object model and relations between object types            | Item definition. A typed service parameter is Input Data |
| Facts     | `facts`                               | Derived fields of a structure type                                | No direct element. Shown in the Input Data node          |
| Decisions | `decision`                            | Decision for one decision context instance                        | Decision                                                 |
| Knowledge | `func`, `ruleset`, `loop`, `optimise` | Reusable, parameterized logic that facts and decisions can invoke | Business Knowledge Model (BKM)                           |
| Service   | `service`                             | External entry point and output contract                          | Decision Service                                         |

## `facts` extends a structure type with derived fields

A `facts` declaration adds derived fields to the structure type of its one parameter. A consumer reads a facts field
with the same path as a structure field. Treat `facts` as type decorator that augments type with additional expressions.

In the example below, `Person` has the `owner` field `application` - this allows bidirectional relationship that allows
defining much more sophisticated facts about the whole input data. Engine fills `owner` field when it builds
bidirectional graph.

```edgerules
{
    type Application: { submitDate: <date>; person: <Person> }
    type Person: { owner application: <Application>; birthDate: <date>; income: <number> }

    facts PersonFacts(person: Person): {
        age: calendarDiff(person.birthDate, person.application.submitDate).years
        monthlyIncome: person.income / 12
    }

    application: {
        submitDate: date('2026-11-02')
        person: { birthDate: date('1990-04-12'), income: 24000 }
    } as Application
    
    age: application.person.age
    monthlyIncome: application.person.monthlyIncome
}
```

**output:**

```json
{
  "application": {
    "submitDate": "2026-11-02",
    "person": {
      "birthDate": "1990-04-12",
      "income": 24000,
      "age": 36,
      "monthlyIncome": 2000
    }
  },
  "age": 36,
  "monthlyIncome": 2000
}
```

## `decision` computes outcomes for one decision context

A `decision` declaration has one typed parameter, the decision context. `person.PersonEligibility` reads the decision
result of the `person` instance.

```edgerules
{
    type Person: { age: <number>; income: <number> }

    facts PersonFacts(person: Person): {
        adult: person.age >= 18
    }

    decision PersonEligibility(person: Person): {
        approved: person.adult and person.income > 1000
    }

    person: { age: 30, income: 2000 } as Person
    approved: person.PersonEligibility.approved
}
```

**output:**

```json
{
  "person": {
    "age": 30,
    "income": 2000,
    "adult": true
  },
  "approved": true
}
```

## Decision Invocation

1. Standard idiomatic execution is via type instance such as `person.PersonEligibility` - the invocation happens once
   decision is accessed during runtime, results are remembered.
2. Decision can be executed as a simple stand-alone function, usually during testing or development such as
   `PersonEligibility({...})`

```edgerules
{
    type Person: { age: <number>; income: <number> }

    facts PersonFacts(person: Person): {
        adult: person.age >= 18
    }

    decision PersonEligibility(person: Person): {
        approved: person.adult and person.income > 1000
    }

    approvedCase: PersonEligibility({ adult: true, income: 2000 }).approved
    minorCase: PersonEligibility({ adult: false, income: 2000 }).approved
    lowIncomeCase: PersonEligibility({ adult: true, income: 500 }).approved
}
```

**output:**

```json
{
  "approvedCase": true,
  "minorCase": false,
  "lowIncomeCase": false
}
```

## `service` is the external contract

A `service` is the declaration that a production host invokes. A `service` parameter MUST have a type: `E358`.

The complete loan example below computes the eligibility of an application with one or more applicants.

```edgerules
{
    // structure layer
    type CreditLine: {
        monthlyPayment: <number, min: 0>
    }

    type Applicant: {
        owner application: <Application>
        birthDate: <date>
        income: <number, min: 0>
        creditLines: <CreditLine[]>
    }

    type Application: {
        applicationDate: <date>
        applicants: <Applicant[]>
    }

    // facts layer
    facts ApplicantFacts(applicant: Applicant): {
        valid: inputValidation(applicant).isValid
        age: calendarDiff(applicant.birthDate, applicant.application.applicationDate).years
        dti: sum(for line in applicant.creditLines return line.monthlyPayment) / applicant.income
    }

    facts ApplicationFacts(application: Application): {
        applicantCount: count(application.applicants)
    }

    // decisions layer
    decision ApplicantEligibility(applicant: Applicant): {
        eligible: applicant.valid and eligibilityRuleset(applicant).isEligible
    }

    decision ApplicationEligibility(application: Application): {
        allEligible: all(for applicant in application.applicants return applicant.ApplicantEligibility.eligible)
        eligible: application.applicantCount > 0 and allEligible
    }

    // knowledge layer
    func inputValidation(applicant: Applicant): {
        isValid: applicant.income >= 0 and applicant.birthDate <= applicant.application.applicationDate
    }

    func eligibilityRuleset(applicant: Applicant): {
        isEligible: applicant.age >= 18 and applicant.dti <= 0.4
    }

    // service layer
    service applicationEligibility(application: Application): {
        return: {
            eligible: application.ApplicationEligibility.eligible
        }
    }

    exampleOutput: applicationEligibility({
        applicationDate: date("2026-11-02");
        applicants: [
            {birthDate: date("1990-04-12"); income: 3000; creditLines: [{monthlyPayment: 500}]};
            {birthDate: date("1985-01-30"); income: 5000; creditLines: [{monthlyPayment: 800}]}
        ]
    })
}
```

The host invokes `applicationEligibility` with this input:

```json
{
  "application": {
    "applicationDate": "2026-11-02",
    "applicants": [
      {
        "birthDate": "1990-04-12",
        "income": 3000,
        "creditLines": [
          {
            "monthlyPayment": 500
          }
        ]
      },
      {
        "birthDate": "1985-01-30",
        "income": 5000,
        "creditLines": []
      }
    ]
  }
}
```

The service returns this result:

```json
{
  "eligible": true
}
```

- The engine fills the `application` field of each applicant from the parent `applicants` list.
- `inputValidation` reads structure fields only. The `valid` facts field calls it.
- `eligibilityRuleset` reads the facts fields `age` and `dti`. The `ApplicantEligibility` decision calls it.

## Layer errors use the codes E350 to E360

| Code   | Condition                                                              |
|--------|------------------------------------------------------------------------|
| `E350` | A `facts` or `decision` declaration does not have one parameter        |
| `E351` | A `facts` or `decision` parameter has no type                          |
| `E352` | A `facts` or `decision` parameter type is not a record `type`          |
| `E353` | A member name repeats for one structure type                           |
| `E354` | A `facts` or `decision` body has a `return` field, or is an expression |
| `E355` | A read of a decision result in a `facts` or knowledge body             |
| `E356` | The `owner` parent type has no field of the child type                 |
| `E357` | More than one type has a field of the child type                       |
| `E358` | A `service` parameter has no type                                      |
| `E359` | The `facts` declaration is not in the context of its `type`            |
| `E360` | A structure type has more than one `facts` declaration                 |
