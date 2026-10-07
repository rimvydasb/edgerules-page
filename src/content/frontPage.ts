// Front page content, adapted from the core repo README (up to and including "Built-in Function Library").

export interface Feature {
    glyph: string
    title: string
    text: string
}

export interface DslExample {
    id: string
    tab: string
    text: string
    code: string
    /** Hash of the reference page that covers this topic. */
    reference: { label: string, hash: string }
}

export interface CodeSample {
    id: string
    tab: string
    install?: string
    code: string
}

export interface Package {
    name: string
    text: string
}

export interface BuiltinCategory {
    category: string
    hash: string
    functions: string[]
}

export const HERO_TEXT = 'A lightweight, embeddable, JSON-native business rules engine written in Rust and compiled to '
    + 'WebAssembly. Define, execute, and hot-update decision logic at runtime — in Node.js, the browser, or native Rust '
    + '— without redeploying your application.'

export const HERO_TRAITS: string[] = ['total', 'deterministic', 'strongly typed', 'traceable']

export const FEATURES: Feature[] = [
    {
        glyph: '{ }',
        title: 'Declarative DSL',
        text: 'Express business rules and calculations in a concise, referentially transparent language — '
            + 'no procedural boilerplate.',
    },
    {
        glyph: 'JSON',
        title: 'JSON-native model',
        text: 'Every rule model is a plain JSON object your application can store, version, and transmit '
            + 'without a separate file format.',
    },
    {
        glyph: 'CRUD',
        title: 'Optional Live CRUD',
        text: 'Add, modify, and remove rules at runtime through a structured API; the engine relinks lazily on '
            + 'the next execution.',
    },
    {
        glyph: 'τ',
        title: 'Type-safe',
        text: 'Hindley-Milner-inspired type inference catches mismatches at link time, before any data flows '
            + 'through.',
    },
    {
        glyph: 'wasm',
        title: 'Tiny WASM footprint',
        text: 'Built with opt-level "z", LTO, and wasm-opt -Oz — suitable for serverless cold starts and '
            + 'browser bundles.',
    },
    {
        glyph: '0.3',
        title: 'Exact arithmetic',
        text: 'Financial calculations use rust_decimal, so 0.1 + 0.2 = 0.3. No floating-point surprises.',
    },
]

export const DSL_INTRO = 'EdgeRules is a declarative expression language for decision logic. A model is a nested '
    + 'record of named fields, functions, types, and rulesets. Every example below runs in your browser — edit it.'

export const DSL_EXAMPLES: DslExample[] = [
    {
        id: 'expressions',
        tab: 'Expressions',
        text: 'Fields reference each other by name; the engine resolves the order. Conditionals are expressions too.',
        code: `{
    amount: 800
    salesTax: amount * 0.21
    discount: if amount > 500 then 0.1 else 0
    net: amount - (amount * discount)
}`,
        reference: { label: 'Basics', hash: 'basics' },
    },
    {
        id: 'functions',
        tab: 'Functions',
        text: 'One-line functions or functions with a body context; the `return` field holds the result.',
        code: `{
    func isEligible(age: number, income: number): age >= 18 and income >= 1000

    func classify(score: number): {
        return: if score >= 90 then "A"
           else if score >= 75 then "B"
           else "C"
    }

    eligible: isEligible(25, 2500)
    result: classify(85)
}`,
        reference: { label: 'User Functions', hash: 'user-functions' },
    },
    {
        id: 'types',
        tab: 'Types',
        text: 'Typed records with required fields, defaults, and enumerations — checked at link time.',
        code: `{
    type Customer: {
        name:   <string, required: true>
        age:    <number>
        tier:   <string, default: "STANDARD", enum: ["GOLD", "SILVER", "STANDARD"]>
    }

    func process(c: Customer): c.name + " (" + c.tier + ")"

    label: process({ name: "Ada", age: 36, tier: "GOLD" })
}`,
        reference: { label: 'User Types', hash: 'user-types' },
    },
    {
        id: 'rulesets',
        tab: 'Rulesets',
        text: 'Decision tables with hit policies: first-match, unique-match, collect-matches, best-match.',
        code: `{
    ruleset risk(age: number, income: number): {
        hitPolicy: "first-match"
        rules: [
            { when: { age: 18..25, income: < 30000 }, then: { level: "high",   limit: 1000  } }
            { when: { age: 18..25, income: >= 30000 }, then: { level: "medium", limit: 5000  } }
            { when: { age: > 25 },                     then: { level: "low",    limit: 20000 } }
        ]
        default: { level: "none", limit: 0 }
    }

    decision: risk(age: 23, income: 25000)
}`,
        reference: { label: 'Rulesets', hash: 'rulesets' },
    },
    {
        id: 'lists',
        tab: 'Lists & Ranges',
        text: 'Filter with `...` placeholders, aggregate, and loop over ranges with for-comprehensions.',
        code: `{
    sales:    [10, 20, 8, 7, 1, 10, 6, 78, 0, 8, 0, 8]
    highDays: sales[... > 10]
    total:    sum(sales)
    best3:    max(for m in 0..9 return sales[m] + sales[m+1] + sales[m+2])
}`,
        reference: { label: 'Lists', hash: 'lists' },
    },
    {
        id: 'dates',
        tab: 'Dates & Finance',
        text: 'ISO dates, periods and durations, plus built-in financial functions with exact decimals.',
        code: `{
    maturity:    date("2025-01-01") + period("P1Y")
    monthlyPmt:  round(pmt(0.05 / 12, 360, 200000), 2)
    taxAmount:   netToGross(1000, 0.21) - 1000
}`,
        reference: { label: 'Finance', hash: 'finance' },
    },
]

