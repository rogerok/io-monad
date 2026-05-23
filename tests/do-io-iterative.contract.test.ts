import { describe, expect, it } from "vitest";

import { fetchUrl, readLine, writeLine } from "../src/io/constructors/index.ts";
import { doIO } from "../src/io/do.ts";
import { runIO } from "../src/io/runtime/run-io.ts";
import { testWorld } from "../src/io/runtime/world.ts";

const buildProgram = (count: number) =>
  doIO(function* () {
    yield* writeLine("What is your name?");
    const name = yield* readLine;
    yield* writeLine(`Hello, ${name}! How old are you?`);
    const age = yield* readLine;
    yield* writeLine("Loading token...");
    const token = yield* fetchUrl("https://api/token");

    for (let i = 0; i < count; i += 1) {
      yield* writeLine(`${name}:${age}:${token}:${i}`);
    }

    yield* writeLine("Done");
  });

describe("doIo contract for iterative implementation", () => {
  it("runs a linear generator program and sends effect results back into later steps", async () => {
    const world = testWorld({
      fetchMocks: { "https://api/token": "token-123" },
      inputs: ["Alice", "30"],
    });

    await runIO(buildProgram(3), world);

    expect(world.output).toEqual([
      "What is your name?",
      "Hello, Alice! How old are you?",
      "Loading token...",
      "Alice:30:token-123:0",
      "Alice:30:token-123:1",
      "Alice:30:token-123:2",
      "Done",
    ]);
    expect(world.fetches).toEqual([{ url: "https://api/token" }]);

    console.log("doIo contract smoke check passed");
  });

  it("can run the same IO value against two independent worlds", async () => {
    const program = buildProgram(2);
    const first = testWorld({
      fetchMocks: { "https://api/token": "first-token" },
      inputs: ["Alice", "30"],
    });
    const second = testWorld({
      fetchMocks: { "https://api/token": "second-token" },
      inputs: ["Bob", "25"],
    });

    await runIO(program, first);
    await runIO(program, second);

    expect(first.output.at(-3)).toBe("Alice:30:first-token:0");
    expect(first.output.at(-2)).toBe("Alice:30:first-token:1");
    expect(second.output.at(-3)).toBe("Bob:25:second-token:0");
    expect(second.output.at(-2)).toBe("Bob:25:second-token:1");
  });

  it("runs a long linear program without losing steps", async () => {
    const count = 2_500;
    const world = testWorld({
      fetchMocks: { "https://api/token": "token-xyz" },
      inputs: ["Long", "1"],
    });

    await runIO(buildProgram(count), world);

    expect(world.output).toHaveLength(count + 4);
    expect(world.output[3]).toBe("Long:1:token-xyz:0");
    expect(world.output.at(-2)).toBe(`Long:1:token-xyz:${count - 1}`);
    expect(world.output.at(-1)).toBe("Done");
  });
});
