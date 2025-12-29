declare global {
  interface EdgeRulesMod {
    ready: Promise<boolean>
    evaluateAll: (input: string) => unknown
    evaluateExpression: (expr: string) => unknown
  }

  interface Window {
    __edgeRules?: EdgeRulesMod
  }
}

export {}
