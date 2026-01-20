# User-Defined Functions Reference

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

**output:**

```json
{
  "asNumbers": [
    "1!",
    "2!",
    "3!"
  ],
  "asChars": [
    "a!",
    "b!",
    "c!"
  ]
}
```

## Inline Functions

User can define simple single return functions inline without the need for a full function body.

```edgerules
{
    func addOne(x): x + 1
    func doubleAndAddOne(y): addOne(y * 2)
    result: doubleAndAddOne(3)
}
```

**output:**

```json
{
  "result": 7
}
```

## Return Body Scoping

User can define a specific `return` field in function bodies to define the exact return value, allowing internal
variables to be hidden.

```edgerules
{
    func calculateDiscount(productType): {
        productDiscounts: [0.20, 0.15, 0.11]
        campaignDiscount: 0.05
        activeCampaign: "SUMMER_SALE"
        baseDiscount: productDiscounts[productType - 1]
        return: {
            campaign: activeCampaign
            discount: baseDiscount + campaignDiscount
        }
    }
    discount1: calculateDiscount(1)
    discount2: calculateDiscount(2)
}
```

**output:**

```json
{
  "discount1": {
    "campaign": "SUMMER_SALE",
    "discount": 0.25
  },
  "discount2": {
    "campaign": "SUMMER_SALE",
    "discount": 0.2
  }
}
```

## Functions as Enclosed Context

Inside a function, it is possible to nest other functions and variables deeply.
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

**output:**

```json
{
  "detailedCustomer": {
    "self": {
      "name": "Alice",
      "income": 1000,
      "expense": 400,
      "tags": [
        "vip",
        "premium"
      ]
    },
    "financialInformation": {
      "total": 1400,
      "savings": 600,
      "isProfitable": true
    },
    "status": {
      "tagCount": 2,
      "isVIP": true
    }
  }
}
```