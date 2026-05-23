/**
 * Интеграционный путь: одна и та же сквозная программа в разных encoding-ах
 * должна давать одинаковый пользовательский output.
 *
 * В текущем проекте нет файлов src/examples/program-*.ts, которые изначально
 * ожидал этот тест. Также существующие src/program.ts и src/freer/program.ts
 * содержат top-level запуск через void (async () => ...), поэтому импортировать
 * их из теста нельзя без побочного запуска stdin/fetch.
 */

import { describe, expect, it } from "vitest";

import type { FreerWorld } from "../src/freer/core/types.ts";

import { freerBind } from "../src/freer/combinators/bind.ts";
import { freerFetchUrl, freerRandom, freerReadLine, freerWriteLine, } from "../src/freer/constructors/index.ts";
import { freerDo } from "../src/freer/do.ts";
import { freerRun } from "../src/freer/runtime/run.ts";

const inputs = ["Alice", "30"] as const;
const fetchMocks = { "https://httpbin.org/uuid": "token-123" } as const;

describe("Сквозной пример поверх Freer", () => {
  it("Freer-программа через do-notation с Random выбирает приветствие из массива", async () => {
    const program = freerDo(function* () {
      const greetings = ["Hello", "Hi", "Hey"];

      yield* freerWriteLine("What is your name?");
      const name = yield* freerReadLine;
      const greetingIndex = Math.floor((yield* freerRandom) * greetings.length);
      const greeting = greetings[greetingIndex] ?? greetings[0];
      yield* freerWriteLine(`${greeting}, ${name}! How old are you?`);
      const age = yield* freerReadLine;
      yield* freerWriteLine("Loading greeting of the day...");
      const body = yield* freerFetchUrl("https://httpbin.org/uuid");
      yield* freerWriteLine(`Wow, ${name}, ${age}! Token: ${body}`);
    });

    const world = makeFreerWorld({
      fetchMocks,
      inputs: [...inputs],
      randoms: [0],
    });

    await freerRun(program, world);

    expect(world.output).toEqual([
      "What is your name?",
      "Hello, Alice! How old are you?",
      "Loading greeting of the day...",
      "Wow, Alice, 30! Token: token-123",
    ]);
  });

  it("Freer-программа через bind работает с тем же World", async () => {
    const program = freerBind(freerWriteLine("What is your name?"), () =>
      freerBind(freerReadLine, (name) =>
        freerBind(freerRandom, (r) => {
          const greetings = ["Hello", "Hi", "Hey"];
          const greeting = greetings[Math.floor(r * greetings.length)] ?? greetings[0];

          return freerBind(freerWriteLine(`${greeting}, ${name}! How old are you?`), () =>
            freerBind(freerReadLine, (age) =>
              freerBind(freerWriteLine("Loading greeting of the day..."), () =>
                freerBind(freerFetchUrl("https://httpbin.org/uuid"), (body) =>
                  freerWriteLine(`Wow, ${name}, ${age}! Token: ${body}`),
                ),
              ),
            ),
          );
        }),
      ),
    );

    const world = makeFreerWorld({
      fetchMocks,
      inputs: [...inputs],
      randoms: [0],
    });

    await freerRun(program, world);

    expect(world.output.at(-1)).toBe("Wow, Alice, 30! Token: token-123");
  });
});

function makeFreerWorld(options: {
  fetchMocks: Record<string, string>;
  inputs: ReadonlyArray<string>;
  randoms: ReadonlyArray<number>;
}): FreerWorld & { output: Array<string> } {
  const inputQueue = [...options.inputs];
  const randomQueue = [...options.randoms];
  const output: Array<string> = [];

  return {
    fetch: async (url) => {
      const body = options.fetchMocks[url];
      if (body === undefined) throw new Error(`fetch to ${url} not mocked`);
      return body;
    },
    output,
    random: () => randomQueue.shift() ?? 0.5,
    readLine: async () => {
      if (inputQueue.length === 0) throw new Error("out of inputs");
      return inputQueue.shift()!;
    },
    sleep: async () => {},
    writeLine: async (text) => {
      output.push(text);
    },
  };
}
