# Introduction

**EdgeRules** expression language helps you to define business rules and calculations. 
It is a simple, declarative, referentially transparent and type safe language with a small set of concepts that you can combine to express complex logic.
Here are some interactive examples to get you started with JSON output.

In the example below, we calculate the best 3-months in a row sales period.
You can edit the code and see the results immediately.

```edgerules
{
    sales: [10, 20, 8, 7, 1, 10, 6, 78, 0, 8, 0, 8]
    salesCount: count(sales)
    func sales3(month, sales): { 
        result: sales[month] + sales[month + 1] + sales[month + 2] 
    }
    acc: for m in 0..(salesCount - 3) return sales3(m, sales).result
    best: max(acc)
}
```

## Numbers

### Arithmetic

Integers and reals with +, -, *, /, ^ and unary -.

```edgerules
{
    summing: 4 + 1.2
    subtracting: 12 - 3
    product: 6 * 7
    division: 10 / 4
    power: 2 ^ 8
    negate: -(5 + 1)
}
```

### Comparisons

Numeric comparisons: <, <=, >, >=, =, <>.',
```edgerules
{
    lower: 1 < 2
    lowerEquals: 2 <= 2
    greater: 3 > 1
    greaterEquals: 4 >= 4
    simpleEquals: 5 = 5
    negate: 6 <> 7
}
```

## Boolean

Booleans true/false and logical operators not/and/or/xor.

```edgerules
{
    a: true
    b: false
    allTrue: a and not b
    anyTrue: a or b
    justOne: a xor b
    negateComp: not (3 = 4)
}
```

## Strings
Single or double quotes. Compare with = and <>.

```edgerules
{
    a: 'hello'
    b: "hello"
    equal: a = b
    notEqual: a <> b
}
```

## Lists

Indexing, filtering, and numeric built-ins sum/max/count; find returns index or Missing.

```edgerules
{
    nums: [1, 5, 12, 7]
    first: nums[0]
    filtered: nums[... > 6]
    sumAll: sum(nums)
    maxAll: max(nums)
    countAll: count(nums)
    idxOf7: find(nums, 7)
}
```
## Ranges

Inclusive integer ranges a..b; use in loops and built-ins.

```edgerules
{
    r: 1..5
    doubled: for n in 1..5 return n * 2
    sumR: sum(1..5)
    maxR: max(1..5)
    countR: count(1..5)
}
```
## Object (Context)

Named fields with references and nesting.

```edgerules
{
    person: {
        first: 'Ada'
        born: 1815
    }
    ageNow: 2025 - person.born
}
```

## Date

date("YYYY-MM-DD"), compare, add/sub durations, fields and helpers.

```edgerules
{
    d1: date("2017-05-03")
    d2: date("2017-05-04")
    compare: d1 < d2
    plusDays: d1 + duration("P1D")
    beforeHalfDay: date("2017-03-31") - duration("PT12H")
    minusMonth: date("2017-03-31") - period("P1M")
    y: d1.year
    mName: monthOfYear(d1)
    wName: dayOfWeek(d1)
    lastDom: lastDayOfMonth(date("2025-02-10"))
    between: calendarDiff(date("1987-03-07"),d2)
}
```

## Time

time("hh:mm:ss"), compare, +/- duration, and fields.

```edgerules
{
    t1: time("13:10:30")
    t2: time("10:00:00")
    diff: t1 - t2
    plusMin: t2 + duration("PT45M")
    hour: t1.hour
}
```

## DateTime

datetime("YYYY-MM-DDThh:mm:ss"), compare, +/- duration, fields.

```edgerules
{
    dt1: datetime("2017-05-03T13:10:30")
    dt2: datetime("2017-05-01T10:00:00")
    diff: dt1 - dt2
    plus: dt1 + duration("P2DT3H")
    timePart: dt1.time
    weekday: dt1.weekday
}
```

## Duration

duration("ISO-8601"). Years–months and days–time kinds; use with dates/times.

```edgerules
{
    ym: duration("P1D")
    dt: duration("P2DT3H")
    addToDate: date("2017-05-03") + ym
    subFromTime: time("12:00:00") - duration("PT30M")
}
```

## Special Values

Operations may yield sentinel values like Missing/NotApplicable for certain situations.

```edgerules
{
    idx: find([1,2], 3)
    oob: [10][5]
}
```