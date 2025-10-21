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

    // All Decision Areas:

    // Applicant Decisions
  
    func applicantDecisions(applicant: Applicant, applicationRecord): {

        // Decisions
      
        func eligibilityDecision(applicantRecord): {
            rules: [
                {name: "INC_CHECK"; rule: applicantRecord.data.income > applicantRecord.data.expense * 2}
                {name: "MIN_INCOM"; rule: applicantRecord.data.income > 1000}
                {name: "AGE_CHECK"; rule: applicantRecord.data.birthDate + period('P18Y') <= applicantRecord.checkDate}
            ]
            firedRules: for invalid in rules[rule = false] return invalid.name
            status: if count(rules) = 0 then "ELIGIBLE" else "INELIGIBLE"
        }

        // Record
  
        applicantRecord: {
            checkDate: applicationRecord.data.applicationDate
            data: applicant
            age: applicationRecord.data.applicationDate - applicant.birthDate
        }
        eligibility: eligibilityDecision(applicantRecord)
    }

    // Application Decisions

    func applicationDecisions(application: Application): {

        // Record
      
        applicationRecord: {
            data: application            
        }
        applicantDecisions: for app in application.applicants return applicantDecisions(app, applicationRecord)
    }

    // Example Input Data

    applicationResponse: applicationDecisions({
        applicationDate: date("2025-01-01")
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