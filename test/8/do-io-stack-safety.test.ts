import { describe, expect, it } from "vitest";

import { readLine, writeLine } from "../../src/ constructors.ts";
import { doIo } from "../../src/do-io.ts";
import { runIO } from "../../src/run-io.ts";
import { testWorld } from "../../src/world.ts";

const longDoIoProgram = (size: number) =>
  doIo(function* () {
    yield* writeLine("start");
    const name = yield* readLine;

    for (let i = 0; i < size; i += 1) {
      yield* writeLine(`${name}:${i}`);
    }

    yield* writeLine("done");
  });

describe("doIo long linear programs", () => {
  it("builds and runs a long generator program without losing steps", async () => {
    const size = 2_000;
    const program = longDoIoProgram(size);
    const world = testWorld({ inputs: ["Alice"] });

    await runIO(program, world);

    expect(world.output).toHaveLength(size + 2);
    expect(world.output[0]).toBe("start");
    expect(world.output[1]).toBe("Alice:0");
    expect(world.output.at(-2)).toBe(`Alice:${size - 1}`);
    expect(world.output.at(-1)).toBe("done");
  });

  it("can run the same doIo value against two independent worlds", async () => {
    const program = longDoIoProgram(3);
    const first = testWorld({ inputs: ["Alice"] });
    const second = testWorld({ inputs: ["Bob"] });

    await runIO(program, first);
    await runIO(program, second);

    expect(first.output).toEqual(["start", "Alice:0", "Alice:1", "Alice:2", "done"]);
    expect(second.output).toEqual(["start", "Bob:0", "Bob:1", "Bob:2", "done"]);
  });
});
