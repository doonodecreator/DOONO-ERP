#!/usr/bin/env python3
"""Measure a real DOONO GET endpoint; this script does not create or mutate data."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import statistics
import time
from collections import Counter
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def request_once(url: str, token: str, timeout: float) -> tuple[float, int, str]:
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(url, headers=headers, method="GET")
    started = time.perf_counter()
    try:
        with urlopen(request, timeout=timeout) as response:
            response.read(4096)
            return (time.perf_counter() - started) * 1000, response.status, ""
    except HTTPError as error:
        return (time.perf_counter() - started) * 1000, error.code, "http_error"
    except (URLError, TimeoutError) as error:
        return (time.perf_counter() - started) * 1000, 0, type(error).__name__


def percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round((len(ordered) - 1) * fraction)))
    return round(ordered[index], 2)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a read-only DOONO endpoint load test against staging or production.")
    parser.add_argument("url", help="Full HTTPS URL to one read-only endpoint")
    parser.add_argument("--token", default="", help="Bearer token; provide through a protected shell variable")
    parser.add_argument("--requests", type=int, default=100)
    parser.add_argument("--concurrency", type=int, default=10)
    parser.add_argument("--timeout", type=float, default=15.0)
    args = parser.parse_args()
    if not args.url.startswith("https://"):
        parser.error("Use HTTPS for a meaningful deployment test.")
    if args.requests < 1 or args.concurrency < 1 or args.concurrency > args.requests:
        parser.error("requests must be positive and concurrency must be between 1 and requests.")

    started = time.perf_counter()
    results: list[tuple[float, int, str]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [executor.submit(request_once, args.url, args.token, args.timeout) for _ in range(args.requests)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    latencies = [item[0] for item in results]
    statuses = Counter(str(item[1]) for item in results)
    failures = sum(1 for item in results if item[1] == 0 or item[1] >= 500)
    summary = {
        "url": args.url,
        "requests": len(results),
        "concurrency": args.concurrency,
        "elapsed_seconds": round(time.perf_counter() - started, 3),
        "requests_per_second": round(len(results) / max(time.perf_counter() - started, 0.001), 2),
        "status_counts": dict(statuses),
        "server_or_network_failure_count": failures,
        "failure_rate": round(failures / len(results), 4),
        "latency_ms": {
            "min": round(min(latencies), 2) if latencies else None,
            "mean": round(statistics.mean(latencies), 2) if latencies else None,
            "p50": percentile(latencies, 0.50),
            "p95": percentile(latencies, 0.95),
            "p99": percentile(latencies, 0.99),
            "max": round(max(latencies), 2) if latencies else None,
        },
    }
    print(json.dumps(summary, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
