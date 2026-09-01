# DOONO De Creator ERP — Performance Evidence

This directory contains a read-only HTTP load-test harness. It measures a real deployed endpoint; it does not fabricate data, create records, submit payments, or mutate school state. Run it against a staging deployment or a carefully approved production window.

## Usage

```bash
DOONO_TOKEN='REDACTED' python3 performance/load_test.py \
  'https://YOUR_DOONO_HOST/api/v1/public/school' \
  --token "$DOONO_TOKEN" \
  --requests 1000 \
  --concurrency 50 \
  --timeout 15
```

The harness reports status counts, server/network failures, failure rate, throughput, and latency percentiles. The API also returns `X-Request-ID` and `X-Response-Time-ms` headers. The request ID should be included in any incident record; bearer tokens must not be recorded in load-test output or logs.

## Required evidence before a capacity claim

A single local run is not proof that DOONO can serve a particular number of schools or concurrent requests. A meaningful capacity report must identify the deployment shape, database engine and size, queue workers, cache/locking backend, storage configuration, endpoint mix, authenticated tenant distribution, test duration, warm-up period, database saturation, queue backlog, error rate, p50/p95/p99 latency, and recovery behavior after the test. The run should be repeated at progressively higher concurrency until a documented service limit is reached.

| Profile | Purpose | Mutation policy | Minimum evidence |
|---|---|---|---|
| Smoke | Confirm routing and authentication | Read-only | One request and a valid `2xx` response |
| Baseline | Establish normal latency | Read-only | At least 100 requests with no server failures |
| Sustained | Observe queue/cache/database behavior | Read-only | Fixed concurrency and duration with health metrics |
| Capacity | Find a safe operating boundary | Read-only unless a separately approved test exists | Error and latency thresholds recorded with rollback plan |

No result in this repository is an extreme-scale proof. Claims such as hundreds of millions of schools or one million simultaneous API calls require a separately provisioned, instrumented, multi-region or otherwise appropriate infrastructure test and a documented architecture review.
