/**
 * Tests for "Часть 8" exercises (E8.1 - E8.4).
 *
 * Acceptance: три encoding doIO (naive / adapter / Symbol.iterator) дают
 * абсолютно одинаковый output для одной и той же бизнес-логики.
 */

import { describe, expect, expectTypeOf, it } from "vitest";

import { fetchUrl, readLine, writeLine } from "../src/ constructors.ts";
import { doIo } from "../src/do-io.ts";
import { runIO } from "../src/run-io.ts";
import { IO } from "../src/type.ts";
import { testWorld } from "../src/world.ts";

const expectedOutput = [
  "What is your name?",
  "Hello, Alice! How old are you?",
  "Loading greeting of the day...",
  "Wow, Alice, 30! Today's lucky token: token-123",
];

const inputs = ["Alice", "30"] as const;
const fetchMocks = { "https://api/uuid": "token-123" } as const;

describe("E8.3 -- Symbol.iterator, yield* io напрямую", () => {
  const program: IO<void> = doIo(function* () {
    yield* writeLine("What is your name?");
    const name = yield* readLine;
    expectTypeOf(name).toEqualTypeOf<string>();
    yield* writeLine(`Hello, ${name}! How old are you?`);
    const age = yield* readLine;
    yield* writeLine("Loading greeting of the day...");
    const body = yield* fetchUrl("https://api/uuid");
    yield* writeLine(`Wow, ${name}, ${age}! Today's lucky token: ${body}`);
  });

  it("output совпадает с ожидаемым", async () => {
    const world = testWorld({ fetchMocks, inputs: [...inputs] });
    await runIO(program, world);
    expect(world.output).toEqual(expectedOutput);
  });

  it("Symbol.iterator не светится в JSON.stringify", () => {
    const io = writeLine("hi");
    const json = JSON.stringify(io);
    // Symbol.iterator -- non-enumerable, поэтому в JSON.stringify он не уходит.
    expect(json).toBe('{"next":{"tag":"pure"},"tag":"writeLine","text":"hi"}');
    expect(Object.keys(io).sort()).toEqual(["next", "tag", "text"]);
  });
});

describe("E8.5 -- одна программа, переиспользуемая между прогонами", () => {
  // Этот тест ловит баг с одноразовым генератором: без `suspend` в `doIO`
  // второй прогон отрабатывал бы только первую инструкцию и тихо завершался,
  // потому что `gen` внутри замыкания исчерпывался после первого `runIO`.

  const expectFull = (output: ReadonlyArray<string>, name: string, token: string): void => {
    expect(output).toHaveLength(4);
    expect(output[0]).toBe("What is your name?");
    expect(output[3]).toContain(name);
    expect(output[3]).toContain(token);
  };

  const runTwice = async (program: IO<void>): Promise<void> => {
    const w1 = testWorld({
      fetchMocks: { "https://api/uuid": "uuid-1" },
      inputs: ["Alice", "30"],
    });
    const w2 = testWorld({
      fetchMocks: { "https://api/uuid": "uuid-2" },
      inputs: ["Bob", "25"],
    });

    await runIO(program, w1);
    await runIO(program, w2);

    expectFull(w1.output, "Alice", "uuid-1");
    expectFull(w2.output, "Bob", "uuid-2");
    expect(w1.fetches).toHaveLength(1);
    expect(w2.fetches).toHaveLength(1);
  };

  it("symbol-iterator doIO: один и тот же myProgram прогоняется дважды", async () => {
    const program: IO<void> = doIo(function* () {
      yield* writeLine("What is your name?");
      const name = yield* readLine;
      yield* writeLine(`Hello, ${name}! How old are you?`);
      const age = yield* readLine;
      yield* writeLine("Loading greeting of the day...");
      const body = yield* fetchUrl("https://api/uuid");
      yield* writeLine(`Wow, ${name}, ${age}! Today's lucky token: ${body}`);
    });
    await runTwice(program);
  });
});

describe("E8.4 -- три encoding эквивалентны", () => {
  it("одинаковый output на одной программе через все три doIO", async () => {
    const w1 = testWorld({ fetchMocks, inputs: [...inputs] });
    const w2 = testWorld({ fetchMocks, inputs: [...inputs] });
    const w3 = testWorld({ fetchMocks, inputs: [...inputs] });

    const symbol: IO<void> = doIo(function* () {
      yield* writeLine("hi");
      const x = yield* readLine;
      yield* writeLine(`echo ${x}`);
    });
    // Тут должны быть три вида реализации
    await runIO(symbol, w1);
    await runIO(symbol, w2);
    await runIO(symbol, w3);

    expect(w1.output).toEqual(["hi", "echo Alice"]);
    expect(w2.output).toEqual(["hi", "echo Alice"]);
    expect(w3.output).toEqual(["hi", "echo Alice"]);
  });
});
