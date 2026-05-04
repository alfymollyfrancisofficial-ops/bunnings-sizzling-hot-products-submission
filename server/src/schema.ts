// Two queries, one per UI screen. Names match what the user sees, not
// the internal mechanism, so we can refactor the service without
// breaking clients.

export const typeDefs = `#graphql
  type ProductSalesResult {
    productId: ID!
    productName: String!
    sales: Int!
  }

  type DailyTopProduct {
    "Date in DD/MM/YYYY"
    date: String!
    product: ProductSalesResult
  }

  type PeriodTopProduct {
    startDate: String!
    endDate: String!
    product: ProductSalesResult
  }

  type Query {
    "Top product per day, ascending by date."
    dailyTopProductHistory: [DailyTopProduct!]!

    "Top product over a window ending at endDate. Defaults to the brief's 23/04/2026 + 3 days."
    topProductForPeriod(endDate: String, days: Int): PeriodTopProduct!
  }
`;
