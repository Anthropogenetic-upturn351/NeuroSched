/*
 * kernel/process.h — Process Control Block (PCB) definition for NeuroSched
 *
 * This struct holds all the state needed by both the round-robin scheduler
 * and the neural network scheduler. The NN uses a subset of these fields as
 * its input feature vector.
 *
 * Design note: This is a simulation-only PCB. NeuroSched does not implement
 * real preemptive context switching (which would require saving/restoring full
 * CPU register state and managing separate stacks per process). Instead, we
 * simulate a multi-process workload with synthetic burst times, so the
 * scheduler decision logic can be trained and tested without full preemption.
 * This is an explicit, intentional scope decision — noted in the README.
 */

#ifndef PROCESS_H
#define PROCESS_H

#include <stdint.h>

/* ─── Process State Enum ─────────────────────────────────────────────────── */
typedef enum {
    PROC_READY      = 0,    /* Process is ready to run, waiting for CPU     */
    PROC_RUNNING    = 1,    /* Process is currently executing (1 at a time)  */
    PROC_TERMINATED = 2,    /* Process has finished all its CPU work         */
} proc_state_t;

/* ─── Maximum number of concurrent simulated processes ───────────────────── */
#define MAX_PROCS   16

/* ─── Process Control Block ──────────────────────────────────────────────── */
typedef struct {
    uint32_t    pid;                /* Unique process identifier (1-based)   */

    proc_state_t state;             /* Current lifecycle state               */

    /* ── Timing fields (all in scheduler ticks, 1 tick = 1 quantum) ──────── */
    uint32_t    arrival_tick;       /* Tick at which this process was created */
    uint32_t    total_burst;        /* Total CPU ticks this process requires   */
    uint32_t    remaining_burst;    /* CPU ticks still needed to complete      */
    uint32_t    run_ticks;          /* Total ticks this process has run so far */
    uint32_t    wait_ticks;         /* Total ticks spent in READY (not running) */
    uint32_t    start_tick;         /* Tick when it first got the CPU          */
    uint32_t    finish_tick;        /* Tick when remaining_burst reached 0     */

    /* ── Scheduling attributes ───────────────────────────────────────────── */
    uint8_t     priority;           /* Static priority: 1 (low) – 5 (high)   */
    uint8_t     io_bound;           /* 1 = I/O-heavy process, 0 = CPU-bound   */
    uint8_t     io_yield_count;     /* How many times it has "yielded for I/O" */

} process_t;

/* ─── Derived metrics (computed post-simulation) ─────────────────────────── */
/*
 * Turnaround time = finish_tick - arrival_tick
 *   (total time from creation to completion)
 *
 * Wait time = turnaround time - total_burst
 *   (time spent waiting, not executing)
 */
static inline uint32_t proc_turnaround(const process_t *p) {
    return p->finish_tick - p->arrival_tick;
}

static inline uint32_t proc_wait_time(const process_t *p) {
    return proc_turnaround(p) - p->total_burst;
}

#endif /* PROCESS_H */
