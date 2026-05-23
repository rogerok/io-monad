import { FetchError, HttpError } from "../utils/errors.ts";
import { mkIO } from "../core/mk-io.ts";
import { Cause, Exit, IO, IORef } from "../core/types.ts";

export const pure = <A>(value: A): IO<A> =>
  mkIO({
    tag: "pure",
    value: value,
  });

export const fail = <E>(error: E): IO<never, E> =>
  mkIO({
    error,
    tag: "fail",
  });

export const readLine: IO<string> = mkIO({
  next: pure,
  tag: "readLine",
});

export const writeLine = (text: string): IO<void> =>
  mkIO({
    next: pure(undefined),
    tag: "writeLine",
    text,
  });

export const fetchUrl = (url: string, options?: RequestInit): IO<string, FetchError | HttpError> =>
  mkIO({
    next: pure,
    onError: (e) =>
      fail(
        e instanceof HttpError || e instanceof FetchError
          ? e
          : new FetchError(url, "unknown error"),
      ),
    options,
    tag: "fetch",
    url,
  });

export const sleep = (ms: number): IO<void> =>
  mkIO({
    ms,
    next: pure(undefined),
    tag: "sleep",
  });

export const suspend = <A, E>(thunk: () => IO<A, E>): IO<A, E> =>
  mkIO({
    tag: "suspend",
    thunk,
  });

export const newRef = <A>(initial: A): IO<IORef<A>> =>
  mkIO({
    initial,
    next: (ref) => pure(ref as IORef<A>),
    tag: "newRef",
  });

export const readRef = <A>(ref: IORef<A>): IO<A> =>
  mkIO({
    next: (v) => pure(v as A),
    ref: ref,
    tag: "readRef",
  });

export const writeRef = <A>(ref: IORef<A>, value: A): IO<void> =>
  mkIO({
    next: pure(undefined),
    ref: ref,
    tag: "writeRef",
    value,
  });

export const die = (defect: unknown): IO<never> =>
  mkIO({
    defect,
    tag: "die",
  });

export const success = <A>(value: A): Exit<never, A> => ({
  _tag: "Success",
  value,
});

export const failure = <E>(cause: Cause<E>): Exit<E, never> => ({
  _tag: "Failure",
  cause,
});
