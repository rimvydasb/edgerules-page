declare global {
  interface EdgeRulesMod {
    ready: Promise<boolean>
    init_panic_hook: () => void
    DecisionEngine: {
      evaluate: (input: string | object, field?: string | null) => unknown
    }
  }

  interface Window {
    __edgeRules?: EdgeRulesMod
  }
}

export {}
