## Points Report

This project uses a simple points balance system. The table below lists every action in the codebase that changes a user's points balance.

### Points Earned

| Action | Points | Notes |
| --- | ---: | --- |
| Daily login reward | `+5` | Awarded once per day when the user claims the daily reward. |
| Daily login streak bonus | `+2` | Added every 7th consecutive day on top of the base `+5`. |
| Giveaway participation | `+1` | Awarded when a user joins a giveaway. |
| Giveaway win | `+40` | Awarded when a user is selected as the giveaway winner. |
| Slot call creation | `+8` | Awarded when a user submits a slot call. |
| Slot call accepted | `+2` | Awarded when an admin accepts a slot call. |
| Slot call x250 hit | `+500` | Awarded when a played slot call is marked as a 250x hit. |
| Tournament join | `+10` | Awarded when a user joins a tournament. |
| Tournament match win | `+5` | Awarded when a user wins a tournament match. |
| Tournament win | `+100` | Awarded when a user wins the full tournament. |
| Admin points adjustment | `+/- custom` | Admins can add or subtract any amount manually. |
| System transaction | `+/- custom` | The backend can create custom point transactions through the admin/system endpoint. |

### Points Spent

| Action | Points | Notes |
| --- | ---: | --- |
| Reward redemption | `- product cost` | Deducted when a user redeems a reward product. |
| Redemption rejected | `+ product cost` | Refunded if an admin rejects a pending redemption. |

### Balance Rules

- Points are stored in the user's `pointsBalance` field.
- Every change is also written to `PointsTransaction` for history and auditing.
- Admin and system actions can adjust balances directly, so the transaction log is the best source for a full audit trail.

### Quick Summary

- Small recurring rewards: daily login, giveaway participation, slot call creation, tournament join.
- Performance rewards: giveaway wins, accepted slot calls, x250 hits, match wins, tournament wins.
- Spending: reward redemptions.
- Manual control: admin adjustments and system transactions.

