# String Built-in Functions Reference

## toString

Converting the number to string. Math operator `+` can be used for string concatenation, but both operands must be strings.

```edgerules
"#" + toString(404)
```

## substring

Substring starting at position

```edgerules
substring("foobar", 3)
```

## substring (with length)

Substring with length

```edgerules
substring("foobar", -3, 2)
```

## length

Number of characters.

```edgerules
length("foo")
```

## toUpperCase

To uppercase.

```edgerules
toUpperCase("aBc4")
```

## toLowerCase

To lowercase.

```edgerules
toLowerCase("aBc4")
```

## substringBefore

String before match.

```edgerules
substringBefore("foobar", "bar")
```

## substringAfter

String after match.

```edgerules
substringAfter("foobar", "ob")
```

## contains

True if contains substring.

```edgerules
contains("foobar", "of")
```

## startsWith

Checks prefix.

```edgerules
startsWith("foobar", "fo")
```

## endsWith

Checks suffix.

```edgerules
endsWith("foobar", "r")
```

## regexSplit

Splits string by regex.

```edgerules
regexSplit("a   b c", "\s+")
```

## split

Simple substring split.

```edgerules
split("a-b-c", "-")
```

## trim

Trim whitespace.

```edgerules
trim("  hello  ")
```

## uuid

Generate UUID.

```edgerules
uuid()
```

## toBase64

Encode to base64.

```edgerules
toBase64("FEEL")
```

## regexReplace

Regex replace.

```edgerules
regexReplace('Hello 123 world 456', '\d+', 'X', 'g')
```

## regexReplace (with flags)

Regex replace with flags.

```edgerules
regexReplace("Abcd", "ab", "xx", "i")
```

## replace

Simple substring replace, case-insensitive.

```edgerules
replace("Abcd", "ab", "xx", "i")
```

## replaceFirst

Replace first occurrence.

```edgerules
replaceFirst("foo bar foo", "foo", "baz")
```

## replaceLast

Replace last occurrence.

```edgerules
replaceLast("foo bar foo", "foo", "baz")
```

## charAt

Character at index.

```edgerules
charAt("Abcd", 2)
```

## charCodeAt

Unicode of character at index.

```edgerules
charCodeAt("Abcd", 2)
```

## indexOf

Index of substring, or -1 if not found.

```edgerules
indexOf("Abcd", "b")
```

## lastIndexOf

Last index of substring, or -1 if not found.

```edgerules
lastIndexOf("Abcb", "b")
```

## fromBase64

Decode from base64.

```edgerules
fromBase64("RkVFTA==")
```

## fromCharCode

Create string from Unicode values.

```edgerules
fromCharCode(99, 100, 101)
```

## padStart

Pad string on left to length with char.

```edgerules
padStart("7", 3, "0")
```

## padEnd

Pad string on right to length with char.

```edgerules
padEnd("7", 3, "0")
```

## repeat

Repeat string N times.

```edgerules
repeat("ab", 3)
```

## reverse

Reverse string.

```edgerules
reverse("abc")
```

## sanitizeFilename

Remove characters not allowed in filenames.

```edgerules
sanitizeFilename('a/b\\c:d*e?f\"g<h>ij.exe')
```

## interpolate

Template string interpolation.

```edgerules
interpolate("Hi ${name}", { name: "Ana" })
```
