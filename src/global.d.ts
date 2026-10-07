declare global {
  interface DecisionServiceWASMInstance {
    execute(method: string, args?: string | null): string
    to_portable(): string
    free(): void
  }

  interface DecisionServiceWASMStatic {
    from_code(code: string): DecisionServiceWASMInstance
    from_portable(json: string): DecisionServiceWASMInstance
  }

  interface EdgeRulesMod {
    ready: Promise<boolean>
    DecisionServiceWASM: DecisionServiceWASMStatic
  }

  interface Window {
    __edgeRules?: EdgeRulesMod
  }
}

export {}
