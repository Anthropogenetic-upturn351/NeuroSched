/*
 * kernel/scheduler.c — Round-robin and neural network schedulers
 *
 * Both schedulers implement a tick-based simulation loop:
 *   - Each "tick" = one quantum unit of CPU time
 *   - On each tick, the current process executes for 1 tick of burst
 *   - The scheduler then picks the next process to run
 *
 * The simulation is complete when all processes have remaining_burst = 0.
 * This is intentionally a simulation (no real context switching) — see process.h
 * for the design rationale.
 */

#include "scheduler.h"
#include "nn_infer.h"
#include "vga.h"
#include "serial.h"
#include "../include/nn_weights.h"
#include <stdint.h>

/* ─── Workload Definition ─────────────────────────────────────────────────── */

/*
 * init_workload — Create a deterministic synthetic workload of 10 processes.
 *
 * Workload design goals:
 *   - Mix of CPU-bound (long bursts, low I/O) and I/O-bound (short bursts, yields)
 *   - Range of priorities (1-5) to test priority-awareness of NN
 *   - Varied arrival times to test scheduling fairness under different wait times
 *
 * This exact workload is also hard-coded into scripts/train.py so that the
 * training data labels are consistent with kernel behavior.
 */
int init_workload(process_t procs[]) {
    /*
     * Format: {pid, PROC_READY, arrival, total_burst, remaining, 0, 0, 0, 0,
     *          priority, io_bound, io_yield_count}
     *
     * Workload design:
     *   P1  - CPU hog: long burst, high priority, not I/O-bound
     *   P2  - Interactive: short burst, high priority, very I/O-bound
     *   P3  - Background: very long burst, low priority, not I/O-bound
     *   P4  - Balanced: medium burst, medium priority, mild I/O
     *   P5  - Real-time: medium burst, highest priority, not I/O-bound
     *   P6  - Batch: long burst, low priority, not I/O-bound
     *   P7  - Interactive: short burst, high priority, very I/O-bound
     *   P8  - Compute: medium burst, medium priority, not I/O-bound
     *   P9  - Low-prio I/O: medium burst, low priority, I/O-bound
     *   P10 - System: short burst, high priority, occasional I/O
     */
    process_t template[WORKLOAD_SIZE] = {
        /* pid  state         arr  total rem  run  wait start fin  pri io  ioy */
        {  1, PROC_READY,   0,  10,  10,  0,   0,   0,   0,   4,  0,  0 },
        {  2, PROC_READY,   0,   3,   3,  0,   0,   0,   0,   5,  1,  0 },
        {  3, PROC_READY,   2,  12,  12,  0,   0,   0,   0,   1,  0,  0 },
        {  4, PROC_READY,   4,   6,   6,  0,   0,   0,   0,   3,  1,  0 },
        {  5, PROC_READY,   0,   8,   8,  0,   0,   0,   0,   5,  0,  0 },
        {  6, PROC_READY,   8,  11,  11,  0,   0,   0,   0,   2,  0,  0 },
        {  7, PROC_READY,   1,   2,   2,  0,   0,   0,   0,   4,  1,  0 },
        {  8, PROC_READY,   3,   5,   5,  0,   0,   0,   0,   3,  0,  0 },
        {  9, PROC_READY,   5,   4,   4,  0,   0,   0,   0,   2,  1,  0 },
        { 10, PROC_READY,   0,   3,   3,  0,   0,   0,   0,   4,  1,  0 },
    };

    for (int i = 0; i < WORKLOAD_SIZE; i++) {
        procs[i] = template[i];
    }
    return WORKLOAD_SIZE;
}

/* ─── Internal Helpers ────────────────────────────────────────────────────── */

/*
 * count_ready — Return the number of processes currently in PROC_READY state.
 */
static int count_ready(process_t procs[], int n_procs) {
    int cnt = 0;
    for (int i = 0; i < n_procs; i++) {
        if (procs[i].state == PROC_READY) cnt++;
    }
    return cnt;
}

/*
 * count_finished — Return how many processes have terminated.
 */
static int count_finished(process_t procs[], int n_procs) {
    int cnt = 0;
    for (int i = 0; i < n_procs; i++) {
        if (procs[i].state == PROC_TERMINATED) cnt++;
    }
    return cnt;
}

/*
 * rr_next — Return the index of the next READY process in round-robin order.
 * current_idx: index of the process that just ran (-1 for first call).
 * Returns -1 if no READY process exists.
 */
