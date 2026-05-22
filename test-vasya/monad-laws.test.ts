/**
 * Законы монады для IO и Freer.
 *
 *   left identity:  bind(pure(a), f)         === f(a)
 *   right identity: bind(io, pure)           === io
 *   associativity:  bind(bind(io, f), g)     === bind(io, x => bind(f(x), g))
 *
 * Сравнивать IO как структуры в TS муторно (рекурсивные функции в continuation).
 * Поэтому мы прогоняем обе стороны через один и тот же интерпретатор и сверяем
 * наблюдаемое поведение: финальный результат + последовательность side effect-ов.
 */

import { describe, expect, it } from "vitest";

import type { FreerIO } from "../src/freer/types.ts";
import type { IO } from "../src/types.ts";

import { andThen, bind } from "../src/combinators.ts";
import { pure, writeLine } from "../src/ constructors.ts";
import { freerBind } from "../src/freer/bind.ts";
import { freerPure } from "../src/freer/constructors.ts";
import { runIO } from "../src/run-io.ts";
import { testWorld } from "../src/world.ts";

describe("IO monad laws", () => {
  it("left identity: bind(pure(a), f) ~ f(a)", async () => {
    const f = (n: number): IO<string> => pure(`got ${n}`);

    const lhs = bind(pure(7), f);
    const rhs = f(7);

    expect(await runIO(lhs, testWorld())).toBe(await runIO(rhs, testWorld()));
  });

  it("right identity: bind(io, pure) ~ io", async () => {
    const io = andThen(writeLine("side"), pure(42));
    const lhs = bind(io, pure);

    const w1 = testWorld();
    const w2 = testWorld();

    const r1 = await runIO(lhs, w1);
    const r2 = await runIO(io, w2);

    expect(r1).toBe(r2);
    expect(w1.output).toEqual(w2.output);
  });

  it("associativity: bind(bind(io, f), g) ~ bind(io, x => bind(f(x), g))", async () => {
    const f = (n: number): IO<number> => pure(n * 2);
    const g = (n: number): IO<string> => pure(`v=${n}`);

    const io: IO<number> = andThen(writeLine("start"), pure(3));

    const lhs = bind(bind(io, f), g);
    const rhs = bind(io, (x) => bind(f(x), g));

    const w1 = testWorld();
    const w2 = testWorld();
    expect(await runIO(lhs, w1)).toBe(await runIO(rhs, w2));
    expect(w1.output).toEqual(w2.output);
  });
});

describe("Freer monad laws", () => {
  it("left identity", () => {
    const f = (n: number) => freerPure(`got ${n}`);
    const lhs = freerBind(freerPure(5), f);
    const rhs = f(5);
    expect(extractPure(lhs)).toBe("got 5");
    expect(extractPure(rhs)).toBe("got 5");
  });

  it("right identity", () => {
    const io: FreerIO<number> = freerPure(11);
    const lhs = freerBind(io, freerPure);
    expect(extractPure(lhs)).toBe(11);
    expect(extractPure(io)).toBe(11);
  });

  it("associativity", () => {
    const f = (n: number) => freerPure(n * 2);
    const g = (n: number) => freerPure(`v=${n}`);
    const io = freerPure(3);
    const lhs = freerBind(freerBind(io, f), g);
    const rhs = freerBind(io, (x) => freerBind(f(x), g));
    expect(extractPure(lhs)).toBe("v=6");
    expect(extractPure(rhs)).toBe("v=6");
  });
});

function extractPure<A>(m: FreerIO<A>): A {
  if (m.tag !== "pure") throw new Error("expected Pure for law-checking shortcut");
  return m.value;
}
