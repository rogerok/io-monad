---
tags:
  - typescript
  - freer-monad
  - io-monad
  - exercises
---

# Упражнения к `Freer в src/freer`

## 1. Объясни форму узла

Для каждого поля напиши одно точное предложение:

- `op`
- `cont`
- `_resp`
- `suspend`
- `Symbol.iterator`

Проверка: в объяснении `op` не должно быть слова “продолжение”, а в объяснении `cont` не должно быть конкретных тегов вроде `readLine`.

## 2. Разверни один `bind`

Дан узел:

```ts
const m = freerWriteLine("hi");
const f = () => freerReadLine;
const p = freerBind(m, f);
```

Опиши, что лежит в `p.op`, и что делает новый `p.cont`.

Не пиши реализацию. Нужна форма данных: какой тег остаётся снаружи, куда переехал `f`.

## 3. Найди место расширения

Представь новый эффект:

```ts
type FreerNow = { _resp: number; tag: "now" };
```

Укажи, какие три места нужно изменить в текущей архитектуре `src/freer`, чтобы `yield* freerNow` заработал.

Контрольный вопрос: почему `src/freer/bind.ts` не должен попасть в этот список?

## 4. Мини-тест на interpreter

Напиши `vitest`-тест, который проверяет, что `freerRandom` берёт число из `world.random`, а не из `Math.random`.

Скелет:

```ts
import { describe, expect, it } from "vitest";
import { freerRandom } from "../src/freer/constructors.ts";
import { freerRun } from "../src/freer/freer-run.ts";
import type { FreerWorld } from "../src/freer/types.ts";

describe("freerRandom", () => {
  it("delegates random to FreerWorld", async () => {
    const world: FreerWorld = {
      fetch: async () => "",
      random: () => 0.42,
      readLine: async () => "",
      sleep: async () => undefined,
      writeLine: async () => undefined,
    };

    const value = await freerRun(freerRandom, world);

    expect(value).toBe(0.42);
  });
});
```

## 5. Трассировка руками

Для программы:

```ts
const program = freerDo(function* () {
  yield* freerWriteLine("A");
  yield* freerWriteLine("B");
});
```

Запиши последовательность внешних узлов, которые увидит `freerRun`.

Формат:

```text
suspend -> impure(writeLine "A") -> ... -> pure(undefined)
```

## 6. Вопрос на понимание границы

Почему `runWithLogging` в текущем `src/freer/freer-run.ts` реализован как декоратор `FreerWorld`, а не как новый вариант `Instr`?

Ответ должен различать:

- logging как наблюдение за интерпретацией;
- logging как бизнес-эффект внутри DSL.
