export type BaseExample = {
    id: string
    title: string
    description: string
    initial: string
}

export type Example = BaseExample & {
    input: string
    output: string
    error: string | null
}

