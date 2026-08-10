export const kernelCodeSnippets = {
  bootStub: `/* boot/boot.S — Multiboot2 Stub & FPU Setup */
.equ MB2_MAGIC, 0xE85250D6
.equ MB1_MAGIC, 0x1BADB002

.section .text
.global _start
_start:
    movl    %eax, %esi          /* Save Multiboot magic in ESI */
    movl    %ebx, %edi          /* Save MBI pointer in EDI */

    /* Setup 16 KiB BSS stack */
    movl    $stackTop, %esp

    /* Enable x87 FPU using ECX (preserving EAX magic!) */
    movl    %cr0, %ecx
    andl    $0xFFFFFFFB, %ecx  /* CR0.EM = 0 */
    orl     $2, %ecx           /* CR0.MP = 1 */
    andl    $0xFFFFFFF7, %ecx  /* CR0.TS = 0 */
    movl    %ecx, %cr0
    fninit

    pushl   %edi                /* Pass MBI pointer */
    pushl   %esi                /* Pass magic */
    call    kernelMain          /* Jump to C kernel entry point */`,

  nnInference: `/* kernel/nn_infer.c — Freestanding C MLP Inference Engine */
#include "nn_infer.h"
#include "nn_weights.h"

static float sigmoid(float x) {
    if (x >= 10.0f)  return 0.9999f;
    if (x <= -10.0f) return 0.0001f;

    /* 6-term Taylor expansion approximation — 0 math.h dependencies */
    if (x >= 0.0f) {
        float t = x;
        float ex = 1.0f + t + (t*t)/2.0f + (t*t*t)/6.0f + (t*t*t*t)/24.0f;
        return ex / (1.0f + ex);
    } else {
        float t = -x;
        float enx = 1.0f + t + (t*t)/2.0f + (t*t*t)/6.0f + (t*t*t*t)/24.0f;
        return 1.0f / (1.0f + enx);
    }
}

float nnScoreProcess(const process_t *p, uint32_t maxWait, uint32_t maxBurst) {
    float features[NN_INPUT_DIM];
    features[0] = (float)p->waitTicks / maxWait;
    features[1] = (float)p->remainingBurst / maxBurst;
    features[2] = (float)p->priority / 5.0f;
    features[3] = (float)p->ioBound;
    features[4] = (float)p->ioYieldCount / 7.0f;

    /* Layer 1: W1[5][8] Linear transform + ReLU */
    float hidden[NN_HIDDEN_DIM];
    for (int j = 0; j < NN_HIDDEN_DIM; j++) {
        float acc = B1[j];
        for (int i = 0; i < NN_INPUT_DIM; i++) {
            acc += W1[i][j] * features[i];
        }
        hidden[j] = acc > 0.0f ? acc : 0.0f; /* ReLU */
    }

    /* Layer 2: W2[8][1] Linear transform + Sigmoid */
    float logit = B2[0];
    for (int j = 0; j < NN_HIDDEN_DIM; j++) {
        logit += W2[j][0] * hidden[j];
    }
    return sigmoid(logit);
}`,

  schedulerLogic: `/* kernel/scheduler.c — Neural Scheduler & Confidence Fallback */
void runNeuralScheduler(process_t procs[], int nProcs, sched_metrics_t *metrics) {
    uint32_t tick = 0;
    uint32_t fallbacks = 0;

    while (countFinished(procs, nProcs) < nProcs) {
        float confidence = 0.0f;
        int chosenIdx = nnSelectProcess(procs, nProcs, &confidence);

        /* Confidence Fallback Mechanism: if confidence < threshold, use RR */
        if (confidence < NN_CONF_THRESH) {
            fallbacks++;
            chosenIdx = rrNextProcess(procs, nProcs, chosenIdx);
            terminalWriteColored("[FALLBACK] Low confidence, using RR\\n", VGA_ATTR_WARN);
        }

        /* Execute chosen process for 1 tick */
        process_t *proc = &procs[chosenIdx];
        proc->remainingBurst--;
        tick++;
    }
}`,

  trainerScript: `# scripts/train.py — PyTorch-free SGD Trainer
import numpy as np

def computeLabels(data):
    """Compute optimal target score based on wait, burst, and priority"""
    normWait = safeNorm(data[:, 1])
    normBurst = safeNorm(data[:, 2])
    normPriority = safeNorm(data[:, 3])

    # Target formula: 40% priority + 40% wait - 20% burst
    scores = 0.40 * normPriority + 0.40 * normWait - 0.20 * normBurst
    return np.clip(scores, 0.05, 0.95)
`
};
