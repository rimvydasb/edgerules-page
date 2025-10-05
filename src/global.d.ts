declare global {
  interface EdgeRulesMod {
    ready: Promise<boolean>
    evaluate_all: (input: string) => unknown
    evaluate_expression: (expr: string) => unknown
  }

  interface Window {
    __edgeRules?: EdgeRulesMod
  }
}

export {}
