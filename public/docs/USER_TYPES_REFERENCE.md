# User Defined Types Reference

## Simple Types

User can define their own types and use them for function variables.

```edgerules
{
    type NumList: <number[]>
    func inc(nums: NumList): {
        result: for n in nums return n + 1
    }
    vals: inc([1, 2, 3]).result
}
```

## Complex Types

Types can be nested and combined.

```edgerules
{
    type Person: { name: <string>; age: <number>; tags: <string[]> }
    type PeopleList: Person[]
    func getAdults(people: PeopleList): {
        result: people[age >= 18]
    }
    persons: [
        {name: "Alice"; age: 30; tags: ["engineer", "manager"]}
        {name: "Bob"; age: 15; tags: ["student"]}
        {name: "Charlie"; age: 22; tags: ["designer"]}
    ]
    adults: getAdults(persons)
}
```