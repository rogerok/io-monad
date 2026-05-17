import { mkIO } from "./mk-io.ts";
import { IO, IORef } from "./types.ts";

export const pure = <A>(value: A): IO<A> =>
  mkIO({
    tag: "pure",
    value: value,
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

export const fetchUrl = (url: string, options?: RequestInit): IO<string> =>
  mkIO({
    next: pure,
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

export const suspend = <A>(thunk: () => IO<A>): IO<A> =>
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