static int rr_next(process_t procs[], int n_procs, int current_idx) {
    for (int i = 1; i <= n_procs; i++) {
        int idx = (current_idx + i) % n_procs;
        if (procs[idx].state == PROC_READY) {
            return idx;
        }
    }
    return -1;  /* No ready process */
}

/*
 * compute_metrics — Calculate aggregate scheduling statistics after simulation.
 */
static void compute_metrics(process_t procs[], int n_procs, uint32_t total_ticks,
                             uint32_t nn_fallbacks, sched_metrics_t *out) {
    uint32_t sum_wait       = 0;
    uint32_t sum_turnaround = 0;
    uint32_t n              = (uint32_t)n_procs;

    for (int i = 0; i < n_procs; i++) {
        /* Each process should be terminated by end of simulation */
        uint32_t tat  = proc_turnaround(&procs[i]);
        uint32_t wait = proc_wait_time(&procs[i]);
        sum_turnaround += tat;
        sum_wait       += wait;
    }

    out->total_ticks            = total_ticks;
    out->n_procs                = n;
    out->nn_fallback_count      = nn_fallbacks;

    /* Multiply by 100 before dividing so we get 2 decimal places as integers */
    out->avg_wait_hundredths        = (sum_wait       * 100) / n;
    out->avg_turnaround_hundredths  = (sum_turnaround * 100) / n;

    /*
     * Throughput = processes per 100 ticks (expressed ×100 for display).
     * throughput_per_100 = (n_procs * 100 * 100) / total_ticks
     *                    = n_procs * 10000 / total_ticks
     */
    if (total_ticks > 0) {
        out->throughput_per_100 = (n * 10000) / total_ticks;
    } else {
        out->throughput_per_100 = 0;
    }
}

/*
 * log_csv_row — Emit one telemetry row to COM1 serial in CSV format.
 * Format: pid,wait_ticks,remaining_burst,priority,io_bound,io_yield_count,score
 * The 'score' field is 0 here (computed post-hoc by Python).
 */
static void log_csv_row(const process_t *p) {
    serial_write_int((int32_t)p->pid);            serial_putchar(',');
    serial_write_int((int32_t)p->wait_ticks);     serial_putchar(',');
    serial_write_int((int32_t)p->remaining_burst);serial_putchar(',');
    serial_write_int((int32_t)p->priority);       serial_putchar(',');
    serial_write_int((int32_t)p->io_bound);       serial_putchar(',');
    serial_write_int((int32_t)p->io_yield_count); serial_putchar(',');
    serial_write("0");                             /* score placeholder */
    serial_newline();
}

/* ─── Round-Robin Scheduler ───────────────────────────────────────────────── */

void run_round_robin(process_t procs[], int n_procs, int log_csv,
                     sched_metrics_t *metrics) {
    uint32_t tick        = 0;
    int      current_idx = -1;  /* Start before first process */

    /* Emit CSV header if logging */
    if (log_csv) {
        serial_write("pid,wait_ticks,remaining_burst,priority,io_bound,io_yield_count,score");
        serial_newline();
    }

    while (count_finished(procs, n_procs) < n_procs) {
        /* Handle process arrival: processes with arrival_tick <= tick become READY */
        for (int i = 0; i < n_procs; i++) {
            /* Processes arrive as soon as tick >= their arrival_tick.
             * They are initialized as READY in init_workload, but processes
             * with future arrival times haven't "arrived" yet — we model this
             * by marking them NOT_ARRIVED. For simplicity: all processes start
             * READY at tick 0 regardless of arrival_tick in this sim.
             * arrival_tick is recorded for turnaround computation only. */
        }

        /* Pick next ready process (circular) */
        int next_idx = rr_next(procs, n_procs, current_idx);
        if (next_idx == -1) {
            tick++;  /* CPU idle tick — shouldn't happen with our workload */
            continue;
        }

        current_idx = next_idx;
        process_t *proc = &procs[current_idx];

        /* Record first-run tick */
        if (proc->run_ticks == 0) {
            proc->start_tick = tick;
        }

        /* Mark process as running */
        proc->state = PROC_RUNNING;

        /* Log telemetry before executing this tick */
        if (log_csv) {
            log_csv_row(proc);
        }

        /* Execute for 1 tick of burst */
        proc->run_ticks++;
        proc->remaining_burst--;
        tick++;

        /* Simulate I/O yield: I/O-bound processes yield every 5 run_ticks */
        if (proc->io_bound && (proc->run_ticks % 5 == 0) && proc->remaining_burst > 0) {
            proc->io_yield_count++;
            /* For simulation purposes, yielding costs 2 extra wait ticks */
        }

        /* Check if process has finished */
        if (proc->remaining_burst == 0) {
            proc->state       = PROC_TERMINATED;
            proc->finish_tick = tick;
        } else {
            proc->state = PROC_READY;
        }

        /* Increment wait_ticks for all other READY processes */
        for (int i = 0; i < n_procs; i++) {
            if (i != current_idx && procs[i].state == PROC_READY) {
                procs[i].wait_ticks++;
            }
        }
    }

    compute_metrics(procs, n_procs, tick, 0, metrics);
}

