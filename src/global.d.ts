declare global {
  interface EdgeRulesMod {
    ready: Promise<boolean>
    to_trace: (input: string) => string
  }

  interface Window {
    __edgeRules?: EdgeRulesMod
  }
}

export {}
