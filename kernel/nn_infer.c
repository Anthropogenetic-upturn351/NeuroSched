/*
 * kernel/nn_infer.c — Neural network forward-pass inference engine
 *
 * Implements the MLP defined by weights in include/nn_weights.h.
 * Architecture: 5 inputs → 8 hidden (ReLU) → 1 output (Sigmoid)
 *
 * Design principles:
 *   - Zero dynamic memory allocation: all buffers on the stack
 *   - No external dependencies: no math.h sigmoid — we implement it ourselves
 *   - Uses float arithmetic enabled by the x87 FPU (initialized at boot)
 *   - All weight lookups are compile-time constant arrays from nn_weights.h
 */

#include "nn_infer.h"
#include "../include/nn_weights.h"
#include <stdint.h>

/* ─── Activation Functions ────────────────────────────────────────────────── */

/*
 * relu — Rectified Linear Unit activation.
 * relu(x) = max(0, x). Trivial but essential: allows the hidden layer to
 * model non-linear decision boundaries.
 */
static inline float relu(float x) {
    return x > 0.0f ? x : 0.0f;
}

/*
 * sigmoid — Logistic sigmoid function.
 * sigmoid(x) = 1 / (1 + e^(-x))
 *
 * We implement exp(-x) using a minimax polynomial approximation valid for
 * x ∈ [-10, 10], which covers all practical MLP output ranges.
 * This avoids depending on libm's expf() which isn't available freestanding.
 *
 * For |x| > 10, sigmoid is essentially 0 or 1, so we clamp.
 */
static float sigmoid(float x) {
    /* Clamp to prevent overflow in the exponential approximation */
    if (x >= 10.0f)  return 0.9999f;
    if (x <= -10.0f) return 0.0001f;

    /*
     * Compute e^x using a 6-term Taylor series around 0.
     * e^x ≈ 1 + x + x²/2 + x³/6 + x⁴/24 + x⁵/120 + x⁶/720
     *
     * This is accurate to ~0.5% for |x| ≤ 4 and degrades gracefully
     * outside that range. For our 0→1 output layer, this is sufficient.
     * The clamping above prevents catastrophic error for large |x|.
     */
    float ex;
    if (x >= 0.0f) {
        float t = x;
        ex = 1.0f + t + (t*t)/2.0f + (t*t*t)/6.0f
                      + (t*t*t*t)/24.0f + (t*t*t*t*t)/120.0f;
        return ex / (1.0f + ex);  /* sigmoid(x) = e^x / (1 + e^x) for x >= 0 */
    } else {
        float t = -x;
        float enx = 1.0f + t + (t*t)/2.0f + (t*t*t)/6.0f
                             + (t*t*t*t)/24.0f + (t*t*t*t*t)/120.0f;
        return 1.0f / (1.0f + enx);   /* sigmoid(x) = 1 / (1 + e^-x) */
    }
}

/* ─── Feature Normalization ───────────────────────────────────────────────── */

/*
 * normalize — Min-max scale a value to [0, 1].
 * feature_min and feature_max come from the training data statistics
 * exported in nn_weights.h. If min == max (degenerate), return 0.5.
 */
static inline float normalize(float val, float feat_min, float feat_max) {
    float range = feat_max - feat_min;
    if (range <= 0.0f) return 0.5f;
    float norm = (val - feat_min) / range;
    /* Clamp to [0, 1] to handle test-time values outside training range */
    if (norm < 0.0f) norm = 0.0f;
    if (norm > 1.0f) norm = 1.0f;
    return norm;
}

/* ─── MLP Forward Pass ────────────────────────────────────────────────────── */

float nn_score_process(const process_t *p, uint32_t max_wait,
                       uint32_t max_burst) {
    /*
     * Build the 5-element input feature vector.
     * Features are chosen to capture all dimensions relevant to scheduling
     * quality: urgency (wait), workload size (burst), priority, I/O behavior.
     *
     * Feature 0: wait_ticks           — higher = process has waited longer
     * Feature 1: remaining_burst      — lower = process finishes sooner
     * Feature 2: priority             — higher = should run sooner
     * Feature 3: io_bound             — 1 if I/O-heavy (prefer short quanta)
     * Feature 4: io_yield_count       — history of voluntary yields for I/O
     *
     * All normalized using constants from nn_weights.h (training data stats).
     */
    float features[NN_INPUT_DIM];

    /* Use per-call max_wait/max_burst for context-aware normalization */
    float dynamic_max_wait  = (float)(max_wait  > 0 ? max_wait  : 1);
    float dynamic_max_burst = (float)(max_burst > 0 ? max_burst : 1);

    features[0] = (float)p->wait_ticks      / dynamic_max_wait;
    features[1] = (float)p->remaining_burst / dynamic_max_burst;
    features[2] = normalize((float)p->priority,
                             NN_FEAT_MIN_PRIORITY, NN_FEAT_MAX_PRIORITY);
    features[3] = (float)p->io_bound;          /* Already 0 or 1 */
    features[4] = normalize((float)p->io_yield_count,
                             NN_FEAT_MIN_IO_YIELD, NN_FEAT_MAX_IO_YIELD);

    /* ── Layer 1: Linear transform + ReLU ──────────────────────────────────
     * hidden[j] = relu( Σ_i  W1[i][j] * features[i] + B1[j] )
     */
    float hidden[NN_HIDDEN_DIM];
    for (int j = 0; j < NN_HIDDEN_DIM; j++) {
        float acc = B1[j];
        for (int i = 0; i < NN_INPUT_DIM; i++) {
            acc += W1[i][j] * features[i];
        }
        hidden[j] = relu(acc);
    }

    /* ── Layer 2: Linear transform + Sigmoid ────────────────────────────────
     * output = sigmoid( Σ_j  W2[j][0] * hidden[j] + B2[0] )
     */
    float logit = B2[0];
    for (int j = 0; j < NN_HIDDEN_DIM; j++) {
        logit += W2[j][0] * hidden[j];
    }

    return sigmoid(logit);
}

/* ─── Process Selection ───────────────────────────────────────────────────── */

int nn_select_process(process_t procs[], int n_procs,
                      float *confidence_out) {
    /*
     * Score every READY process. The process with the highest score wins.
     * This is the "per-process scoring" pattern: we call the MLP once per
     * candidate, which works for any queue length (no fixed output head size).
     *
     * Context-aware normalization: find max_wait and max_burst among READY
     * processes first, so the feature normalization reflects current state.
     */
    uint32_t max_wait  = 1;
    uint32_t max_burst = 1;

    for (int i = 0; i < n_procs; i++) {
        if (procs[i].state == PROC_READY) {
            if (procs[i].wait_ticks      > max_wait)  max_wait  = procs[i].wait_ticks;
            if (procs[i].remaining_burst > max_burst) max_burst = procs[i].remaining_burst;
        }
    }

    float best_score = -1.0f;
    int   best_idx   = -1;

    for (int i = 0; i < n_procs; i++) {
        if (procs[i].state != PROC_READY) continue;

        float score = nn_score_process(&procs[i], max_wait, max_burst);
        if (score > best_score) {
            best_score = score;
            best_idx   = i;
        }
    }

    if (confidence_out) {
        *confidence_out = (best_idx >= 0) ? best_score : 0.0f;
    }
    return best_idx;
}