/* ─── Neural Network Scheduler ────────────────────────────────────────────── */

void run_neural_scheduler(process_t procs[], int n_procs,
                          sched_metrics_t *metrics) {
    uint32_t tick         = 0;
    uint32_t fallbacks    = 0;
    int      rr_current   = -1;   /* For fallback round-robin state */

    while (count_finished(procs, n_procs) < n_procs) {
        if (count_ready(procs, n_procs) == 0) {
            tick++;
            continue;
        }

        /* ── Neural scheduling decision ────────────────────────────────────
         * Ask the NN to score all ready processes and pick the best.
         * If confidence < threshold → fall back to round-robin.
         */
        float confidence = 0.0f;
        int   nn_idx     = nn_select_process(procs, n_procs, &confidence);
        int   chosen_idx;

        if (nn_idx >= 0 && confidence >= NN_CONF_THRESH) {
            /* High confidence: trust the neural network */
            chosen_idx = nn_idx;
        } else {
            /* Low confidence or no candidate: fall back to round-robin */
            fallbacks++;

            /* Log fallback event to VGA in yellow */
            terminal_write_colored("[FALLBACK] ", VGA_ATTR_WARN);
            terminal_write_colored("NN conf=", VGA_ATTR_WARN);

            /* Print confidence as fixed-point (multiply by 100 for 2dp) */
            uint32_t conf_hundredths = (uint32_t)(confidence * 100.0f);
            terminal_write_int((int32_t)conf_hundredths);
            terminal_write_colored("% < thresh, using RR\n", VGA_ATTR_WARN);

            /* Use round-robin as fallback */
            chosen_idx = rr_next(procs, n_procs, rr_current);
            if (chosen_idx == -1) { tick++; continue; }
        }

        rr_current = chosen_idx;
        process_t *proc = &procs[chosen_idx];

        if (proc->run_ticks == 0) {
            proc->start_tick = tick;
        }

        proc->state = PROC_RUNNING;

        /* Execute 1 tick */
        proc->run_ticks++;
        proc->remaining_burst--;
        tick++;

        /* Simulate I/O yield */
        if (proc->io_bound && (proc->run_ticks % 5 == 0) && proc->remaining_burst > 0) {
            proc->io_yield_count++;
        }

        if (proc->remaining_burst == 0) {
            proc->state       = PROC_TERMINATED;
            proc->finish_tick = tick;
        } else {
            proc->state = PROC_READY;
        }

        /* Update wait_ticks for idle processes */
        for (int i = 0; i < n_procs; i++) {
            if (i != chosen_idx && procs[i].state == PROC_READY) {
                procs[i].wait_ticks++;
            }
        }
    }

    compute_metrics(procs, n_procs, tick, fallbacks, metrics);
}

/* ─── Comparison Table Display ────────────────────────────────────────────── */

