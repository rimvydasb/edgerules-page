# User Defined Functions Reference

## Simple Functions

User can define their own functions and use them in execution.
If argument types are not specified, they will be inferred during runtime.

```edgerules
{
    func inc(nums): {
        result: for n in nums return toString(n) + "!"
    }
    asNumbers: inc([1, 2, 3]).result
    asChars: inc(['a','b','c']).result
}
```

## Functions as Eclosed Context

Inside a function it is possible to deeply nest other functions and variables.
Functions cannot access variables from the outer scope - this makes
each function an enclosed context that can be reused and reasoned about independently.

```edgerules
{
    type Customer: { 
        name: <string>; 
        income: <number>; 
        expense: <number>; 
        tags: <string[]> 
    }
    func customerDetails(customer: Customer): {
        self: customer
        financialInformation: {
            total: self.income + self.expense
            savings: self.income - self.expense
            isProfitable: self.income > self.expense
        }
        status: {
            tagCount: count(self.tags)
            func hasTag(customer, tag: string): {
                result: contains(customer.tags, tag)
            }
            isVIP: hasTag(self, "vip").result
        }
    }
    detailedCustomer: customerDetails({
        name: "Alice"; 
        income: 1000; 
        expense: 400;
        tags: ["vip", "premium"]
    })
}
```