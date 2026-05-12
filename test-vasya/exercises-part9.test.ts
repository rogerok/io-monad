/**
 * Tests for "Часть 9" exercises (E9.1 - E9.2).
 *
 * Acceptance: IORef как эффект (newRef / readRef / writeRef + modifyRef),
 * счётчик через doIO, ячейка локальна для прогона.
 */

import { describe, expect, it } from 'vitest';

import {
  fetchUrl as iterableFetchUrl,
  modifyRef as iterableModifyRef,
  newRef as iterableNewRef,
  readLine as iterableReadLine,
  readRef as iterableReadRef,
  writeLine as iterableWriteLine,
} from '~/do/iterable-constructors.js';
import { doIO } from '~/do/symbol-iterator.js';
import { andThen, bind, modifyRef, newRef, readRef, writeRef } from '~/io.js';
import type { IO } from '~/io.js';
import { runIO } from '~/run.js';
import { testWorld } from '~/world.js';

describe('E9.1 -- IORef API: newRef / readRef / writeRef / modifyRef', () => {
  it('newRef + readRef возвращает начальное значение', async () => {
    const program = bind(newRef(42), (ref) => readRef(ref));
    expect(await runIO(program, testWorld())).toBe(42);
  });

  it('writeRef обновляет ячейку, видно следующему readRef', async () => {
    const program = bind(newRef(0), (ref) => andThen(writeRef(ref, 7), readRef(ref)));
    expect(await runIO(program, testWorld())).toBe(7);
  });

  it('modifyRef применяет функцию к содержимому', async () => {
    const program = bind(newRef(10), (ref) =>
      andThen(
        modifyRef(ref, (n) => n * 3),
        readRef(ref),
      ),
    );
    expect(await runIO(program, testWorld())).toBe(30);
  });

  it('IORef виден через bind, проходит как обычное значение', async () => {
    const program = bind(newRef([] as Array<string>), (log) =>
      bind(
        modifyRef(log, (xs) => [...xs, 'a']),
        () =>
          bind(
            modifyRef(log, (xs) => [...xs, 'b']),
            () => readRef(log),
          ),
      ),
    );
    expect(await runIO(program, testWorld())).toEqual(['a', 'b']);
  });

  it('newRef в дереве, чистые данные: до runIO ячейки нет', () => {
    const program: IO<number> = bind(newRef(99), readRef);
    expect(program.tag).toBe('newRef');
    // initial лежит в узле как обычное поле, никакой ячейки.
    if (program.tag === 'newRef') {
      expect(program.initial).toBe(99);
    }
  });
});

describe('E9.2 -- ячейка локальна для прогона (через doIO)', () => {
  // Сквозной myProgram, переписанный на doIO + IORef из lesson 9.3:
  // считаем число шагов, печатаем итог. Если ячейка случайно утекла на этап
  // сборки дерева, второй прогон вместо `Steps: 4` показал бы `Steps: 8`.
  const myProgram: IO<void> = doIO(function* () {
    const stepCount = yield* iterableNewRef(0);

    yield* iterableWriteLine('What is your name?');
    yield* iterableModifyRef(stepCount, (n) => n + 1);
    const name = yield* iterableReadLine;

    yield* iterableWriteLine(`Hello, ${name}! How old are you?`);
    yield* iterableModifyRef(stepCount, (n) => n + 1);
    const age = yield* iterableReadLine;

    yield* iterableWriteLine('Loading greeting of the day...');
    yield* iterableModifyRef(stepCount, (n) => n + 1);
    const body = yield* iterableFetchUrl('https://api/uuid');

    yield* iterableModifyRef(stepCount, (n) => n + 1);
    const total = yield* iterableReadRef(stepCount);
    yield* iterableWriteLine(`Wow, ${name}, ${age}! Token: ${body}. Steps: ${total}`);
  });

  const expectedFinal = (name: string, token: string): string =>
    `Wow, ${name}, ${age(name)}! Token: ${token}. Steps: 4`;

  // Возраст подбираю по имени, чтобы тест читался самоописанно.
  const age = (name: string): string => (name === 'Alice' ? '30' : '25');

  it('первый прогон видит итог Steps: 4', async () => {
    const w = testWorld({
      inputs: ['Alice', '30'],
      fetchMocks: { 'https://api/uuid': 'uuid-1' },
    });
    await runIO(myProgram, w);
    expect(w.output).toHaveLength(4);
    expect(w.output[3]).toBe(expectedFinal('Alice', 'uuid-1'));
  });

  it('второй прогон того же IO против другого мира снова видит Steps: 4', async () => {
    const w1 = testWorld({
      inputs: ['Alice', '30'],
      fetchMocks: { 'https://api/uuid': 'uuid-1' },
    });
    const w2 = testWorld({
      inputs: ['Bob', '25'],
      fetchMocks: { 'https://api/uuid': 'uuid-2' },
    });

    await runIO(myProgram, w1);
    await runIO(myProgram, w2);

    expect(w1.output[3]).toBe(expectedFinal('Alice', 'uuid-1'));
    expect(w2.output[3]).toBe(expectedFinal('Bob', 'uuid-2'));
  });

  it('счётчик-программа без IO эффектов: читаем в return', async () => {
    const counter = doIO(function* () {
      const ref = yield* iterableNewRef(0);
      yield* iterableModifyRef(ref, (n) => n + 1);
      yield* iterableModifyRef(ref, (n) => n + 1);
      return yield* iterableReadRef(ref);
    });

    // Каждый прогон, своя ячейка: оба раза 2, не 4.
    expect(await runIO(counter, testWorld())).toBe(2);
    expect(await runIO(counter, testWorld())).toBe(2);
  });
});
