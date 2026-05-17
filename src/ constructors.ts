import { mkIO } from "./mk-io.ts";
import { IO, IORef } from "./types.ts";

export const pure = <A>(value: A): IO<A, never> =>
  mkIO({
    tag: "pure",
    value: value,
  });

export const fail = <E>(error: E): IO<never, E> =>
  mkIO({
    error,
    tag: "fail",
  });

export const readLine: IO<string, never> = mkIO({
  next: pure,
  tag: "readLine",
});

export const writeLine = (text: string): IO<void, never> =>
  mkIO({
    next: pure(undefined),
    tag: "writeLine",
    text,
  });

export const fetchUrl = (url: string, options?: RequestInit): IO<string, unknown> =>
  mkIO({
    next: pure,
    options,
    tag: "fetch",
    url,
  });

export const sleep = (ms: number): IO<void, never> =>
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

export const newRef = <A>(initial: A): IO<IORef<A>, never> =>
  mkIO({
    initial,
    next: (ref) => pure(ref as IORef<A>),
    tag: "newRef",
  });

export const readRef = <A>(ref: IORef<A>): IO<A, never> =>
  mkIO({
    next: (v) => pure(v as A),
    ref: ref,
    tag: "readRef",
  });

export const writeRef = <A>(ref: IORef<A>, value: A): IO<void, never> =>
  mkIO({
    next: pure(undefined),
    ref: ref,
    tag: "writeRef",
    value,
  });
