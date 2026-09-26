# Mutations

Written by `python scripts/mutate.py --table docs/MUTATIONS.md`. 38 defences in
`contracts/clearance.py` were each broken on their own, and every mutant was caught. Each row
names the first test that failed against it, read from pytest's report rather than an exit code.
The generated-files test is excluded, because it fails for any edit at all.

One check is deliberately not mutated: the validator's test that the leader's payload is a dict
with a verdict from the closed set. The verdict-and-tier comparison right below it already
refuses anything else, so no test can tell the two apart; it stays so the validator never
depends on how the runtime treats an exception raised inside it. A first run listed it as an
escape, together with two real gaps (an unreadable verdict defaulting to FREE, and PAID with an
unknown tier), which the tests then closed by asserting the round is a disagreement, not a refusal.

| # | defence broken | caught by |
|---|---|---|
| 1 | amend: any account may amend | `tests/test_direct.py::test_only_the_creator_may_amend` |
| 2 | answer: any account may answer | `tests/test_direct.py::test_only_the_creator_may_answer` |
| 3 | buy: any account may buy someone else's answer | `tests/test_direct.py::test_only_the_requester_may_buy` |
| 4 | publish: the work is owned by a fixed address | `tests/test_direct.py::test_publish_creates_version_one_with_its_tiers_and_the_caller_as_creator` |
| 5 | ask: the request is not bound to the asker | `tests/test_direct.py::test_a_paid_answer_stores_the_tier_price_and_offers_it_for_seven_days` |
| 6 | withdraw: pays a fixed address | `tests/test_direct.py::test_withdraw_pays_the_whole_balance_to_the_caller_only` |
| 7 | buy: any value is accepted | `tests/test_direct.py::test_the_exact_price_and_nothing_else` |
| 8 | buy: the seven-day hold never ends | `tests/test_direct.py::test_the_price_is_held_for_exactly_seven_days` |
| 9 | buy: the hold is a day short | `tests/test_direct.py::test_a_paid_answer_stores_the_tier_price_and_offers_it_for_seven_days` |
| 10 | buy: a receipt can be bought twice | `tests/test_direct.py::test_a_receipt_is_bought_once` |
| 11 | buy: denied and unclear answers are buyable | `tests/test_direct.py::test_nothing_to_buy_on_a_denied_or_unclear_answer[DENIED]` |
| 12 | buy: the creator is not credited | `tests/test_direct.py::test_buying_a_paid_answer_issues_the_receipt_and_credits_the_creator` |
| 13 | buy: a creator price is marked as the judge's | `tests/test_direct.py::test_a_creator_price_is_bought_like_the_judge_s_and_marked_as_the_creator_s` |
| 14 | withdraw: the balance is not zeroed | `tests/test_direct.py::test_withdraw_pays_the_whole_balance_to_the_caller_only` |
| 15 | withdraw: an empty balance still sends | `tests/test_direct.py::test_withdraw_pays_the_whole_balance_to_the_caller_only` |
| 16 | answer: a request is answered twice | `tests/test_direct.py::test_a_creator_no_closes_an_unclear_request` |
| 17 | answer: the judge's own yes can be overridden | `tests/test_direct.py::test_the_judge_s_yes_takes_no_creator_answer[PAID-merch]` |
| 18 | answer: a denied request can be denied again | `tests/test_direct.py::test_a_denied_request_takes_an_exception_free_or_paid` |
| 19 | answer: a creator price is not held from the answer | `tests/test_direct.py::test_a_creator_price_is_bought_like_the_judge_s_and_marked_as_the_creator_s` |
| 20 | answer: a creator FREE issues no receipt | `tests/test_direct.py::test_a_creator_free_answer_issues_a_creator_receipt` |
| 21 | answer: FREE may carry a tier | `tests/test_direct.py::test_decisions_are_a_closed_set_and_only_paid_names_a_tier` |
| 22 | amend: the old version is overwritten | `tests/test_direct.py::test_amending_adds_a_version_and_never_overwrites_the_old_one` |
| 23 | ask: judged against version one forever | `tests/test_direct.py::test_the_request_is_judged_against_the_latest_version` |
| 24 | digest: the tiers are not hashed | `tests/test_direct.py::test_the_stored_price_holds_after_the_license_is_amended` |
| 25 | ask: the 600-character cap is gone | `tests/test_direct.py::test_the_use_is_at_most_600_characters_and_not_empty` |
| 26 | publish: the 1,500-character license cap is gone | `tests/test_direct.py::test_the_license_is_at_most_1500_characters` |
| 27 | tiers: five tiers are accepted | `tests/test_direct.py::test_a_work_has_at_most_four_tiers` |
| 28 | tiers: duplicate ids are accepted | `tests/test_direct.py::test_tier_ids_are_lower_cased_and_must_be_unique` |
| 29 | tiers: a free tier is accepted | `tests/test_direct.py::test_bad_prices_are_refused[0-more` |
| 30 | links: any character is accepted | `tests/test_direct.py::test_title_and_link_are_checked[link-https://naraito.art/<script>-character` |
| 31 | judge: the fence lets delimiters through | `tests/test_static.py::test_the_blocks_close_where_the_contract_closes_them[license]` |
| 32 | judge: validators agree with any answer | `tests/test_direct.py::test_a_different_verdict_is_a_disagreement_and_nothing_is_stored` |
| 33 | judge: validators compare the verdict only | `tests/test_direct.py::test_a_different_tier_is_a_disagreement` |
| 34 | judge: an unreadable verdict defaults to FREE | `tests/test_direct.py::test_an_unreadable_answer_never_becomes_a_verdict[{"verdict":` |
| 35 | judge: PAID with an unknown tier is accepted | `tests/test_direct.py::test_an_unreadable_answer_never_becomes_a_verdict[{"verdict":` |
| 36 | judge: the reason is not capped | `tests/test_direct.py::test_reason_and_conditions_are_capped_for_display` |
| 37 | judge: a FREE answer issues no receipt | `tests/test_direct.py::test_a_free_answer_issues_the_receipt_at_once_with_its_conditions` |
| 38 | judge: denied answers keep their conditions | `tests/test_direct.py::test_denied_and_unclear_issue_nothing_and_carry_no_conditions` |
