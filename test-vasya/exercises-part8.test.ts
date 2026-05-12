/**
 * Tests for "Часть 8" exercises (E8.1 - E8.4).
 *
 * Acceptance: три encoding doIO (naive / adapter / Symbol.iterator) дают
 * абсолютно одинаковый output для одной и той же бизнес-логики.
 */

import { describe, expect, expectTypeOf, it } from 'vitest';

import { doIO as doIOAdapter, _ } from '~/do/adapter.js';
import {
  fetchUrl as iterableFetchUrl,
  readLine as iterableReadLine,
  writeLine as iterableWriteLine,
} from '~/do/iterable-constructors.js';
import { doIO as doIONaive } from '~/do/naive.js';
import { doIO as doIOSymbol } from '~/do/symbol-iterator.js';
import type { IO } from '~/io.js';
import { fetchUrl, readLine, writeLine } from '~/io.js';
import { runIO } from '~/run.js';
import { testWorld } from '~/world.js';

const expectedOutput = [
  'What is your name?',
  'Hello, Alice! How old are you?',
  'Loading greeting of the day...',
  "Wow, Alice, 30! Today's lucky token: token-123",
];

const inputs = ['Alice', '30'] as const;
const fetchMocks = { 'https://api/uuid': 'token-123' } as const;

describe('E8.1 -- naive doIO с as A снаружи', () => {
  const program: IO<void> = doIONaive(function* () {
    yield writeLine('What is your name?');
    const name = (yield readLine) as string;
    yield writeLine(`Hello, ${name}! How old are you?`);
    const age = (yield readLine) as string;
    yield writeLine('Loading greeting of the day...');
    const body = (yield fetchUrl('https://api/uuid')) as string;
    yield writeLine(`Wow, ${name}, ${age}! Today's lucky token: ${body}`);
  });

  it('output совпадает с ожидаемым', async () => {
    const world = testWorld({ inputs: [...inputs], fetchMocks });
    await runIO(program, world);
    expect(world.output).toEqual(expectedOutput);
  });
});

describe('E8.2 -- adapter _(io), без `as` снаружи', () => {
  const program: IO<void> = doIOAdapter(function* () {
    yield* _(writeLine('What is your name?'));
    const name = yield* _(readLine);
    expectTypeOf(name).toEqualTypeOf<string>();
    yield* _(writeLine(`Hello, ${name}! How old are you?`));
    const age = yield* _(readLine);
    yield* _(writeLine('Loading greeting of the day...'));
    const body = yield* _(fetchUrl('https://api/uuid'));
    yield* _(writeLine(`Wow, ${name}, ${age}! Today's lucky token: ${body}`));
  });

  it('output совпадает с ожидаемым', async () => {
    const world = testWorld({ inputs: [...inputs], fetchMocks });
    await runIO(program, world);
    expect(world.output).toEqual(expectedOutput);
  });
});

describe('E8.3 -- Symbol.iterator, yield* io напрямую', () => {
  const program: IO<void> = doIOSymbol(function* () {
    yield* iterableWriteLine('What is your name?');
    const name = yield* iterableReadLine;
    expectTypeOf(name).toEqualTypeOf<string>();
    yield* iterableWriteLine(`Hello, ${name}! How old are you?`);
    const age = yield* iterableReadLine;
    yield* iterableWriteLine('Loading greeting of the day...');
    const body = yield* iterableFetchUrl('https://api/uuid');
    yield* iterableWriteLine(`Wow, ${name}, ${age}! Today's lucky token: ${body}`);
  });

  it('output совпадает с ожидаемым', async () => {
    const world = testWorld({ inputs: [...inputs], fetchMocks });
    await runIO(program, world);
    expect(world.output).toEqual(expectedOutput);
  });

  it('Symbol.iterator не светится в JSON.stringify', () => {
    const io = iterableWriteLine('hi');
    const json = JSON.stringify(io);
    // Symbol.iterator -- non-enumerable, поэтому в JSON.stringify он не уходит.
    expect(json).toBe('{"tag":"writeLine","text":"hi","next":{"tag":"pure"}}');
    expect(Object.keys(io).sort()).toEqual(['next', 'tag', 'text']);
  });
});

