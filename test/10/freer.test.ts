import { describe, expect, it } from "vitest";

// Part 10 introduces Freer<Instr, A>. The student may export:
//   - Freer (type)
//   - runFreer(program, world): Promise<A>
//   - pure, readLine, writeLine, fetchUrl (re-using or re-implementing)
// We import dynamically so earlier test still run if Part 10 isn't done.

async function loadFreer() {
  const mod = (await import("../../src/index.ts")) as Record<string, unknown>;
  if (!("runFreer" in mod)) return null;
  return mod as {
    myProgram: unknown;
    readLine: unknown;
    bind: (io: unknown, f: (a: unknown) => unknown) => unknown;
    fetchUrl: (url: string) => unknown;
    pure: (v: unknown) => unknown;
    runFreer: (io: unknown, world: unknown) => Promise<unknown>;
    testWorld: (
      inputs: string[],
      fetches?: Record<string, string>,
    ) => {
      output: string[];
      [k: string]: unknown;
    };
    writeLine: (text: string) => unknown;
  };
}

describe("E10.1 — Freer: bind does not change when a new effect is added", () => {
  it("basic program runs correctly via runFreer", async () => {
    const freer = await loadFreer();
    if (!freer) return;

    const { bind, pure, runFreer, testWorld, writeLine } = freer;
    const world = testWorld({ inputs: [] });
    const program = bind(writeLine("hello"), () => pure(undefined));
    await runFreer(program, world);
    expect(world.output).toEqual(["hello"]);
  });

  it("myProgram still works through Freer runFreer", async () => {
    const freer = await loadFreer();
    if (!freer) return;
    const { myProgram, runFreer, testWorld } = freer;
    const world = testWorld({ inputs: ["Alice", "30"] });
    await runFreer(myProgram, world);
    expect(world.output).toEqual([
      "What is your name?",
      "Hello, Alice! How old are you?",
      "Wow, Alice, 30 is a great age!",
    ]);
  });
});

describe("E10.2 ★ — adding Random effect without touching bind", () => {
  it("random effect is usable alongside existing effects", async () => {
    const freer = await loadFreer();
    if (!freer) return;
    const mod = freer as Record<string, unknown>;
    if (!("random" in mod) || !("runFreer" in mod)) return;

    const random = mod["random"];
    const { bind, runFreer, testWorld, writeLine } = freer;
    const world = testWorld({ inputs: [] });
    const program = bind(random, (n: unknown) => writeLine(`random: ${n}`));
    await runFreer(program, world);
    expect(world.output).toHaveLength(1);
    expect(world.output[0]).toMatch(/^random:/);
  });
});

describe("E10.3 ★★ — runWithLogging", () => {
  it("runWithLogging delegates to the underlying world", async () => {
    const freer = await loadFreer();
    if (!freer) return;
    const mod = freer as Record<string, unknown>;
    if (!("runWithLogging" in mod)) return;

    const runWithLogging = mod["runWithLogging"] as (
      io: unknown,
      world: unknown,
    ) => Promise<unknown>;
    const { bind, pure, testWorld, writeLine } = freer;
    const world = testWorld({ inputs: [] });
    const program = bind(writeLine("test"), () => pure(undefined));
    await runWithLogging(program, world);
    expect(world.output).toEqual(["test"]);
  });
});
