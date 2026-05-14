# DoIo Symbol.iterator session brief

Дата заметки: 2026-05-14.

## Контекст

Продолжаем учебное объяснение реализации `doIo` для IO-монады. Важно соблюдать ограничение из `AGENTS.md`: не давать готовое drop-in решение домашки, пока ученик явно не попросит. Формат нужен преподавательский: объяснять механику, задавать проверочные вопросы, помогать увидеть ошибку в текущем коде.

## Где остановились

Ученик уже добавил вариант из материала 8.4 с `Symbol.iterator`.

Текущая идея в проекте:

- `mkIO(io)` добавляет на IO-объект не-enumerable `Symbol.iterator`;
- внутри итератора делается `yield new YieldWrap(this)`;
- пользователь сможет писать `yield* readLine`, `yield* writeLine(...)`;
- генератор в `doIo` теперь отдаёт наружу не голый `IO`, а `YieldWrap<IO<...>>`;
- значит в `doIo` при `done: false` нужно доставать сам IO из обёртки.

## Текущие файлы и важные наблюдения

`src/mk-io.ts` примерно такой:

```ts
export const mkIO = <A>(io: IO<A>): IO<A> => {
  Object.defineProperty(io, Symbol.iterator, {
    configurable: true,
    enumerable: false,
    value: function* () {
      return (yield new YieldWrap(this)) as A;
    },
    writable: false,
  });

  return io;
};
```

`src/ constructors.ts` уже пропускает `pure`, `readLine`, `writeLine`, `fetchUrl`, `sleep` через `mkIO`.

Отдельное замечание: `suspend` пока возвращает обычный объект без `mkIO`. Если ученик захочет поддерживать `yield* suspend(...)`, это может стать проблемой. Для базового `doIo` это не обязательно первый вопрос.

`src/gen.ts` сейчас содержит:

```ts
export class YieldWrap<T> {
  readonly _Y!: () => T;
  constructor(private readonly value: T) {}
}
```

Нужно обратить внимание ученика: в учебном материале `value` у `YieldWrap` был публичный:

```ts
constructor(readonly value: T) {}
```

Иначе `doIo` не сможет распаковать `YieldWrap` как `result.value.value`.

## Важное изменение ментальной модели

До `Symbol.iterator`:

```ts
result.value // IO
```

После `Symbol.iterator`:

```ts
result.value       // YieldWrap<IO>
result.value.value // IO
```

Значит тип `IOGen<A>` больше не должен мыслиться как:

```ts
Generator<IO<unknown>, A, unknown>
```

А по смыслу становится:

```ts
Generator<YieldWrap<IO<any>>, A, any>
```

При объяснении не давать полный финальный код, но важно подвести ученика к этому различию.

## Последний учебный фокус

Ученик заметил, что его подводят к рекурсивному `walk`, а задание требует реализацию без вложенной рекурсии.

Нужно продолжить с этого места:

- рекурсивная форма полезна только как семантическая модель;
- финальная версия должна делать один шаг генератора;
- следующий шаг лучше откладывать через `suspend`;
- `runIO` уже разворачивает `suspend` в своём `while`, поэтому стек JS не растёт так же, как при непосредственном рекурсивном вызове.

Ключевая учебная фраза:

> рекурсия должна быть перенесена из call stack в структуру IO, которую `runIO` разворачивает циклом.

## Как продолжать завтра

Начать с вопроса:

> В твоей версии с `Symbol.iterator`, что именно лежит в `result.value`, когда генератор остановился на `yield* readLine`: сам `readLine` или `YieldWrap(readLine)`?

Потом закрепить:

- если `done: true`, результат генератора превращается в `pure(result.value)`;
- если `done: false`, из `YieldWrap` достаётся IO;
- этот IO должен быть выполнен через существующий механизм `runIO`, то есть через возвращаемую IO-структуру;
- callback у `bind` получает результат выполненного IO;
- callback не должен сразу глубоко строить всю цепочку, а может вернуть `suspend(() => следующий_шаг)`.

## Текущий код ученика, который обсуждали

Ученик пришёл к промежуточному варианту:

```ts
export const doIo = <A>(genFn: () => IOGen<A>): IO<A> =>
  suspend(() => {
    const gen = genFn();
    const result = gen.next();

    if (result.done) {
      return pure(result.value);
    }

    const genToIo = (v: unknown) => {
      const res = gen.next(v);
      if (res.done) {
        return pure(res.value);
      }
      return genToIo(res.value);
    };

    return bind(result.value, genToIo);
  });
```

Что в нём объясняли:

- `genToIo(res.value)` ошибочно, потому что при `res.done === false` `res.value` является следующей yielded-инструкцией, а не результатом уже выполненного IO;
- в `Symbol.iterator` варианте это ещё и `YieldWrap<IO>`, а не голый IO;
- нужно не передавать эту инструкцию обратно в `gen.next`, а сначала вернуть IO, который исполнит её;
- “исполнить IO и передать результат дальше” в текущем языке выражается через `bind`.

## Чего не делать без явного запроса

- Не писать полную реализацию `doIo`.
- Не менять `src/do-io.ts` самостоятельно.
- Не переписывать `index.ts`.
- Не раскрывать готовый ответ, если ученик просит только подсказку или проверку рассуждений.

