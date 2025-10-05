# List Built-in Functions Reference

## contains

Checks if a list contains a value.

```edgerules
contains([1,2,3], 2)
```

## count

Returns the number of elements.

```edgerules
count([1,2,3])
```

## min

Finds the smallest number.

```edgerules
min([1,2,3])
```

## max

Finds the largest number.

```edgerules
max([1,2,3])
```

## sum

Adds up all numbers.

```edgerules
sum([1,2,3])
```

## product

Multiplies all numbers.

```edgerules
product([2,3,4])
```

## mean

Calculates the average.

```edgerules
mean([1,2,3])
```

## median

Returns the middle value.

```edgerules
median([1,2,3])
```

## stddev

Standard deviation of numbers.

```edgerules
stddev([2,4])
```

## mode

Most frequent values (may be multiple).

```edgerules
mode([1,2,2,3])
```

## all

True if all values are true.

```edgerules
all([true,true,false])
```

## any

True if at least one value is true.

```edgerules
any([false,false,true])
```

## sublist

Extracts sublist from index to end.

```edgerules
sublist([1,2,3], 2)
```

## sublist (with length)

Extracts sublist of given length.

```edgerules
sublist([1,2,3], 1, 2)
```

## append

Adds elements at the end.

```edgerules
append([1], 2, 3)
```

## concatenate

Joins lists together.

```edgerules
concatenate([1,2], [3])
```

## insertBefore

Inserts an item at a position.

```edgerules
insertBefore([1,3], 1, 2)
```

## remove

Removes element at position.

```edgerules
remove([1,2,3], 2)
```

## reverse

Reverses list order.

```edgerules
reverse([1,2,3])
```

## indexOf

Returns 1-based positions of matches.

```edgerules
indexOf([1,2,3,2], 2)
```

## union

Combines lists without duplicates.

```edgerules
union([1,2], [2,3])
```

## distinctValues

Removes duplicates.

```edgerules
distinctValues([1,2,3,2,1])
```

## duplicateValues

Returns only the duplicates (unique).

```edgerules
duplicateValues([1,2,3,2,1])
```

## flatten

Flattens nested lists.

```edgerules
flatten([[1,2], [[3]], 4])
```

## sort

Sorts list ascending or descending.

```edgerules
{
    ascending: sort([3,1,2,4,0])
    descending: sortDescending([3,1,2,4,0])
}
```

## join

Join supports simple strings join without delimiter, with delimiter, and with delimiter and wrap.

```edgerules
{
    simple: join(["a","b","c"])
    delimiter: join(["a","b","c"], ", ")
    delimiterAndWrap: join(["a","b","c"], ", ", "[", "]")
}
```

## isEmpty

True if list has no elements.

```edgerules
isEmpty([])
```

## partition

Splits list into sublists of given size.

```edgerules
partition([1,2,3,4,5], 2)
```