export const PACKAGES: Package[] = [
    { name: '@edgerules/node', text: 'Decision service for Node.js (ESM, ships prod + dev/mutable builds)' },
    { name: '@edgerules/web', text: 'Decision service for the browser (ESM, ships prod + dev/mutable builds)' },
    { name: '@edgerules/portable', text: 'TypeScript type definitions for the Portable JSON format' },
]

export const QUICK_START: CodeSample[] = [
    {
        id: 'node',
        tab: 'Node.js',
        install: 'npm install @edgerules/node @edgerules/portable',
        code: `import {DecisionService} from '@edgerules/node';

// Create a service from an EdgeRules DSL string
const service = new DecisionService(\`{
    applicant: {
        age:    <number, required: true>
        income: <number, default: 0>
    }
    isEligible: applicant.age >= 18 and applicant.income >= 1000
}\`);

// Execute against a request — inputs are supplied as a model-shaped object
const result = service.execute('*', {applicant: {age: 25, income: 2500}});
// { applicant: { age: 25, income: 2500 }, isEligible: true }`,
    },
    {
        id: 'crud',
        tab: 'Live CRUD',
        install: 'npm install @edgerules/node @edgerules/portable',
        code: `import {MutableDecisionService} from '@edgerules/node/mutable';

const service = new MutableDecisionService(model);

// Update a rule at runtime — no redeploy needed
service.set('applicant.income', {'@kind': 'type', type: 'number', default: 5000});

// Inspect the linked model
const schema = service.get('applicant');

// Read/write the same node as DSL source text instead of Portable JSON
service.getCode('applicant.income'); // '<number, default: 5000>'`,
    },
    {
        id: 'browser',
        tab: 'Browser',
        install: 'npm install @edgerules/web @edgerules/portable',
        code: `import {DecisionService} from '@edgerules/web';

const service = new DecisionService(portableModel);
const result = service.execute('calculateTax', {amount: 100});`,
    },
]

export const PORTABLE_TEXT = 'Every model is a plain JSON object. You can store it in a database, send it over HTTP, '
    + 'and load it back without any special serialization library.'

export const PORTABLE_EXAMPLE = `{
  "@version": "1.0",
  "@model-name": "Credit Risk",
  "applicant": {
    "age": {
      "@kind": "type",
      "type": "number",
      "required": true
    },
    "income": {
      "@kind": "type",
      "type": "number",
      "default": 0
    }
  },
  "isEligible": "applicant.age >= 18 and applicant.income >= 1000"
}`

export const BUILTINS: BuiltinCategory[] = [
    {
        category: 'Numeric',
        hash: 'numbers',
        functions: ['round', 'roundHalfUp', 'floor', 'ceil', 'abs', 'min', 'max', 'toFixed', 'between'],
    },
    {
        category: 'String',
        hash: 'strings',
        functions: ['length', 'trim', 'upper', 'lower', 'contains', 'startsWith', 'endsWith', 'split', 'replace'],
    },
    {
        category: 'List',
        hash: 'lists',
        functions: ['sum', 'count', 'find', 'contains', 'flatten', 'distinct', 'sort', 'zip'],
    },
    {
        category: 'Date / Time',
        hash: 'dates',
        functions: ['date', 'time', 'datetime', 'duration', 'period', 'dayOfWeek', 'daysInMonth', 'calendarDiff'],
    },
    {
        category: 'Finance',
        hash: 'finance',
        functions: [
            'pmt', 'pv', 'fv', 'npv', 'irr', 'nper', 'percentOf', 'percentChange', 'netToGross',
            'amortizationSchedule',
        ],
    },
]
