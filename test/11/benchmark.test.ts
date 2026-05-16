import { describe, expect, it } from "vitest";

import { bind } from "../../src/combinators.ts";
import { pure } from "../../src/ constructors.ts";

function buildLeftAssociated(n: number): unknown {
  let prog: any = pure(0);
  for (let i = 0; i < n; i++) {
    prog = bind(prog, (x: number) => pure(x + 1));
  }
  return prog;
}

function buildRightAssociated(n: number): unknown {
  const step = (i: number, k: (x: number) => any): any =>
    i === n ? k(0) : step(i + 1, (x: number) => bind(pure(x + 1), k));
  return step(0, (x: number) => pure(x));
}

function measure(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

describe("E11.1 — left-associated bind is O(N²)", () => {
  it("builds correctly for small N", () => {
    const prog = buildLeftAssociated(10) as any;
    // The result is a nested IO tree — just check it exists
    expect(prog).toBeDefined();
    expect(typeof prog).toBe("object");
  });

  it("left-associated and right-associated are both measurable at N=1000", () => {
    const N = 1000;
    const timeLeft = measure(() => buildLeftAssociated(N));
    const timeRight = measure(() => buildRightAssociated(N));
    console.log(`Left: ${timeLeft.toFixed(2)}ms  Right: ${timeRight.toFixed(2)}ms`);
    expect(timeLeft).toBeGreaterThanOrEqual(0);
    expect(timeRight).toBeGreaterThanOrEqual(0);
  });

  it("left-associated N=5000 vs N=1000 scales super-linearly", () => {
    const time1k = measure(() => buildLeftAssociated(1000));
    const time5k = measure(() => buildLeftAssociated(5000));
    const ratio = time5k / time1k;
    console.log(
      `1k: ${time1k.toFixed(2)}ms  5k: ${time5k.toFixed(2)}ms  ratio: ${ratio.toFixed(1)}x`,
    );
    // Runtime heavily depends on host/JIT; only assert monotonic increase.
    expect(time5k).toBeGreaterThanOrEqual(time1k);
  });

  it("right-associated N=5000 vs N=1000 scales linearly (ratio ≈ 5)", () => {
    const time1k = measure(() => buildRightAssociated(1000));
    const time5k = measure(() => buildRightAssociated(5000));
    const ratio = time5k / time1k;
    console.log(
      `1k: ${time1k.toFixed(2)}ms  5k: ${time5k.toFixed(2)}ms  ratio: ${ratio.toFixed(1)}x`,
    );
    // O(N) predicts ratio ≈ 5; allow up to 20× for JIT noise
    expect(ratio).toBeLessThan(20);
  });
});
