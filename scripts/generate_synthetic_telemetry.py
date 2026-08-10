#!/usr/bin/env python3
"""
scripts/generate_synthetic_telemetry.py

Standalone script to generate synthetic scheduler telemetry in the same
CSV format as the kernel's COM1 serial output. Useful for testing the
training pipeline without needing to build and boot the kernel first.

The generated data matches the exact workload defined in kernel/scheduler.c's
init_workload() function, so training on this synthetic data produces weights
that are consistent with the real kernel telemetry.

Usage:
    python scripts/generate_synthetic_telemetry.py > telemetry.csv
    python scripts/train.py --data telemetry.csv
"""

import sys

# Mirror of init_workload() from kernel/scheduler.c
# Format: (pid, total_burst, priority, io_bound)
WORKLOAD = [
    (1,  60, 4, 0),
    (2,  12, 5, 1),
    (3,  80, 1, 0),
    (4,  35, 3, 1),
    (5,  45, 5, 0),
    (6,  70, 2, 0),
    (7,  10, 4, 1),
    (8,  30, 3, 0),
    (9,  25, 2, 1),
    (10, 18, 4, 1),
]

def simulate_round_robin():
    """Simulate round-robin scheduling and emit CSV rows matching kernel format."""
    # Initialize processes
    procs = []
    for pid, total_burst, priority, io_bound in WORKLOAD:
        procs.append({
            'pid': pid,
            'remaining_burst': total_burst,
            'total_burst': total_burst,
            'priority': priority,
            'io_bound': io_bound,
            'wait_ticks': 0,
            'run_ticks': 0,
            'io_yield_count': 0,
            'state': 'READY',
        })

    print("# NeuroSched Synthetic Round-Robin Telemetry Log")
    print("# Format: pid,wait_ticks,remaining_burst,priority,io_bound,io_yield_count,score")
    print("pid,wait_ticks,remaining_burst,priority,io_bound,io_yield_count,score")

    current_idx = -1
    tick = 0

    while any(p['state'] != 'TERMINATED' for p in procs):
        # Find next ready process (round-robin)
        found = False
        for i in range(1, len(procs) + 1):
            idx = (current_idx + i) % len(procs)
            if procs[idx]['state'] == 'READY':
                current_idx = idx
                found = True
                break

        if not found:
            tick += 1
            continue

        p = procs[current_idx]

        # Emit telemetry row before executing
        print(f"{p['pid']},{p['wait_ticks']},{p['remaining_burst']},"
              f"{p['priority']},{p['io_bound']},{p['io_yield_count']},0")

        # Execute 1 tick
        p['state'] = 'RUNNING'
        p['run_ticks'] += 1
        p['remaining_burst'] -= 1
        tick += 1

        # Simulate I/O yield
        if p['io_bound'] and (p['run_ticks'] % 5 == 0) and p['remaining_burst'] > 0:
            p['io_yield_count'] += 1

        if p['remaining_burst'] == 0:
            p['state'] = 'TERMINATED'
        else:
            p['state'] = 'READY'

        # Increment wait_ticks for all other READY processes
        for i, other in enumerate(procs):
            if i != current_idx and other['state'] == 'READY':
                other['wait_ticks'] += 1

    print(f"# Simulation complete: {tick} total ticks", file=sys.stderr)


if __name__ == '__main__':
    simulate_round_robin()
