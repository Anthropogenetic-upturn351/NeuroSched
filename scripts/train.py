#!/usr/bin/env python3
"""
scripts/train.py — Neural network trainer for NeuroSched scheduler

Trains a small MLP (5→8→1) on scheduling telemetry logged by the kernel's
round-robin scheduler via COM1 serial. Exports trained weights to
include/nn_weights.h for inclusion in the kernel build.

Usage:
    python scripts/train.py --data telemetry.csv [--epochs 500] [--lr 0.01]

The CSV input is captured from QEMU's serial port:
    qemu-system-i386 -kernel kernel.bin -serial file:telemetry.csv ...

After running this script, rebuild the kernel to bake in the new weights:
    make clean && make

Design notes:
    - Uses only numpy (no PyTorch/TensorFlow) — keeps the dependency minimal
    - Implements SGD with momentum from scratch to understand what's happening
    - Target label ('score') is computed here, not logged by the kernel:
        score = priority_weight * normalized_priority
              + wait_weight    * normalized_wait
              - burst_weight   * normalized_burst
      This models "ideal" scheduling preference based on priority + starvation
      prevention + short-job preference (a blend of SJF + priority + aging).
    - The training dataset is the round-robin telemetry — the NN learns to
      replicate (and ideally improve upon) optimal hand-crafted scheduling logic.
"""

import numpy as np
import argparse
import os
import sys
from datetime import datetime

# ─── Activation Functions ──────────────────────────────────────────────────────

def relu(x):
    return np.maximum(0, x)

def relu_grad(x):
    """Derivative of ReLU: 1 where x > 0, else 0."""
    return (x > 0).astype(float)

def sigmoid(x):
    """Numerically stable sigmoid."""
    return np.where(x >= 0,
                    1.0 / (1.0 + np.exp(-x)),
                    np.exp(x) / (1.0 + np.exp(x)))

def sigmoid_grad(s):
    """Derivative of sigmoid given sigmoid output s: s * (1 - s)."""
    return s * (1.0 - s)

# ─── MLP Implementation ─────────────────────────────────────────────────────

class MLP:
    """
    Minimal 2-layer MLP: input → hidden (ReLU) → output (Sigmoid).
    Weights initialized with He initialization (good for ReLU layers).
    """

    def __init__(self, input_dim=5, hidden_dim=8, output_dim=1, seed=42):
        rng = np.random.default_rng(seed)

        # He initialization for ReLU layer: scale = sqrt(2 / fan_in)
        scale1 = np.sqrt(2.0 / input_dim)
        scale2 = np.sqrt(2.0 / hidden_dim)

        self.W1 = rng.standard_normal((input_dim, hidden_dim)) * scale1
        self.b1 = np.zeros(hidden_dim)
        self.W2 = rng.standard_normal((hidden_dim, output_dim)) * scale2
        self.b2 = np.zeros(output_dim)

        # Momentum terms for SGD with momentum (beta = 0.9)
        self.vW1 = np.zeros_like(self.W1)
        self.vb1 = np.zeros_like(self.b1)
        self.vW2 = np.zeros_like(self.W2)
        self.vb2 = np.zeros_like(self.b2)

    def forward(self, X):
        """
        X: (N, input_dim) batch of feature vectors.
        Returns: (N, output_dim) predictions in (0, 1).
        """
        self._z1 = X @ self.W1 + self.b1      # (N, hidden_dim) pre-activation
        self._a1 = relu(self._z1)              # (N, hidden_dim) hidden activations
        self._z2 = self._a1 @ self.W2 + self.b2  # (N, output_dim) logit
        self._a2 = sigmoid(self._z2)           # (N, output_dim) output in (0,1)
        return self._a2

    def backward(self, X, y_true, lr=0.01, momentum=0.9):
        """
        Backpropagation + SGD with momentum update.
        X: (N, input_dim), y_true: (N, 1) target scores.
        Returns: scalar MSE loss for this batch.
        """
        N = X.shape[0]
        y_pred = self._a2  # Already computed in forward pass

        # MSE loss: L = (1/N) * sum((y_pred - y_true)^2)
        loss = float(np.mean((y_pred - y_true) ** 2))

        # Output layer gradient: dL/dz2 = (2/N) * (y_pred - y_true) * sigmoid'(z2)
        dL_da2 = (2.0 / N) * (y_pred - y_true)                   # (N, 1)
        dL_dz2 = dL_da2 * sigmoid_grad(self._a2)                   # (N, 1)

        # Gradients for W2, b2
        dL_dW2 = self._a1.T @ dL_dz2                               # (hidden, 1)
        dL_db2 = dL_dz2.sum(axis=0)                                 # (1,)

        # Hidden layer gradient: dL/dz1 = (dL/dz2 * W2^T) * relu'(z1)
        dL_da1 = dL_dz2 @ self.W2.T                                 # (N, hidden)
        dL_dz1 = dL_da1 * relu_grad(self._z1)                       # (N, hidden)

        # Gradients for W1, b1
        dL_dW1 = X.T @ dL_dz1                                       # (input, hidden)
        dL_db1 = dL_dz1.sum(axis=0)                                  # (hidden,)

        # SGD with momentum update
        beta = momentum
        self.vW1 = beta * self.vW1 - lr * dL_dW1
        self.vb1 = beta * self.vb1 - lr * dL_db1
        self.vW2 = beta * self.vW2 - lr * dL_dW2
        self.vb2 = beta * self.vb2 - lr * dL_db2

        self.W1 += self.vW1
        self.b1 += self.vb1
        self.W2 += self.vW2
        self.b2 += self.vb2

        return loss

