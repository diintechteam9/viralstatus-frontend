# Campaign task management (YOHO dashboard)

## Tab responsibilities

| Tab | Purpose |
|-----|---------|
| Overview | Campaign info, goals, images, T&C |
| Participants | View-only list, search, export CSV, select users for Tasks |
| Tasks | Content pools, assign reels, approval, timers, bulk ops |
| Analytics | Performance metrics and responses |
| Graphs | Charts and visual stats |

## API (backend)

- `GET /api/pools/task/campaign/:campaignId` — all tasks + campaign settings
- `POST /api/pools/task/bulk-assign` — assign with `strategy` (roundRobin, random, loadBalanced, skillBased)
- `POST /api/pools/task/bulk-accept` / `bulk-reject`
- `POST /api/pools/task/cancel` — time-based credit penalty
- `GET /api/pools/task/timer-status/:taskId?userId=&campaignId=`

## Cancellation rules

1. Before accept: no penalty  
2. Within `penaltyThresholdMinutes` (default 30) after accept: no penalty  
3. After threshold: deduct `cancellationPenalty` credits (default 2) from user wallet  

Timer UI uses client countdown + `localStorage` key `yoho_task_timers` for persistence.

## Campaign fields

`autoApproval`, `cancellationPenalty`, `penaltyThresholdMinutes`, `allowCancellation`
