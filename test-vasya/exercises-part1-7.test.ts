/**
 * Tests for "Часть 1-7" exercises (E1.1 - E7.3).
 *
 * Acceptance-критерии для базового IO без do-notation: типы, smart-конструкторы,
 * bind, runIO, миры, расширение Fetch.
 */

import { describe, expect, expectTypeOf, it } from "vitest";

import { andThen, bind, map, sequence } from "../src";
import { fetchUrl, pure, readLine, writeLine } from "../src/ constructors.ts";
import { runIO } from "../src/run-io.ts";
import { IO } from "../src/type.ts";
import { loggingWorld, testWorld } from "../src/world.ts";

describe("E1 -- DSL и типы", () => {
  it("IO<A>, обычное значение, не функция", () => {
    const greeting: IO<void> = writeLine("hello");
    expect(typeof greeting).toBe("object");
    expect(greeting.tag).toBe("writeLine");
  });

  it("readLine, значение, а не функция (как getLine :: IO String в Haskell)", () => {
    expectTypeOf(readLine).toEqualTypeOf<IO<string>>();
    expect(readLine.tag).toBe("readLine");
  });

  it("greeting tree, ноль side-effects наружу на этапе построения", async () => {
    const world = testWorld({ inputs: ["hi"] });
    const tree = bind(writeLine("what is your name?"), () => readLine);
    // Само построение, чистая структура: ничего не вылетело в world.
    expect(world.output).toEqual([]);
    expect(tree.tag).toBe("writeLine");
    // Эффект происходит только когда runIO пришёл.
    await runIO(tree, world);
    expect(world.output).toEqual(["what is your name?"]);
  });
});

describe("E2 -- smart constructors", () => {
  it("pure(x), Pure-узел", () => {
    const io = pure(42);
    expect(io).toEqual({ tag: "pure", value: 42 });
  });

  it("writeLine, IO<void>, не IO<string>", () => {
    const io = writeLine("text");
    expectTypeOf(io).toEqualTypeOf<IO<void>>();
  });
});

describe("E3 -- bind / map / andThen", () => {
  it("bind на Pure подставляет f", async () => {
    const program = bind(pure(2), (x) => pure(x + 3));
    const world = testWorld();
    const result = await runIO(program, world);
    expect(result).toBe(5);
  });

  it("map переиспользует bind", async () => {
    const program = map(pure("alice"), (s) => s.toUpperCase());
    const world = testWorld();
    expect(await runIO(program, world)).toBe("ALICE");
  });

  it("andThen выкидывает результат первого шага", async () => {
    const program = andThen(writeLine("side"), pure("value"));
    const world = testWorld();
    expect(await runIO(program, world)).toBe("value");
    expect(world.output).toEqual(["side"]);
  });
});

describe("E4 -- myProgram (имя + возраст)", () => {
  const myProgram: IO<void> = bind(writeLine("What is your name?"), () =>
    bind(readLine, (name) =>
      bind(writeLine(`Hello, ${name}! How old are you?`), () =>
        bind(readLine, (age) => writeLine(`Wow, ${name}, ${age} is a great age!`)),
      ),
    ),
  );

  it("прогон через testWorld даёт ожидаемый output", async () => {
    const world = testWorld({ inputs: ["Alice", "30"] });
    await runIO(myProgram, world);
    expect(world.output).toEqual([
      "What is your name?",
      "Hello, Alice! How old are you?",
      "Wow, Alice, 30 is a great age!",
    ]);
  });

  it("E4.2 -- sequence: проигрывает массив IO в порядке", async () => {
    const program = sequence([pure(1), pure(2), pure(3)]);
    const world = testWorld();
    expect(await runIO(program, world)).toEqual([1, 2, 3]);
  });

  it("E4.2 -- forEach печатает массив строк по одной", async () => {
    const program = forEach(["a", "b", "c"].map((s) => writeLine(s)));
    const world = testWorld();
    await runIO(program, world);
    expect(world.output).toEqual(["a", "b", "c"]);
  });
});

describe("E5 -- runIO как trampoline", () => {
  it("глубокая цепочка не падает по стеку", async () => {
    let program: IO<number> = pure(0);
    for (let i = 0; i < 10_000; i++) {
      program = bind(program, (x) => pure(x + 1));
    }
    expect(await runIO(program, testWorld())).toBe(10_000);
  });
});

describe("E6 -- разные миры", () => {
  it("testWorld падает на исчерпании очереди ввода", async () => {
    const world = testWorld({ inputs: [] });
    await expect(runIO(readLine, world)).rejects.toThrow(
      "readLine called more times than inputs provided",
    );
  });

  it("testWorld падает на незамоканном fetch", async () => {
    const world = testWorld();
    await expect(runIO(fetchUrl("https://api/x"), world)).rejects.toThrow(
      "fetch to https://api/x not mocked",
    );
  });

  it("E6.3 -- loggingWorld делегирует во вложенный мир и логирует", async () => {
    const lines: Array<string> = [];
    const inner = testWorld({ inputs: ["Bob"] });
    const decorated = loggingWorld(inner, { log: (m) => lines.push(m) });

    await runIO(
      bind(writeLine("hi"), () => readLine),
      decorated,
    );

    expect(inner.output).toEqual(["hi"]);
    expect(lines.some((l) => l.includes("writeLine"))).toBe(true);
    expect(lines.some((l) => l.includes("readLine"))).toBe(true);
  });
});

describe("E7 -- расширение до Fetch", () => {
  it("fetch проходит через мир и подставляет body в continuation", async () => {
    const world = testWorld({
      fetchMocks: { "https://api/greet": "hello-from-api" },
    });
    const program = bind(fetchUrl("https://api/greet"), (body) => writeLine(`got: ${body}`));
    await runIO(program, world);
    expect(world.output).toEqual(["got: hello-from-api"]);
    expect(world.fetches.map((f) => f.url)).toEqual(["https://api/greet"]);
  });
});
