/**
 * Tests for "Часть 11" exercises (E11.1 - E11.3).
 *
 * Acceptance: Freer encoding даёт ту же бизнес-логику, добавление эффекта =
 * +1 вариант в Instr (без правок bind), logging-интерпретатор поверх production-а.
 */

import { describe, expect, it } from "vitest";

import type { FreerIO, FreerWorld, Instr } from "../src/freer/types.ts";

import { freerBind as bind } from "../src/freer/bind.ts";
import {
  freerFetchUrl,
  freerPure as pure,
  freerRandom,
  freerReadLine,
  freerWriteLine,
} from "../src/freer/constructors.ts";
import { freerDo as doFreer } from "../src/freer/freer-do.ts";
import { freerRun as runIO, runWithLogging as runIOWithLogging } from "../src/freer/freer-run.ts";

// В текущей реализации отдельного wrap/IterableFreer нет: FreerIO уже iterable через freerMk.
const readLine: FreerIO<string> = freerReadLine;
const writeLine = (text: string): FreerIO<void> => freerWriteLine(text);
const fetchUrl = (url: string): FreerIO<string> => freerFetchUrl(url);
const random: FreerIO<number> = freerRandom;

const makeWorld = (
  options: {
    fetchMocks?: Record<string, string>;
    inputs?: ReadonlyArray<string>;
    randoms?: ReadonlyArray<number>;
  } = {},
): { output: Array<string> } & FreerWorld => {
  const inputQueue = [...(options.inputs ?? [])];
  const randomQueue = [...(options.randoms ?? [0.42])];
  const output: Array<string> = [];
  const fetchMocks = options.fetchMocks ?? {};
  return {
    fetch: async (url) => {
      const body = fetchMocks[url];
      if (body === undefined) throw new Error(`fetch to ${url} not mocked`);
      return body;
    },
    output,
    random: () => {
      if (randomQueue.length === 0) return 0.5;
      return randomQueue.shift()!;
    },
    readLine: async () => {
      if (inputQueue.length === 0) throw new Error("out of inputs");
      return inputQueue.shift()!;
    },
    sleep: async () => {},
    writeLine: async (text) => {
      output.push(text);
    },
  };
};

describe("E11.1 -- Freer вместо монолитного IO", () => {
  it("myProgram переезжает без правок бизнес-логики", async () => {
    const program: FreerIO<void> = doFreer(function* () {
      yield* writeLine("What is your name?");
      const name = yield* readLine;
      yield* writeLine(`Hello, ${name}!`);
    });

    const world = makeWorld({ inputs: ["Alice"] });
    await runIO(program, world);
    expect(world.output).toEqual(["What is your name?", "Hello, Alice!"]);
  });

  it("bind определён один раз и не зависит от формы инструкций", async () => {
    const program = bind(pure(2), (n) => bind(pure(n + 3), (m) => pure(m * 10)));
    const world = makeWorld();
    expect(await runIO(program, world)).toBe(50);
  });
});

describe("E11.2 -- Random добавлен без правок ядра", () => {
  it("random доступен через тот же freerDo / runIO", async () => {
    const program: FreerIO<number> = doFreer(function* () {
      const r = yield* random;
      return r * 100;
    });
    const world = makeWorld({ randoms: [0.7] });
    expect(await runIO(program, world)).toBeCloseTo(70);
  });
});

describe("E11.3 -- Logging interpreter (Layer-decorator)", () => {
  it("runIOWithLogging логирует каждую инструкцию и делегирует в production", async () => {
    const program: FreerIO<void> = doFreer(function* () {
      yield* writeLine("hi");
      const name = yield* readLine;
      yield* writeLine(`echo ${name}`);
    });

    const lines: Array<string> = [];
    const world = makeWorld({ inputs: ["Bob"] });
    await runIOWithLogging(program, world, (...m) => lines.push(m.join(" ")));

    expect(world.output).toEqual(["hi", "echo Bob"]);
    expect(lines.some((l) => l.includes("writeLine"))).toBe(true);
    expect(lines.some((l) => l.includes("readLine"))).toBe(true);
  });

  it("сетевой fetch тоже логируется", async () => {
    const program: FreerIO<void> = doFreer(function* () {
      const body = yield* fetchUrl("https://api/x");
      yield* writeLine(body);
    });

    const lines: Array<string> = [];
    const world = makeWorld({ fetchMocks: { "https://api/x": "payload" } });
    await runIOWithLogging(program, world, (...m) => lines.push(m.join(" ")));

    expect(world.output).toEqual(["payload"]);
    expect(lines.some((l) => l.includes("fetch https://api/x"))).toBe(true);
  });
});