# ─── Data Loading and Preprocessing ─────────────────────────────────────────

def load_telemetry(csv_path):
    """
    Load the CSV telemetry log written by the kernel's round-robin scheduler.
    Skip comment lines (starting with '#') and the header row.
    Returns: numpy array of shape (N, 6) with columns:
        [pid, wait_ticks, remaining_burst, priority, io_bound, io_yield_count]
    """
    rows = []
    with open(csv_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            # Skip header row
            if line.startswith('pid'):
                continue
            parts = line.split(',')
            if len(parts) < 6:
                continue
            try:
                # Columns: pid, wait_ticks, remaining_burst, priority, io_bound,
                #           io_yield_count, score (score is 0 in kernel log)
                row = [float(parts[i]) for i in range(6)]
                rows.append(row)
            except ValueError:
                continue

    if not rows:
        print(f"ERROR: No valid data rows found in {csv_path}")
        sys.exit(1)

    data = np.array(rows, dtype=float)
    print(f"Loaded {len(data)} telemetry rows from {csv_path}")
    return data


def compute_labels(data):
    """
    Compute the target 'score' for each scheduling decision.
    The score models what an ideal scheduler would prefer:
        score = w_priority * norm(priority)
              + w_wait     * norm(wait_ticks)     [starvation prevention]
              - w_burst    * norm(remaining_burst) [short-job preference]

    All terms normalized to [0, 1] before weighting.
    Final score clipped to [0.05, 0.95] to prevent sigmoid saturation during training.
    """
    wait_ticks      = data[:, 1]  # col 1
    remaining_burst = data[:, 2]  # col 2
    priority        = data[:, 3]  # col 3

    def safe_norm(arr):
        mn, mx = arr.min(), arr.max()
        if mx - mn < 1e-6:
            return np.full_like(arr, 0.5)
        return (arr - mn) / (mx - mn)

    norm_wait     = safe_norm(wait_ticks)
    norm_burst    = safe_norm(remaining_burst)
    norm_priority = safe_norm(priority)

    # Weight coefficients (tunable)
    w_priority = 0.40   # Priority is the strongest signal
    w_wait     = 0.40   # Starvation prevention equally important
    w_burst    = 0.20   # Short-job preference (mild)

    scores = (w_priority * norm_priority
            + w_wait     * norm_wait
            - w_burst    * norm_burst)

    # Clip to prevent extreme values that cause sigmoid saturation
    scores = np.clip(scores, 0.05, 0.95)
    return scores.reshape(-1, 1)


def build_features(data):
    """
    Build and normalize the feature matrix from raw telemetry data.
    Returns: (X_norm, feat_min, feat_max) where X_norm is (N, 5).

    Feature order matches nn_infer.c:
        0: wait_ticks
        1: remaining_burst
        2: priority
        3: io_bound
        4: io_yield_count
    """
    # Select feature columns: wait(1), burst(2), priority(3), io_bound(4), io_yield(5)
    feat_cols = [1, 2, 3, 4, 5]
    X = data[:, feat_cols]

    feat_min = X.min(axis=0)
    feat_max = X.max(axis=0)

    # Min-max normalize each feature to [0, 1]
    X_norm = np.zeros_like(X)
    for j in range(X.shape[1]):
        rng = feat_max[j] - feat_min[j]
        if rng < 1e-6:
            X_norm[:, j] = 0.5
        else:
            X_norm[:, j] = (X[:, j] - feat_min[j]) / rng

    return X_norm, feat_min, feat_max

# ─── Weight Export ─────────────────────────────────────────────────────────

def float_to_c(f):
    """Format a float for C source code with 6 decimal places and 'f' suffix."""
    return f"{f:.6f}f"


def export_weights(model, feat_min, feat_max, output_path):
    """
    Write the trained weights to a C header file that the kernel can include.
    The format matches exactly what nn_infer.c expects.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = [
        "/*",
        f" * include/nn_weights.h — Trained Neural Network Weights",
        f" * AUTO-GENERATED by scripts/train.py on {timestamp}",
        f" * DO NOT EDIT MANUALLY — run 'python scripts/train.py' to regenerate",
        f" *",
        f" * Architecture: {model.W1.shape[0]} inputs -> {model.W1.shape[1]} hidden (ReLU) -> {model.W2.shape[1]} output (Sigmoid)",
        f" * Parameters: {model.W1.size + model.b1.size + model.W2.size + model.b2.size} floats = {(model.W1.size + model.b1.size + model.W2.size + model.b2.size) * 4} bytes",
        " */",
        "",
        "#ifndef NN_WEIGHTS_H",
        "#define NN_WEIGHTS_H",
        "",
        "/* Architecture Dimensions */",
        f"#define NN_INPUT_DIM    {model.W1.shape[0]}",
        f"#define NN_HIDDEN_DIM   {model.W1.shape[1]}",
        f"#define NN_OUTPUT_DIM   {model.W2.shape[1]}",
        "",
        "/* Confidence fallback threshold: if NN output < this, use round-robin */",
        "#define NN_CONF_THRESH  0.65f",
        "",
        "/* Feature normalization: priority range */",
        f"#define NN_FEAT_MIN_PRIORITY    {float_to_c(feat_min[2])}",
        f"#define NN_FEAT_MAX_PRIORITY    {float_to_c(feat_max[2])}",
        "",
        "/* Feature normalization: io_yield_count range */",
        f"#define NN_FEAT_MIN_IO_YIELD    {float_to_c(feat_min[4])}",
        f"#define NN_FEAT_MAX_IO_YIELD    {float_to_c(feat_max[4])}",
        "",
        "/* Layer 1 Weights: W1[INPUT_DIM][HIDDEN_DIM] */",
        f"static const float W1[{model.W1.shape[0]}][{model.W1.shape[1]}] = {{",
    ]

    feature_names = ["wait_ticks", "remaining_burst", "priority", "io_bound", "io_yield_count"]
    for i in range(model.W1.shape[0]):
        vals = ", ".join(float_to_c(v) for v in model.W1[i])
        lines.append(f"    /* feat[{i}]={feature_names[i]:20s} */  {{ {vals} }},")

    lines += [
        "};",
        "",
        f"/* Layer 1 Biases: B1[HIDDEN_DIM] */",
        "static const float B1[NN_HIDDEN_DIM] = {",
        "    " + ", ".join(float_to_c(v) for v in model.b1),
        "};",
        "",
        f"/* Layer 2 Weights: W2[HIDDEN_DIM][OUTPUT_DIM] */",
        f"static const float W2[{model.W2.shape[0]}][{model.W2.shape[1]}] = {{",
    ]

    for j in range(model.W2.shape[0]):
        vals = ", ".join(float_to_c(v) for v in model.W2[j])
        lines.append(f"    {{ {vals} }},")

    lines += [
        "};",
        "",
        f"/* Layer 2 Bias: B2[OUTPUT_DIM] */",
        "static const float B2[NN_OUTPUT_DIM] = {",
        "    " + ", ".join(float_to_c(v) for v in model.b2),
        "};",
        "",
        "#endif /* NN_WEIGHTS_H */",
    ]

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')

    print(f"Exported weights to: {output_path}")

# ─── Synthetic Data Generator (fallback if no real telemetry) ────────────────

def generate_synthetic_data(n_samples=2000, seed=42):
    """
    Generate synthetic scheduling telemetry for training when no real kernel
    telemetry CSV is available. This produces data with the same statistical
    properties as real round-robin kernel output.

    This is used during initial development (before the kernel is running).
    Once the kernel produces real serial logs, use those instead.
    """
    rng = np.random.default_rng(seed)
    print(f"Generating {n_samples} synthetic telemetry rows...")

    # Simulate 10 processes with varied characteristics
    process_configs = [
        # (total_burst, priority, io_bound)
        (60, 4, 0), (12, 5, 1), (80, 1, 0), (35, 3, 1),
        (45, 5, 0), (70, 2, 0), (10, 4, 1), (30, 3, 0),
        (25, 2, 1), (18, 4, 1),
    ]

    rows = []
    for _ in range(n_samples):
        # Pick a random process
        cfg = process_configs[rng.integers(0, len(process_configs))]
        total_burst, priority, io_bound = cfg

        # Simulate a random point in the process lifecycle
        progress = rng.random()
        remaining = max(1, int(total_burst * (1.0 - progress)))
        wait      = int(rng.integers(0, 80))
        io_yield  = int(rng.integers(0, 8)) if io_bound else 0

        # pid is irrelevant for training, use placeholder
        pid = rng.integers(1, 11)

        rows.append([float(pid), float(wait), float(remaining),
                     float(priority), float(io_bound), float(io_yield), 0.0])

    data = np.array(rows)
    print(f"Synthetic data: {len(data)} rows, "
          f"wait=[{data[:,1].min():.0f},{data[:,1].max():.0f}], "
          f"burst=[{data[:,2].min():.0f},{data[:,2].max():.0f}]")
    return data

# ─── Training Loop ─────────────────────────────────────────────────────────

def train(model, X, y, epochs=500, lr=0.01, batch_size=64, momentum=0.9):
    """
    Mini-batch SGD training loop.
    Prints loss every 50 epochs.
    Returns: list of (epoch, loss) tuples for analysis.
    """
    N = X.shape[0]
    history = []

    for epoch in range(1, epochs + 1):
        # Shuffle data each epoch
        perm = np.random.permutation(N)
        X_shuf, y_shuf = X[perm], y[perm]

        epoch_loss = 0.0
        n_batches  = 0

        for start in range(0, N, batch_size):
            end   = min(start + batch_size, N)
            X_b   = X_shuf[start:end]
            y_b   = y_shuf[start:end]
            model.forward(X_b)
            loss = model.backward(X_b, y_b, lr=lr, momentum=momentum)
            epoch_loss += loss
            n_batches  += 1

        avg_loss = epoch_loss / n_batches
        history.append((epoch, avg_loss))

        if epoch % 50 == 0 or epoch == 1:
            print(f"  Epoch {epoch:4d}/{epochs}  MSE Loss: {avg_loss:.6f}")

    return history

# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Train NeuroSched MLP on kernel scheduling telemetry"
    )
    parser.add_argument('--data',    type=str,   default=None,
                        help='Path to CSV telemetry file (from QEMU serial output). '
                             'If not provided, uses synthetic data.')
    parser.add_argument('--epochs',  type=int,   default=500,
                        help='Number of training epochs (default: 500)')
    parser.add_argument('--lr',      type=float, default=0.01,
                        help='Learning rate (default: 0.01)')
    parser.add_argument('--output',  type=str,   default='include/nn_weights.h',
                        help='Output path for C header (default: include/nn_weights.h)')
    parser.add_argument('--seed',    type=int,   default=42,
                        help='Random seed for reproducibility (default: 42)')
    args = parser.parse_args()

    np.random.seed(args.seed)

    print("=" * 60)
    print("NeuroSched MLP Trainer")
    print("=" * 60)

    # ── Load or generate data ──────────────────────────────────────────────
    if args.data and os.path.exists(args.data):
        data = load_telemetry(args.data)
    else:
        if args.data:
            print(f"WARNING: {args.data} not found. Using synthetic data.")
        print("INFO: No telemetry CSV provided. Using synthetic training data.")
        print("INFO: For better results, capture real kernel telemetry:")
        print("INFO:   qemu-system-i386 -kernel kernel.bin -serial file:telemetry.csv ...")
        data = generate_synthetic_data(n_samples=3000, seed=args.seed)

    # ── Build features and labels ──────────────────────────────────────────
    X_norm, feat_min, feat_max = build_features(data)
    y = compute_labels(data)

    print(f"\nDataset: {X_norm.shape[0]} samples, {X_norm.shape[1]} features")
    print(f"Label distribution: min={y.min():.3f}, max={y.max():.3f}, "
          f"mean={y.mean():.3f}")

    # ── Train/test split (80/20) ───────────────────────────────────────────
    split = int(0.8 * len(X_norm))
    idx   = np.random.permutation(len(X_norm))
    train_idx, test_idx = idx[:split], idx[split:]

    X_train, y_train = X_norm[train_idx], y[train_idx]
    X_test,  y_test  = X_norm[test_idx],  y[test_idx]

    print(f"Train: {len(X_train)} samples | Test: {len(X_test)} samples")
    print(f"\nTraining: {args.epochs} epochs, lr={args.lr}, momentum=0.9")
    print("-" * 40)

    # ── Train the model ────────────────────────────────────────────────────
    model   = MLP(input_dim=5, hidden_dim=8, output_dim=1, seed=args.seed)
    history = train(model, X_train, y_train,
                    epochs=args.epochs, lr=args.lr, momentum=0.9)

    # ── Evaluate on test set ───────────────────────────────────────────────
    model.forward(X_test)
    test_preds = model._a2
    test_mse   = float(np.mean((test_preds - y_test) ** 2))
    test_mae   = float(np.mean(np.abs(test_preds - y_test)))

    print("-" * 40)
    print(f"Test MSE: {test_mse:.6f}")
    print(f"Test MAE: {test_mae:.6f}")
    print(f"Prediction range: [{test_preds.min():.3f}, {test_preds.max():.3f}]")

    # ── Export weights to C header ─────────────────────────────────────────
    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    export_weights(model, feat_min, feat_max, args.output)

    print("\n" + "=" * 60)
    print("Training complete!")
    print(f"Next step: rebuild the kernel to use the new weights:")
    print(f"  make clean && make")
    print("=" * 60)


if __name__ == '__main__':
    main()
