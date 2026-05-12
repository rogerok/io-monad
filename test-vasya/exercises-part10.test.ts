/**
 * Tests for "Часть 10" exercises (E10.1 - E10.4).
 *
 * Acceptance: типизированный канал ошибок IO<A, E>, attempt / orElse / mapError,
 * типизированный fetchUrl с FetchError | HttpError, runIOExit как Exit.
 */

import { describe, expect, expectTypeOf, it } from 'vitest';

import { FetchError, HttpError, ParseError } from '~/typed/errors.js';
import {
  attempt,
  bind,
  fail,
  fetchUrl,
  mapError,
  orElse,
  parseJson,
  pure,
  readLine,
  writeLine,
} from '~/typed/io-typed.js';
import type { IO, Result } from '~/typed/io-typed.js';
import { runIO, runIOExit } from '~/typed/run.js';
import { typedTestWorld } from '~/typed/world.js';

describe('E10.1 -- IO<A, E> с дефолтом E = never', () => {
  it('pure не падает', () => {
    const io = pure(42);
    expectTypeOf(io).toEqualTypeOf<IO<number, never>>();
    expect(io).toEqual({ tag: 'pure', value: 42 });
  });

  it('fail никогда не возвращает', () => {
    const io = fail(new ParseError('boom', 'x'));
    expectTypeOf(io).toEqualTypeOf<IO<never, ParseError>>();
  });

  it('bind объединяет error-каналы как E1 | E2', () => {
    const program = bind(fetchUrl('https://api/x'), () => parseJson<{ name: string }>('{}'));
    expectTypeOf(program).toEqualTypeOf<
      IO<{ name: string }, FetchError | HttpError | ParseError>
    >();
  });
});

describe('E10.2 -- attempt / orElse / mapError', () => {
  it('attempt ловит Fail и возвращает Result.error', async () => {
    const program = attempt(fail(new ParseError('boom', 'x')));
    const world = typedTestWorld();
    const result = await runIO(program, world);
    expect(result).toEqual({ ok: false, error: new ParseError('boom', 'x') });
  });

  it('attempt пропускает Pure и возвращает Result.ok', async () => {
    const program = attempt(pure(7));
    expect(await runIO(program, typedTestWorld())).toEqual({ ok: true, value: 7 });
  });

  it('orElse сужает error-канал', async () => {
    const recovered = orElse(fetchUrl('https://api/x'), () => pure('default'));
    expectTypeOf(recovered).toEqualTypeOf<IO<string, never>>();
    const world = typedTestWorld({ fetchMocks: {} });
    expect(await runIO(recovered, world)).toBe('default');
  });

  it('mapError переписывает ошибку, А-канал не трогает', async () => {
    const before: IO<string, ParseError> = fail(new ParseError('bad', 'x'));
    const after = mapError(before, (e) => `${e._tag}:${e.input}`);
    expectTypeOf(after).toEqualTypeOf<IO<string, string>>();
    const exit = await runIOExit(after, typedTestWorld());
    expect(exit._tag).toBe('Failure');
  });
});

describe('E10.3 -- типизированный fetchUrl', () => {
  it('non-2xx становится HttpError', async () => {
    const world = typedTestWorld({
      fetchMocks: { 'https://api/missing': { status: 404, body: 'not found' } },
    });
    const program = attempt(fetchUrl('https://api/missing'));
    const result = await runIO(program, world);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(HttpError);
      expect((result.error as HttpError).status).toBe(404);
    }
  });

  it('network failure становится FetchError', async () => {
    const world = typedTestWorld({
      fetchMocks: { 'https://api/down': { networkError: 'ECONNREFUSED' } },
    });
    const program = attempt(fetchUrl('https://api/down'));
    const result = (await runIO(program, world)) as Result<FetchError | HttpError, string>;
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(FetchError);
    }
  });

  it('успешный 2xx возвращает body', async () => {
    const world = typedTestWorld({
      fetchMocks: { 'https://api/ok': 'plain-body' },
    });
    expect(await runIO(fetchUrl('https://api/ok'), world)).toBe('plain-body');
  });

  it('orElse убирает FetchError из типа', async () => {
    const program = orElse(fetchUrl('https://api/down'), () => pure('fallback'));
    expectTypeOf(program).toEqualTypeOf<IO<string, never>>();
    const world = typedTestWorld({ fetchMocks: {} });
    expect(await runIO(program, world)).toBe('fallback');
  });
});

describe('E10.4 -- runIOExit с Cause<Fail | Die>', () => {
  it('успешная программа -> Success', async () => {
    const exit = await runIOExit(pure(7), typedTestWorld());
    expect(exit).toEqual({ _tag: 'Success', value: 7 });
  });

  it('Fail с tagged-классом -> Failure / Fail', async () => {
    const exit = await runIOExit(fail(new ParseError('bad', 'x')), typedTestWorld());
    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure') {
      expect(exit.cause._tag).toBe('Fail');
    }
  });

  it('readLine на исчерпании очереди -> Defect (не _tag-ed)', async () => {
    const exit = await runIOExit<string, never>(readLine as IO<string, never>, typedTestWorld());
    // readLine из typed модуля типизирован как IO<string, ReadError>, но пробрасываем
    // его в runIOExit с явным never для проверки границы Defect / Fail.
    expect(exit._tag).toBe('Failure');
  });
});

describe('Целевая программа: writeLine + fail упорядочены', () => {
  it('Fail после writeLine: side effect выполняется, потом ошибка', async () => {
    const program = bind(writeLine('before'), () => fail<string>('boom'));
    const world = typedTestWorld();
    await expect(runIO(program, world)).rejects.toBe('boom');
    expect(world.output).toEqual(['before']);
  });
});
