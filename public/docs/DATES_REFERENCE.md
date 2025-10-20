# Date & Time Reference

**EdgeRules** supports ISO-8601 style dates, times, datetimes, and durations. All values are local-time only (no offsets
or zones) and operations are deterministic so they can run on the edge. Use the primitives below to express schedules,
remainders, and temporal rules without pulling in clock state.

```edgerules
{
    newDate: date("2024-09-15")
    newTime: time("13:10:30")
    newDateTime: datetime("2024-09-15T13:10:30")
    sameMoment: date("2024-09-15") = datetime("2024-09-15T00:00:00")
}
```

## Durations

Durations come in two shapes:

- **period("P1Y2M3D")** carries years, months, and days (calendar-aware, like Java `Period`)
- **duration("P2DT3H")** carries days, hours, minutes, seconds (clock duration)

Periods and durations normalize automatically: **period("P18M")** behaves like **P1Y6M**, and **duration("PT90M")** 
prints as **PT1H30M**.

```edgerules
{
    ymOnly: period("P18M")
    daysOnly: period("P10D")
    clockSpan: duration("PT90M")
    negSeconds: duration("-PT45S")
}
```

## Accessing Components

**weekdayIso** follows ISO numbering (Monday = 1 ... Sunday = 7). The **.time** accessor on a datetime returns a concrete
time(...) value formatted as HH:MM:SS.0.

```edgerules
{
    dateParts: {
        year: date("2017-05-03").year
        month: date("2017-05-03").month
        day: date("2017-05-03").day
        weekdayIso: date("2018-10-11").weekday
    }
    timeParts: {
        hour: time("13:10:30").hour
        minute: time("13:10:30").minute
        second: time("13:10:30").second
    }
    datetimeParts: {
        month: datetime("2016-12-09T15:37:00").month
        hour: datetime("2016-12-09T15:37:00").hour
        timeOnly: datetime("2016-12-09T15:37:00").time
    }
}
```

## Comparing Temporal Values

Mixing incompatible types (for example, comparing a `date` to a `time` or a `duration`) produces a linking error.

```edgerules
{
    dateCompare: {
        eq: date("2020-01-01") = date("2020-01-01")
        lt: date("2020-01-01") < date("2020-01-02")
        gte: date("2020-01-03") >= date("2020-01-03")
    }
    timeCompare: {
        neq: time("09:00:00") <> time("10:00:00")
        lt: time("08:30:00") < time("09:00:00")
    }
    datetimeCompare: {
        gt: datetime("2020-01-01T11:00:00") > datetime("2020-01-01T09:00:00")
    }
    durationCompare: {
        eq: duration("PT3H") = duration("PT180M")
        gt: duration("P2D") >= duration("P1D")
    }
    periodEqual: period("P1Y") = period("P12M")
}
```

## Arithmetic with Durations

Subtraction between two temporal values always yields a `duration`. Adding or subtracting a `duration` keeps the same
type for times/datetimes, while dates become datetimes because the time component appears.

Use `period(...)` when you need calendar-aware math: check **calendarDiffs** for calendar-based date subtraction.

In these examples, `subtractDates` evaluates to `PT16H`, `dateMinusDate` to `PT24H`, `addToDate` to
`2017-05-04 0:00:00.0`, and `subtractFromDate` to `2017-05-02 0:00:00.0`.

```edgerules
{
    subtractDates: datetime("2020-01-02T00:00:00") - datetime("2020-01-01T08:00:00")
    dateMinusDate: date("2020-01-02") - date("2020-01-01")
    addToDate: date("2017-05-03") + duration("P1D")
    subtractFromDate: date("2017-05-03") - duration("P1D")
    datetimePlus: datetime("2016-12-09T15:37:00") + duration("PT23H")
    timeMath: {
        minus: time("13:10:30") - duration("PT1H10M30S")
        plus: time("13:10:30") + duration("PT50S")
        diff: time("13:10:30") - time("12:00:00")
    }
}
```

## Period Arithmetic

Use periods when you need month-aware math (end-of-month rules, anniversaries, etc.).

Periods cannot be combined with durations in arithmetic. Attempting `period('P4D') + duration('PT5H')` or subtracting a
period from a duration raises a linking error.

```edgerules
{
    addPeriodToDate: date("2020-01-31") + period("P1M")
    subtractPeriodFromDate: date("2020-02-29") - period("P1M")
    datetimePeriod: datetime("2020-01-15T10:30:00") + period("P1Y2M")
    periodMath: {
        plus: period("P1Y6M") + period("P2M")
        minus: period("P6M") - period("P2M")
    }
}
```

## Calendar Helpers

- **calendarDiff** always returns a `period`, preserving sign. `monthOfYear` and `dayOfWeek` return English names.
- **lastDayOfMonth** yields the day number for the month (28 for February 2025, 29 when leap year rules apply).

```edgerules
{
    names: {
        month: monthOfYear(date("2025-09-02"))
        weekday: dayOfWeek(date("2025-09-02"))
    }
    calendarDiffs: {
        forward: calendarDiff(date("2000-05-03"), date("2025-09-10"))
        backward: calendarDiff(date("2025-03-10"), date("2024-01-15"))
    }
    lastDom: lastDayOfMonth(date("2025-02-10"))
}
```

## Restrictions and Tips

- No time zones, offsets, leap seconds, sub-second precision, or system clock access (`today()` / `now()` are omitted).
- Always keep ISO-8601 formatting (zero-padded month, day, hour). Invalid strings raise runtime errors.
- Periods are unordered; only `=` and `<>` are valid comparisons.
- Temporal addition works left-to-right. `date + duration` becomes a datetime, so chain carefully when building rules.
- Normalize output with `toString(...)` if you need canonical ISO-8601 text (e.g., `toString(duration("PT90M"))` yields
  `"PT1H30M"`).