/**
 * Интеграционный путь: одна и та же сквозная программа в трёх encoding-ах
 * (вложенные bind, do-notation на Symbol.iterator, Freer) даёт идентичный
 * пользовательский output.
 *
 * Это и есть главный takeaway урока: программа, как данные, можно переписать
 * представление, не меняя смысл.
 */

import { describe, expect, it } from 'vitest';

import { program as bindProgram } from '~/examples/program-bind.js';
import { program as adapterProgram } from '~/examples/program-do-adapter.js';
import { program as naiveProgram } from '~/examples/program-do-naive.js';
import { program as symbolProgram } from '~/examples/program-do-symbol.js';
import { program as freerProgram } from '~/examples/program-freer.js';
import type { FreerWorld } from '~/freer/run.js';
import { runIO as runFreer } from '~/freer/run.js';
import { runIO } from '~/run.js';
import { testWorld } from '~/world.js';

const inputs = ['Alice', '30'] as const;
const fetchMocks = { 'https://httpbin.org/uuid': 'token-123' } as const;

const expected = [
  'What is your name?',
  'Hello, Alice! How old are you?',
  'Loading greeting of the day...',
  "Wow, Alice, 30! Today's lucky token: token-123",
];

describe('Сквозной пример в трёх IO-encoding-ах', () => {
  it('вложенные bind (Часть 7)', async () => {
    const world = testWorld({ inputs: [...inputs], fetchMocks });
    await runIO(bindProgram, world);
    expect(world.output).toEqual(expected);
  });

  it('наивный doIO с as string', async () => {
    const world = testWorld({ inputs: [...inputs], fetchMocks });
    await runIO(naiveProgram, world);
    expect(world.output).toEqual(expected);
  });

  it('adapter _(io)', async () => {
    const world = testWorld({ inputs: [...inputs], fetchMocks });
    await runIO(adapterProgram, world);
    expect(world.output).toEqual(expected);
  });

  it('Symbol.iterator (Effect-TS production-grade)', async () => {
    const world = testWorld({ inputs: [...inputs], fetchMocks });
    await runIO(symbolProgram, world);
    expect(world.output).toEqual(expected);
  });
});

describe('Сквозной пример поверх Freer (Часть 10)', () => {
  it('Freer-программа с Random выбирает приветствие из массива', async () => {
    const world: FreerWorld & { output: Array<string> } = makeFreerWorld({
      inputs: [...inputs],
      fetchMocks: { 'https://httpbin.org/uuid': 'token-123' },
      randoms: [0.0],
    });
    await runFreer(freerProgram, world);
    expect(world.output[0]).toBe('What is your name?');
    expect(world.output.at(-1)).toBe('Salut, Alice, 30! Token: token-123');
  });
});

function makeFreerWorld(options: {
  inputs: ReadonlyArray<string>;
  fetchMocks: Record<string, string>;
  randoms: ReadonlyArray<number>;
}): FreerWorld & { output: Array<string> } {
  const inputQueue = [...options.inputs];
  const randomQueue = [...options.randoms];
  const output: Array<string> = [];
  return {
    output,
    readLine: async () => {
      if (inputQueue.length === 0) throw new Error('out of inputs');
      return inputQueue.shift()!;
    },
    writeLine: async (text) => {
      output.push(text);
    },
    fetch: async (url) => {
      const body = options.fetchMocks[url];
      if (body === undefined) throw new Error(`fetch to ${url} not mocked`);
      return body;
    },
    sleep: async () => {},
    random: () => randomQueue.shift() ?? 0.5,
  };
}
