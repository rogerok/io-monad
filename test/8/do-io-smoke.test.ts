import { expect, it } from "vitest";

import { readLine, writeLine } from "../../src/ constructors.ts";
import { doIo } from "../../src/do-io.ts";
import { runIO } from "../../src/run-io.ts";
import { testWorld } from "../../src/world.ts";

it("prints a smoke message when doIo runs the described program correctly", async () => {
  const program = doIo(function* () {
    yield writeLine("start");
    const name = yield readLine;

    for (let i = 0; i < 5; i += 1) {
      yield writeLine(`${name}:${i}`);
    }

    yield writeLine("done");
  });

  const world = testWorld({ inputs: ["Alice"] });

  await runIO(program, world);

  expect(world.output).toEqual(["start", "Alice:0", "Alice:1", "Alice:2", "Alice:3", "Alice:4", "done"]);

  console.log("doIo smoke passed", world.output);
});