describe('E8.5 -- одна программа, переиспользуемая между прогонами', () => {
  // Этот тест ловит баг с одноразовым генератором: без `suspend` в `doIO`
  // второй прогон отрабатывал бы только первую инструкцию и тихо завершался,
  // потому что `gen` внутри замыкания исчерпывался после первого `runIO`.

  const expectFull = (output: ReadonlyArray<string>, name: string, token: string): void => {
    expect(output).toHaveLength(4);
    expect(output[0]).toBe('What is your name?');
    expect(output[3]).toContain(name);
    expect(output[3]).toContain(token);
  };

  const runTwice = async (program: IO<void>): Promise<void> => {
    const w1 = testWorld({
      inputs: ['Alice', '30'],
      fetchMocks: { 'https://api/uuid': 'uuid-1' },
    });
    const w2 = testWorld({
      inputs: ['Bob', '25'],
      fetchMocks: { 'https://api/uuid': 'uuid-2' },
    });

    await runIO(program, w1);
    await runIO(program, w2);

    expectFull(w1.output, 'Alice', 'uuid-1');
    expectFull(w2.output, 'Bob', 'uuid-2');
    expect(w1.fetches).toHaveLength(1);
    expect(w2.fetches).toHaveLength(1);
  };

  it('naive doIO: один и тот же myProgram прогоняется дважды', async () => {
    const program: IO<void> = doIONaive(function* () {
      yield writeLine('What is your name?');
      const name = (yield readLine) as string;
      yield writeLine(`Hello, ${name}! How old are you?`);
      const age = (yield readLine) as string;
      yield writeLine('Loading greeting of the day...');
      const body = (yield fetchUrl('https://api/uuid')) as string;
      yield writeLine(`Wow, ${name}, ${age}! Today's lucky token: ${body}`);
    });
    await runTwice(program);
  });

  it('adapter doIO: один и тот же myProgram прогоняется дважды', async () => {
    const program: IO<void> = doIOAdapter(function* () {
      yield* _(writeLine('What is your name?'));
      const name = yield* _(readLine);
      yield* _(writeLine(`Hello, ${name}! How old are you?`));
      const age = yield* _(readLine);
      yield* _(writeLine('Loading greeting of the day...'));
      const body = yield* _(fetchUrl('https://api/uuid'));
      yield* _(writeLine(`Wow, ${name}, ${age}! Today's lucky token: ${body}`));
    });
    await runTwice(program);
  });

  it('symbol-iterator doIO: один и тот же myProgram прогоняется дважды', async () => {
    const program: IO<void> = doIOSymbol(function* () {
      yield* iterableWriteLine('What is your name?');
      const name = yield* iterableReadLine;
      yield* iterableWriteLine(`Hello, ${name}! How old are you?`);
      const age = yield* iterableReadLine;
      yield* iterableWriteLine('Loading greeting of the day...');
      const body = yield* iterableFetchUrl('https://api/uuid');
      yield* iterableWriteLine(`Wow, ${name}, ${age}! Today's lucky token: ${body}`);
    });
    await runTwice(program);
  });
});

describe('E8.4 -- три encoding эквивалентны', () => {
  it('одинаковый output на одной программе через все три doIO', async () => {
    const w1 = testWorld({ inputs: [...inputs], fetchMocks });
    const w2 = testWorld({ inputs: [...inputs], fetchMocks });
    const w3 = testWorld({ inputs: [...inputs], fetchMocks });

    const naive: IO<void> = doIONaive(function* () {
      yield writeLine('hi');
      const x = (yield readLine) as string;
      yield writeLine(`echo ${x}`);
    });
    const adapter: IO<void> = doIOAdapter(function* () {
      yield* _(writeLine('hi'));
      const x = yield* _(readLine);
      yield* _(writeLine(`echo ${x}`));
    });
    const symbol: IO<void> = doIOSymbol(function* () {
      yield* iterableWriteLine('hi');
      const x = yield* iterableReadLine;
      yield* iterableWriteLine(`echo ${x}`);
    });

    await runIO(naive, w1);
    await runIO(adapter, w2);
    await runIO(symbol, w3);

    expect(w1.output).toEqual(['hi', 'echo Alice']);
    expect(w2.output).toEqual(['hi', 'echo Alice']);
    expect(w3.output).toEqual(['hi', 'echo Alice']);
  });
});
