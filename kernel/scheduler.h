/*
 * kernel/scheduler.h — Scheduler interface for NeuroSched
 *
 * Declares both the round-robin scheduler (Phase 2 baseline) and the
 * neural-network scheduler (Phase 4). Both operate on the same process table
 * and produce comparable metrics for the side-by-side comparison.
 */

#ifndef SCHEDULER_H
#define SCHEDULER_H

#include <stdint.h>
#include "process.h"

/* ─── Scheduler Metrics ──────────────────────────────────────────────────── */

/*
 * SchedMetrics — Collected after a full simulation run.
 * Used for the Phase 5 side-by-side comparison printed to the VGA display.
 */
typedef struct {
    uint32_t    total_ticks;            /* Total ticks to complete all processes    */
    uint32_t    avg_wait_hundredths;    /* Average wait time × 100 (for 2dp print)  */
    uint32_t    avg_turnaround_hundredths; /* Average turnaround time × 100         */
    uint32_t    throughput_per_100;     /* Processes completed per 100 ticks × 100  */
    uint32_t    nn_fallback_count;      /* # times NN fell back to RR (NN mode only) */
    uint32_t    n_procs;                /* Number of processes in the simulation    */
} sched_metrics_t;

/* ─── Workload Builder ───────────────────────────────────────────────────── */

/*
 * init_workload — Populate a process table with a synthetic multi-process
 * workload representative of a mixed CPU/IO system.
 *
 * The workload is deterministic (no random numbers in the kernel) so both
 * schedulers run on identical inputs. The Python trainer also receives
 * this exact dataset.
 *
 * procs[]  : Output array, must be at least WORKLOAD_SIZE entries.
 * Returns  : Number of processes initialized.
 */
#define WORKLOAD_SIZE   10
int init_workload(process_t procs[]);

/* ─── Round-Robin Scheduler ──────────────────────────────────────────────── */

/*
 * run_round_robin — Execute a complete simulation of the given workload under
 * pure round-robin scheduling with a fixed time quantum.
 *
 * On each tick, the current process runs for 1 tick of burst, then the
 * scheduler picks the next READY process in circular order.
 *
 * procs[]  : Array of processes to simulate (modified in-place, so pass a copy).
 * n_procs  : Number of processes.
 * log_csv  : If 1, emit CSV telemetry rows to serial for each scheduling decision.
 * metrics  : Output — filled with aggregate statistics after simulation.
 *
 * NOTE: The serial CSV log header is:
 *   pid,wait_ticks,remaining_burst,priority,io_bound,io_yield_count,score
 * where 'score' is computed in Python post-hoc and is 0 in the kernel log.
 */
void run_round_robin(process_t procs[], int n_procs, int log_csv,
                     sched_metrics_t *metrics);

/* ─── Neural Network Scheduler ───────────────────────────────────────────── */

/*
 * run_neural_scheduler — Execute the same simulation using the NN to pick
 * the next process at each tick.
 *
 * Uses nn_select_process() from nn_infer.h. If the model's confidence is
 * below NN_CONF_THRESH (defined in nn_weights.h), it falls back to round-robin
 * and logs a FALLBACK event to the VGA in yellow.
 *
 * procs[]  : Array of processes (pass a fresh copy from init_workload).
 * n_procs  : Number of processes.
 * metrics  : Output — filled with statistics + fallback count.
 */
void run_neural_scheduler(process_t procs[], int n_procs,
                          sched_metrics_t *metrics);

/* ─── Metrics Display ─────────────────────────────────────────────────────── */

/*
 * print_comparison — Print the side-by-side metrics table to VGA terminal.
 * Shows round-robin vs neural scheduler results in a formatted table.
 */
void print_comparison(const sched_metrics_t *rr_m, const sched_metrics_t *nn_m);

#endif /* SCHEDULER_H */
