# Sizzling Hot Products

My take on the [Sizzling Hot Products challenge](https://github.com/jbares-bunnings/tht-sizzling-hot-products).

## What it does

Reads orders and products from JSON files in `/inputs`, applies the four rules from the brief, and exposes the results two ways:

- A GraphQL API (Node + Apollo Server)
- A React Native app (Expo) that consumes that API

There's also a CLI runner that prints the same results to the terminal - handy for quick checks without needing to spin up the server or the app.

## Output against the supplied data

```
Top product per day
-------------------
  21/04/2026  Ezy Storage 37L Flexi Laundry Basket - White  (3)
  22/04/2026  Ezy Storage 37L Flexi Laundry Basket - White  (2)
  23/04/2026  Arlec 160W Crystalline Solar Foldable Charging Kit  (1)

Top product, 21/04/2026 to 23/04/2026
-----------------------------------------
  Ezy Storage 37L Flexi Laundry Basket - White  (6)
```

Matches the expected outcomes in the brief.

## Running it

You need Node 18+. For the mobile app you'll also want either Expo Go on your phone, or a simulator.

### Backend / CLI

```
cd server
npm install
npm run cli       # quick check
npm test          # run the test suite (26 tests)
npm run dev       # start GraphQL server on :4000
```

Once the server is up, GraphQL Sandbox is at http://localhost:4000. Try:

```graphql
query {
  dailyTopProductHistory {
    date
    product { productName sales }
  }
  topProductForPeriod(endDate: "23/04/2026", days: 3) {
    startDate
    endDate
    product { productName sales }
  }
}
```

### Mobile

In another terminal:

```
cd mobile
npm install
npm start
```

Press `i` for iOS sim, `a` for Android, or scan the QR code with Expo Go on your phone.

If you're using a physical device, the localhost URL won't work - point it at your laptop's LAN IP instead:

```
EXPO_PUBLIC_GRAPHQL_URL=http://192.168.x.x:4000/ npm start
```

(Android emulator works without this because `apollo.ts` already maps to `10.0.2.2`.)

## How the rules are implemented

I spent a fair bit of time on this part because the rules interact with each other. The trick is that rules 1 and 2 don't need separate passes - if you bucket sales into a `Set` keyed by `productId|customerId` per day, duplicates collapse on insertion. Quantity gets ignored because the entry just adds the same key. Same customer/product/day across two orders adds the same key twice - still one entry in the set.

Rule 3 was the one I had to think about. The brief says "the cancelled product sale should be removed from the product sales total for that day or period". Looking at the supplied data, a cancelled record shares the same `orderId` as the original completed one (e.g. O30 appears twice - once as completed on 21/04, once as cancelled on 22/04). So the implementation is:

1. Walk the orders once, collect every `orderId` that has a `cancelled` record.
2. Walk again, skipping any completed order whose `orderId` is in that set.

The cancellation date itself is metadata - it doesn't subtract anything from the day it was cancelled, only from the day the original was placed. That's important because in the supplied data, O30 was placed on 21/04 but cancelled on 22/04. If you credited it to 22/04 by mistake, day 21 still has 3 sales of P2 (so P1 and P2 tie at 3 and rule 4 picks "Aandleford..." alphabetically) - which doesn't match the expected output. The expected answer for day 21 is P1 at 3 sales, which only works if you remove C2's P2 purchase from 21/04 - i.e. credit the cancellation to the original placement date.

Rule 4 is just a stable secondary sort key on the product name.

## A few design decisions

**Repository pattern.** The service layer takes `IOrderRepository` and `IProductRepository`, not concrete file readers. Means the JSON loading is replaceable (DB, API, whatever) without touching the business logic, and tests can use plain in-memory stubs. The composition root in `index.ts` is the only place that knows about the JSON repos.

**CLI uses the same service.** The CLI doesn't reimplement anything - it just instantiates the same `SalesAggregationService` with the same repos and prints to stdout. So if the CLI prints the right answer, the GraphQL endpoint will too.

**TypeScript strict mode.** Catches a fair bit at compile time. Worth it.

**Manual date parsing.** Don't pass `21/04/2026` to `new Date()` - JavaScript will sometimes interpret it as US format. There's a small `parseDate` helper that does it properly and rejects nonsense like `31/02/2026`.

**Rule 4 uses `localeCompare`** rather than raw `<` so accented characters sort sensibly. Probably overkill for this dataset but it's a one-liner.

## Things I'm explicitly assuming

These are mentioned because the brief leaves them ambiguous and someone reviewing this might disagree:

1. **Cancellations link by shared `orderId`.** Confirmed by inspecting the supplied data. The example in the brief showed differing IDs (O10/O11) which I read as a typo.

2. **Cancellation date is metadata.** Discussed above - the cancellation is credited against the original placement date, not the cancellation date.

3. **Dates are DD/MM/YYYY.** Australian format, confirmed by the data.

4. **Rule 2's dedup is per-day only.** Same customer buying the same product on different days counts twice in a multi-day total.

5. **The "history" view returns only days that had sales.** A day where every order was cancelled wouldn't show up. Easy to change in `getTopProductPerDay()` if product wants empty rows.

## Testing

26 tests in `server/tests/`. Each rule has its own group with focused assertions, plus a final group that wires up a synthetic dataset reproducing the brief's expected outcomes end-to-end.

```
cd server
npm test
npm run test:coverage
```

## Trade-offs

A few things I left simple because of time:

- File reads are synchronous. Fine for a tiny dataset, but at production scale you'd push aggregation into SQL with a `WHERE NOT EXISTS` for the cancellation join, or pre-aggregate into a daily counter and cache the rolling window.
- No GraphQL subscriptions. The brief is read-only.
- The mobile app uses a hand-rolled tab switcher rather than react-navigation. Two screens didn't feel like enough to justify the dep.
- No mobile-side persistence. Apollo's in-memory cache handles within a session, but nothing offline.
- No CI. In a real codebase I'd wire up GitHub Actions to run `npm test` on push.

## Repo layout

```
.
├── inputs/                            order + product data
│   ├── orders.json
│   └── products.json
├── server/
│   ├── src/
│   │   ├── domain/types.ts            shared types
│   │   ├── services/
│   │   │   ├── repositories.ts        IOrderRepository, IProductRepository + JSON impls
│   │   │   └── SalesAggregationService.ts   the rules
│   │   ├── utils/date.ts              DD/MM/YYYY parsing
│   │   ├── schema.ts                  GraphQL SDL
│   │   ├── resolvers.ts
│   │   ├── cli.ts                     plain-text runner
│   │   └── index.ts                   Apollo Server bootstrap
│   ├── tests/
│   └── package.json
└── mobile/
    ├── App.tsx
    └── src/
        ├── apollo.ts
        ├── components/ProductCard.tsx
        └── screens/
            ├── DailyHistoryScreen.tsx
            └── ThreeDayWindowScreen.tsx
```

Happy to walk through any of this on the call.
