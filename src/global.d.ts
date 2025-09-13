declare global {
  interface EdgeRulesMod {
    ready: Promise<boolean>
    evaluate_all: (input: string) => string
    evaluate_expression: (expr: string) => string
  }

  interface Window {
    __edgeRules?: EdgeRulesMod
  }
}

export {}
