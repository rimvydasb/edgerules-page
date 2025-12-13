# Playground

## Example Loan Origination

```edgerules
{
    // Business Object Model Entities:

    type Application: {
        applicationDate: <datetime>;
        applicants: <Applicant[]>;
        propertyValue: <number>;
        loanAmount: <number>;
    }
    type Applicant: {
        name: <string>;
        birthDate: <date>;
        income: <number>;
        expense: <number>;
    }

    // Applicant Level Decisions
  
    func applicantDecisions(applicant: Applicant, applicationRecord): {        

         func CreditScore(age, income): {
            bins: [
                {name: "AGE_BIN"; score: 20; condition: if age <= 25 then score else 0}
                {name: "AGE_BIN"; score: 30; condition: if age > 25 then score else 0}
                {name: "INC_BIN"; score: 30; condition: if income >= 1500 then score else 0}                
            ]
            totalScore: sum(for bin in bins return bin.condition)
        }
      
        func EligibilityDecision(applicantRecord, creditScore): {
            rules: [
                {name: "INC_CHECK"; rule: applicantRecord.data.income > applicantRecord.data.expense * 2}
                {name: "MIN_INCOM"; rule: applicantRecord.data.income > 1000}
                {name: "AGE_CHECK"; rule: applicantRecord.age >= 18}
                {name: "SCREDIT_S"; rule: creditScore.totalScore > 10}
            ]
            firedRules: for invalid in rules[rule = false] return invalid.name
            status: if count(rules) = 0 then "ELIGIBLE" else "INELIGIBLE"
        }

        // Applicant Record
  
        applicantRecord: {
            data: applicant
            age: calendarDiff(applicant.birthDate, applicationRecord.data.applicationDate.date).years
        }
        
        // Applicant Decisions
        
        creditScore: CreditScore(12,1000)
        eligibility: EligibilityDecision(applicantRecord, creditScore)
    }

    // Application Level Decisions

    func applicationDecisions(application: Application): {

        // Application Record
      
        applicationRecord: {
            data: application            
        }
        
        // Application Decisions
        
        applicantDecisions: for app in application.applicants return applicantDecisions(app, applicationRecord)
        finalDecision: if (count(applicantDecisions[eligibility.status="INELIGIBLE"]) > 0) then "DECLINE" else "APPROVE"
    }

    // Example Input Data

    applicationResponse: applicationDecisions({
        applicationDate: datetime("2025-01-01T15:43:56")
        propertyValue: 100000
        loanAmount: 80000
        applicants: [
            {
                name: "John Doe"
                birthDate: date("1990-06-05")
                income: 1100
                expense: 600
            },
            {
                name: "Jane Doe"
                birthDate: date("1992-05-01")
                income: 1500
                expense: 300
            }
        ]
    })
}
```

**output:**
```json
{
  "applicationResponse": {
    "applicationRecord": {
      "data": {
        "applicationDate": "2025-01-01 15:43:56.0",
        "applicants": [
          {
            "name": "John Doe",
            "birthDate": "1990-06-05",
            "income": 1100,
            "expense": 600
          },
          {
            "name": "Jane Doe",
            "birthDate": "1992-05-01",
            "income": 1500,
            "expense": 300
          }
        ],
        "propertyValue": 100000,
        "loanAmount": 80000
      }
    },
    "applicantDecisions": [
      {
        "applicantRecord": {
          "data": {
            "name": "John Doe",
            "birthDate": "1990-06-05",
            "income": 1100,
            "expense": 600
          },
          "age": 34
        },
        "creditScore": {
          "bins": [
            {
              "name": "AGE_BIN",
              "score": 20,
              "condition": 20
            },
            {
              "name": "AGE_BIN",
              "score": 30,
              "condition": 0
            },
            {
              "name": "INC_BIN",
              "score": 30,
              "condition": 0
            }
          ],
          "totalScore": 20
        },
        "eligibility": {
          "rules": [
            {
              "name": "INC_CHECK",
              "rule": false
            },
            {
              "name": "MIN_INCOM",
              "rule": true
            },
            {
              "name": "AGE_CHECK",
              "rule": true
            },
            {
              "name": "SCREDIT_S",
              "rule": true
            }
          ],
          "firedRules": [
            "INC_CHECK"
          ],
          "status": "INELIGIBLE"
        }
      },
      {
        "applicantRecord": {
          "data": {
            "name": "Jane Doe",
            "birthDate": "1992-05-01",
            "income": 1500,
            "expense": 300
          },
          "age": 32
        },
        "creditScore": {
          "bins": [
            {
              "name": "AGE_BIN",
              "score": 20,
              "condition": 20
            },
            {
              "name": "AGE_BIN",
              "score": 30,
              "condition": 0
            },
            {
              "name": "INC_BIN",
              "score": 30,
              "condition": 0
            }
          ],
          "totalScore": 20
        },
        "eligibility": {
          "rules": [
            {
              "name": "INC_CHECK",
              "rule": true
            },
            {
              "name": "MIN_INCOM",
              "rule": true
            },
            {
              "name": "AGE_CHECK",
              "rule": true
            },
            {
              "name": "SCREDIT_S",
              "rule": true
            }
          ],
          "firedRules": [],
          "status": "INELIGIBLE"
        }
      }
    ],
    "finalDecision": "DECLINE"
  }
}
```