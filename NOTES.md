# notes

scratch file. leaving it in the repo, not part of the deliverable.

---

rule 3 took the longest. tested it both ways before settling. cancellation
date is just metadata, the credit goes back to the original placement date.
checked against expected output for day 21 - if you don't link by orderId
and remove from the original date, P1 and P2 tie at 3 each and P2 wins
alphabetically which is wrong.

rule 2 - "on the same day" is explicit so dedup is per-day. cross-day
counts twice in a window total.

---

set keyed by `productId|customerId` for dedup. could've done nested maps
(Map<productId, Set<customerId>>) but this is simpler. assumes no pipes
in ids - fine for now.

---

date parsing - DON'T use `new Date("21/04/2026")`. node parses it, chrome
returns Invalid Date, and locale settings can flip DD/MM to MM/DD. wrote
parseDate manually. also rejects 31/02 etc since JS rolls them over.

---

graphql cause the brief said so. for 2 read-only queries against a static
file, REST would do the job in 30 fewer lines. fine.

---

mobile - skipped react-navigation, just useState + 2 buttons. only 2
screens, didn't seem worth the dep.

---

todo / questions for the team:
- prod data shape? streaming or batch?
- 3-day window - rolling or computed once daily?
- returns / refunds / partial cancels - same flow as cancelled?
- store/region split needed eventually?

---

stuff I didn't get to:
- proper logging
- error handling on bad json input is basic
- could add resolver-level integration tests
