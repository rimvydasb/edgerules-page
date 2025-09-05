import type {BaseExample} from './types'

export const BASE_EXAMPLES: BaseExample[] = [
    {id: 'ex1', title: 'Example 1', description: 'Basic arithmetic', codeExample: '{ value : 10 + 20 }'},
    {id: 'ex2', title: 'Example 2', description: 'Aggregate sum', codeExample: '{ total : sum([1,2,3]) }'},
    {id: 'ex3', title: 'Example 3', description: 'Refs and expressions', codeExample: '{ a : 1; b : a + 2 }'}
]

