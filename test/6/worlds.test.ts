import { describe, expect, it } from "vitest";

import { pure, readLine, writeLine } from "../../src/ constructors.ts";
import { bind } from "../../src/index.ts";
import { myProgram } from "../../src/program.ts";
import { runIO } from "../../src/run-io.ts";
import { loggingWorld, testWorld } from "../../src/world.ts";

describe("E6.1 — testWorld", () => {
  it("captures written lines in order", async () => {
    const world = testWorld({ inputs: ["Alice", "30"] });
    await runIO(myProgram, world);
    expect(world.output[0]).toBe("What is your name?");
    expect(world.output[1]).toBe("Hello, Alice! How old are you?");
    expect(world.output[2]).toBe("Wow, Alice, 30 is a great age!");
  });

  it("provides inputs in FIFO order", async () => {
    const world = testWorld({ inputs: ["first", "second"] });
    const program = bind(readLine, (a) => bind(readLine, (b) => pure(`${a}|${b}`)));
    const result = await runIO(program, world);
    expect(result).toBe("first|second");
  });

  it("throws when inputs are exhausted (fail loud)", async () => {
    const world = testWorld({ inputs: [] });
    await expect(runIO(readLine, world)).rejects.toThrow();
  });

  it("error message mentions exhausted / more inputs", async () => {
    const world = testWorld({ inputs: ["only one"] });
    const program = bind(readLine, () => readLine);
    await expect(runIO(program, world)).rejects.toThrow(/input|read/i);
  });
});

describe("E6.2 — same myProgram in all worlds", () => {
  it("myProgram produces consistent output via testWorld", async () => {
    const world = testWorld({ inputs: ["Bob", "42"] });
    await runIO(myProgram, world);
    expect(world.output).toEqual([
      "What is your name?",
      "Hello, Bob! How old are you?",
      "Wow, Bob, 42 is a great age!",
    ]);
  });

  it("myProgram is the same value for every world (no mutations)", async () => {
    const w1 = testWorld({ inputs: ["Alice", "30"] });
    const w2 = testWorld({ inputs: ["Bob", "25"] });
    await runIO(myProgram, w1);
    await runIO(myProgram, w2);
    expect(w1.output[2]).toBe("Wow, Alice, 30 is a great age!");
    expect(w2.output[2]).toBe("Wow, Bob, 25 is a great age!");
  });
});

describe("E6.3 ★ — loggingWorld", () => {
  it("delegates to the inner world", async () => {
    const inner = testWorld({ inputs: ["Alice", "30"] });
    const logged = loggingWorld(inner, { log: () => {} });
    await runIO(myProgram, logged);
    expect(inner.output).toEqual([
      "What is your name?",
      "Hello, Alice! How old are you?",
      "Wow, Alice, 30 is a great age!",
    ]);
  });

  it("still produces the correct result", async () => {
    const inner = testWorld({ inputs: ["X"] });
    const logged = loggingWorld(inner, { log: () => {} });
    const result = await runIO(
      bind(readLine, (s) => pure(s + "!")),
      logged,
    );
    expect(result).toBe("X!");
  });

  it("tracks logged calls (optional: world has a log array)", async () => {
    const lines: string[] = [];
    const inner = testWorld({ inputs: ["Z"] });
    const logged = loggingWorld(inner, { log: (line) => lines.push(line) });
    await runIO(
      bind(writeLine("hi"), () => readLine),
      logged,
    );
    expect(logged).toBeDefined();
    expect(lines.length).toBeGreaterThan(0);
  });
});
