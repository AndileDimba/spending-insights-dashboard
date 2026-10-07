# Project brief

## Source

Take-home assessment for the **Software Engineer: Frontend** role. Three briefs were offered; this repository implements **Customer Spending Insights Dashboard**.

> Build a responsive financial analytics dashboard to display a customer's spending data (mocked data).

## Requirements from the assessment

- Approach it as a real-world problem
- Production-grade, reflecting real-world quality and standards
- A runnable `Dockerfile` that builds and runs the project
- A `README.md` explaining how to build, run and test
- Public GitHub repository, submitted by **21 October 2026**
- This submission is the only evidence used to judge skill level; it is discussed in the interview

## What the role values (from the job description)

These shape how we build, not just what:

- **Ownership**: take a requirement from understanding the problem through to delivery
- **Clean, reusable React components** that other engineers find easy to work with
- **API integration** and troubleshooting across the stack
- **Code review culture** and engineering standards
- **Modern, maintainable frontend architecture** (the team is mid-rewrite)
- **Security, reliability and quality** are critical because this is banking
- **Maintainable, testable code** in a large codebase
- **Git** fluency
- Nice to have: **Java / Spring**

## API

The contract is in [`api-spec.md`](./api-spec.md). Seven endpoints:

1. `GET /api/customers/{customerId}/profile`
2. `GET /api/customers/{customerId}/spending/summary?period=`
3. `GET /api/customers/{customerId}/spending/categories?period=&startDate=&endDate=`
4. `GET /api/customers/{customerId}/spending/trends?months=`
5. `GET /api/customers/{customerId}/transactions?limit=&offset=&category=&startDate=&endDate=&sortBy=`
6. `GET /api/customers/{customerId}/goals`
7. `GET /api/customers/{customerId}/filters`

## Scope

### Must have

- Dashboard overview: profile header, spending summary with change against previous period, period selector
- Category breakdown (chart plus accessible list), sorted by amount
- Monthly trends chart with selectable range
- Transactions list with category and date filters, sorting and pagination, all reflected in the URL
- Spending goals with progress and status
- Loading, empty and error states everywhere
- Responsive from 360px to desktop, keyboard and screen reader accessible
- Mocked API at the network layer (MSW), validated with Zod
- Unit, component, accessibility and e2e tests
- Dockerfile, CI pipeline, README, ADRs, API assumptions

### Should have

- Dark mode following system preference
- Transaction search by merchant
- Export filtered transactions as CSV

### Could have (only after must haves are polished)

- A small ASP.NET Core API implementing the same contract. Java is the nice to have in the job description; [ADR 0004](../adr/0004-reference-backend-in-aspnet-core.md) explains why .NET was chosen instead
