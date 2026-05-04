# notes / scratch

Just notes I made while working through this. Leaving them in the repo because
they show some of the thinking. Not part of the actual deliverable.

---

rule 3 was the one that caught me out. first reading I thought the cancellation
record's `date` field was where the credit goes. tried it - day 21 came out
with P2 winning by tiebreak (P1 and P2 both at 3, P2 = "Aandleford..." sorts
first). but expected says P1 wins day 21 with 3.

so working backwards from the expected answer:
  - day 21 needs P1 = 3, P2 = 2
  - sample data has 3 P1 sales (C1, C2, C3) and 3 P2 sales (C2, C3, C32) on day 21
  - to get P2 down to 2, you need to remove C2's P2 purchase
  - the only thing that touches C2/P2 is order O30 - which was completed on
    day 21 then cancelled on day 22

so the cancellation removes the original from where it was placed, not from
where the cancellation happened. makes sense in hindsight - the customer
returns the basket on day 22, but their day-21 purchase is what's being undone.

---

rule 2 dedup scope - I went with "per day". reading 2 again:
  "If a customer makes multiple orders for the same product on the same day,
   it should only be counted as one product sale"
"on the same day" is explicit. so cross-day, a customer buying P1 on Mon
and again on Tue should count twice in a Mon-Tue window total. test for this
under "rule 2 - dedup by (customer, product, day)".

---

set-of-strings approach for dedup feels a bit hacky (productId|customerId
as a single string) but it's faster and simpler than nested maps. the
alternative would be Map<productId, Set<customerId>> per day which is two
levels deep. for this dataset it makes no difference.

if customer ids ever contain pipes this breaks, but they don't.

---

date parsing - learned the hard way that `new Date("21/04/2026")` returns
Invalid Date in chrome but parses as April 21 2026 in node. and on some
locales it'd be MM/DD. wrote parseDate to be deterministic across all of
them. plus 31/02 and similar - JS rolls those over silently.

---

graphql vs rest - the brief said graphql so graphql it is. honestly for
two read-only queries against a static file, REST would be just as good
and ~30 lines shorter. but the role mentioned it specifically.

---

tab switcher - looked at react-navigation but for two screens it adds
~200kb and 5 deps. just used useState + a couple of TouchableOpacity.

---

things I'd want to ask the team if I had more time:
  - what does the real production data look like? is it streamed/eventsourced
    or batch?
  - is the 3-day window a rolling window updated continuously or computed
    once daily?
  - are there other "removal" cases beyond cancelled - returns, refunds,
    partial cancellations of multi-line orders?
  - should we differentiate sales by store/region in future?
