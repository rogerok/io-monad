---
tags:
  - typescript
  - freer-monad
  - ftcqueue
  - exercises
---

# E12.2 Exercises: Freer + FTCQueue

> [!info] Context
> Эти упражнения ведут к реализации E12.2, но не дают готовый drop-in код. Цель: заменить одно продолжение в `FreerImpure` на очередь продолжений и подтвердить линейный рост на left-associated benchmark.

## 1. Найди старую точку квадрата

Открой `src/freer/bind.ts` и выпиши строку, где `bind` для `impure` рекурсивно приклеивает продолжение.

Ответь письменно:

- какая часть старой программы переобходится;
- почему это не видно на программе из 5-7 шагов;
- почему это проявится в `for (let i = 0; i < N; i++)`.

## 2. Спроектируй API очереди

Создай черновик типа для `FTCQueue`, но пока не подключай его к Freer.

Минимальный API:

```ts
singleton(f)
append(left, right)
snoc(queue, f)
viewL(queue)
```

Проверка понимания: `snoc(q, f)` должен выражаться через `append(q, singleton(f))`.

## 3. Перепиши только smart constructors

После смены `FreerImpure` каждый smart constructor должен создавать очередь из одного continuation.

Проверь вручную:

- `freerReadLine` отвечает `string`;
- `freerWriteLine` отвечает `void`;
- `freerFetchUrl` отвечает `string`;
- `freerRandom` отвечает `number`.

## 4. Перепиши `freerBind`

Требование: в ветке `impure` не должно быть рекурсивного вызова `freerBind(m.cont(...), f)`.

Сформулируй новый invariant:

> `freerBind` не исполняет и не раскрывает очередь. Он только добавляет continuation к будущей работе.

## 5. Перепиши один шаг interpreter-а

В `freerRun` замени форму:

```ts
current = current.cont(resp);
```

на форму:

```ts
current = applyQueue(current.queue, resp);
```

Где `applyQueue` должен:

- вынуть первый continuation;
- применить его к `resp`;
- если continuation вернул `pure`, продолжить хвост очереди с этим value;
- если continuation вернул `impure`, присоединить старый хвост к очереди нового `impure`;
- если continuation вернул `suspend`, сохранить ленивую границу.

## 6. Regression tests

Запусти:

```bash
pnpm exec vitest run test-vasya/exercises-part11.test.ts
pnpm exec vitest run test-vasya/monad-laws.test.ts
pnpm exec vitest run test-vasya/integration.test.ts
```

Если E11 падает после E12.2, сначала исправь семантику очереди, а не benchmark.

## 7. Benchmark shape

Напиши отдельный benchmark test или script.

Форма построения:

```ts
let prog = freerPure(0);
for (let i = 0; i < n; i++) {
  prog = freerBind(prog, (x) => freerPure(x + 1));
}
```

Проверь `n = 1_000`, `10_000`, `100_000`.

Не делай test, который требует конкретных миллисекунд. Лучше печатай таблицу и добавь отдельный smoke-test “100k строится без stack overflow”.

## 8. Контрольный вопрос

Почему Codensity тоже решает left association, но хуже подходит, когда interpreter должен смотреть на первую инструкцию программы?

