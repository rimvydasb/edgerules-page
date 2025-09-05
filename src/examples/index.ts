import type { BaseExample } from './types'

export const BASE_EXAMPLES: BaseExample[] = [
    {
        id: 'numbers-arithmetic',
        title: 'Number · Arithmetic',
        description: 'Integers and reals with +, -, *, /, ^ and unary -.',
        codeExample: `{
    summing      : 4 + 1.2
    subtracting  : 12 - 3
    product      : 6 * 7
    division     : 10 / 4
    power        : 2 ^ 8
    negate       : -(5 + 1)
}`
    },
    {
        id: 'numbers-comparisons',
        title: 'Number · Comparisons',
        description: 'Numeric comparisons: <, <=, >, >=, =, <>.',
        codeExample: `{
    lt           : 1 < 2
    le           : 2 <= 2
    gt           : 3 > 1
    ge           : 4 >= 4
    eq           : 5 = 5
    ne           : 6 <> 7
}`
    },
    {
        id: 'boolean-basics',
        title: 'Boolean',
        description: 'Booleans true/false and logical operators not/and/or/xor.',
        codeExample: `{
    a            : true
    b            : false
    allTrue      : a and not b
    anyTrue      : a or b
    justOne      : a xor b
    negateComp   : not (3 = 4)
}`
    },
    {
        id: 'string-basics',
        title: 'String',
        description: 'Single or double quotes. Compare with = and <>.',
        codeExample: `{
    a            : 'hello'
    b            : "hello"
    equal        : a = b
    notEqual     : 'A' <> 'B'
}`
    },
    {
        id: 'list-basics',
        title: 'List',
        description: 'Indexing, filtering, and numeric built-ins sum/max/count; find returns index or Missing.',
        codeExample: `{
    nums         : [1, 5, 12, 7]
    first        : nums[0]
    filtered     : nums[... > 6]
    sumAll       : sum(nums)
    maxAll       : max(nums)
    countAll     : count(nums)
    idxOf7       : find(nums, 7)
}`
    },
    {
        id: 'range-basics',
        title: 'Range',
        description: 'Inclusive integer ranges a..b; use in loops and built-ins.',
        codeExample: `{
    r            : 1..5
    doubled      : for n in 1..5 return n * 2
    sumR         : sum(1..5)
    maxR         : max(1..5)
    countR       : count(1..5)
}`
    },
    {
        id: 'object-context',
        title: 'Object (Context)',
        description: 'Named fields with references and nesting.',
        codeExample: `{
    person : {
        first : 'Ada'
        born : 1815
    }
    ageNow : 2025 - person.born
}`
    },
    {
        id: 'date-basics',
        title: 'Date',
        description: 'date("YYYY-MM-DD"), compare, add/sub durations, fields and helpers.',
        codeExample: `{
    d1           : date("2017-05-03")
    d2           : date("2017-05-04")
    compare      : d1 < d2

    plusDays     : d1 + duration("P1D")
    minusMonths  : date("2017-03-31") - duration("P1M")

    y            : d1.year
    mName        : monthOfYear(d1)
    wName        : dayOfWeek(d1)
    lastDom      : lastDayOfMonth(date("2025-02-10"))
}`
    },
    {
        id: 'time-basics',
        title: 'Time',
        description: 'time("hh:mm:ss"), compare, +/- duration, and fields.',
        codeExample: `{
    t1           : time("13:10:30")
    t2           : time("10:00:00")
    diff         : t1 - t2
    plusMin      : t2 + duration("PT45M")
    hour         : t1.hour
}`
    },
    {
        id: 'datetime-basics',
        title: 'DateTime',
        description: 'datetime("YYYY-MM-DDThh:mm:ss"), compare, +/- duration, fields.',
        codeExample: `{
    dt1          : datetime("2017-05-03T13:10:30")
    dt2          : datetime("2017-05-01T10:00:00")
    diff         : dt1 - dt2
    plus         : dt1 + duration("P2DT3H")
    timePart     : dt1.time
    weekday      : dt1.weekday
}`
    },
    {
        id: 'duration-basics',
        title: 'Duration',
        description: 'duration("ISO-8601"). Years–months and days–time kinds; use with dates/times.',
        codeExample: `{
    ym           : duration("P1Y6M")
    dt           : duration("P2DT3H")
    addToDate    : date("2017-05-03") + ym
    subFromTime  : time("12:00:00") - duration("PT30M")
}`
    },
    {
        id: 'special-values',
        title: 'Special Values',
        description: 'Operations may yield sentinel values like Missing/NotApplicable/NotFound.',
        codeExample: `{
    idx          : find([1,2], 3)
    oob          : [10][5]
}`
    }
]