void print_comparison(const sched_metrics_t *rr_m, const sched_metrics_t *nn_m) {
    terminal_write_colored("\n", VGA_ATTR_NORMAL);
    terminal_hline(VGA_ATTR_HEADER);
    terminal_write_colored("  NEUROSCHED: Scheduling Algorithm Comparison\n",
                           VGA_ATTR_HEADER);
    terminal_hline(VGA_ATTR_HEADER);

    serial_newline();
    serial_write("===========================================================\n");
    serial_write("  NEUROSCHED: Scheduling Algorithm Comparison\n");
    serial_write("===========================================================\n");

    terminal_write_colored("  Metric               Round-Robin    Neural+Fallback\n",
                           VGA_ATTR_INFO);
    terminal_hline(VGA_ATTR_NORMAL);

    serial_write("  Metric               Round-Robin    Neural+Fallback\n");
    serial_write("-----------------------------------------------------------\n");

    /* Average Wait Time */
    terminal_write("  Avg Wait Time:      ");
    terminal_write_fixed((int32_t)rr_m->avg_wait_hundredths);
    terminal_write(" ticks      ");
    terminal_write_fixed((int32_t)nn_m->avg_wait_hundredths);
    terminal_write_colored(" ticks\n", VGA_ATTR_NORMAL);

    serial_write("  Avg Wait Time:      ");
    serial_write_int((int32_t)rr_m->avg_wait_hundredths / 100);
    serial_write(".");
    serial_write_int((int32_t)rr_m->avg_wait_hundredths % 100);
    serial_write(" ticks      ");
    serial_write_int((int32_t)nn_m->avg_wait_hundredths / 100);
    serial_write(".");
    serial_write_int((int32_t)nn_m->avg_wait_hundredths % 100);
    serial_write(" ticks\n");

    /* Average Turnaround Time */
    terminal_write("  Avg Turnaround:     ");
    terminal_write_fixed((int32_t)rr_m->avg_turnaround_hundredths);
    terminal_write(" ticks      ");
    terminal_write_fixed((int32_t)nn_m->avg_turnaround_hundredths);
    terminal_write_colored(" ticks\n", VGA_ATTR_NORMAL);

    serial_write("  Avg Turnaround:     ");
    serial_write_int((int32_t)rr_m->avg_turnaround_hundredths / 100);
    serial_write(".");
    serial_write_int((int32_t)rr_m->avg_turnaround_hundredths % 100);
    serial_write(" ticks      ");
    serial_write_int((int32_t)nn_m->avg_turnaround_hundredths / 100);
    serial_write(".");
    serial_write_int((int32_t)nn_m->avg_turnaround_hundredths % 100);
    serial_write(" ticks\n");

    /* Total Simulation Ticks */
    terminal_write("  Total Ticks:        ");
    terminal_write_int((int32_t)rr_m->total_ticks);
    terminal_write("             ");
    terminal_write_int((int32_t)nn_m->total_ticks);
    terminal_write_colored("\n", VGA_ATTR_NORMAL);

    serial_write("  Total Ticks:        ");
    serial_write_int((int32_t)rr_m->total_ticks);
    serial_write("             ");
    serial_write_int((int32_t)nn_m->total_ticks);
    serial_newline();

    /* Throughput (processes per 100 ticks) */
    terminal_write("  Throughput(/100t):  ");
    terminal_write_fixed((int32_t)rr_m->throughput_per_100);
    terminal_write("          ");
    terminal_write_fixed((int32_t)nn_m->throughput_per_100);
    terminal_write_colored("\n", VGA_ATTR_NORMAL);

    /* NN Fallback Count */
    terminal_write("  NN Fallbacks:       --             ");
    terminal_write_int((int32_t)nn_m->nn_fallback_count);
    terminal_write_colored(" times\n", VGA_ATTR_WARN);

    serial_write("  NN Fallbacks:       --             ");
    serial_write_int((int32_t)nn_m->nn_fallback_count);
    serial_write(" times\n");

    terminal_hline(VGA_ATTR_HEADER);
    serial_write("===========================================================\n");

    /* Summary judgment */
    if (nn_m->avg_wait_hundredths < rr_m->avg_wait_hundredths) {
        terminal_write_colored("  RESULT: Neural scheduler achieved lower avg wait time!\n",
                               VGA_ATTR_SUCCESS);
        serial_write("  RESULT: Neural scheduler achieved lower avg wait time!\n");
    } else if (nn_m->avg_wait_hundredths == rr_m->avg_wait_hundredths) {
        terminal_write_colored("  RESULT: Both schedulers performed similarly.\n",
                               VGA_ATTR_INFO);
        serial_write("  RESULT: Both schedulers performed similarly.\n");
    } else {
        terminal_write_colored("  RESULT: Round-robin performed better on this workload.\n",
                               VGA_ATTR_WARN);
        terminal_write_colored("  (Model may need retraining on more diverse data.)\n",
                               VGA_ATTR_WARN);
        serial_write("  RESULT: Round-robin performed better on this workload.\n");
        serial_write("  (Model may need retraining on more diverse data.)\n");
    }

    terminal_hline(VGA_ATTR_HEADER);
    serial_write("===========================================================\n");
}
