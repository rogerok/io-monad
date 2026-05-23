import { fail, pure, readRef, writeRef } from "../constructors/index.ts";
import { mkIO } from "../core/mk-io.ts";
import { IO, IORef, Result } from "../core/types.ts";
import { exhaustive } from "../utils/index.ts";

export const bind = <A, B, E1, E2>(io: IO<A, E1>, f: (a: A) => IO<B, E2>): IO<B, E1 | E2> => {
  switch (io.tag) {
    case "pure":
      return f(io.value);

    case "writeLine":
      return mkIO({
        next: bind(io.next, f),
        tag: io.tag,
        text: io.text,
      });

    case "readLine":
      return mkIO({
        next: (a) => bind(io.next(a), f),
        tag: io.tag,
      });

    case "fetch":
      return mkIO({
        next: (body) => bind(io.next(body), f),
        onError: (e) => bind(io.onError(e), f),
        options: io.options,
        tag: io.tag,
        url: io.url,
      });

    case "sleep":
      return mkIO({
        ms: io.ms,
        next: bind(io.next, f),
        tag: io.tag,
      });

    case "suspend":
      return mkIO({
        tag: io.tag,
        thunk: () => bind(io.thunk(), f),
      });

    case "newRef":
      return mkIO({
        initial: io.initial,
        next: (ref) => bind(io.next(ref), f),
        tag: io.tag,
      });

    case "readRef":
      return mkIO({
        next: (v) => bind(io.next(v), f),
        ref: io.ref,
        tag: io.tag,
      });

    case "writeRef":
      return mkIO({
        next: bind(io.next, f),
        ref: io.ref,
        tag: io.tag,
        value: io.value,
      });

    case "fail":
      return mkIO({
        error: io.error,
        tag: io.tag,
      });

    case "die":
      return mkIO({
        defect: io.defect,
        tag: io.tag,
      });

    default:
      return exhaustive(io);
  }
};

export const map = <A, B, E>(io: IO<A, E>, f: (a: A) => B): IO<B, E> => bind(io, (a) => pure(f(a)));
export const andThen = <A, B, E1, E2>(first: IO<A, E1>, second: IO<B, E2>): IO<B, E1 | E2> =>
  bind(first, () => second);

export const orElse = <A, E1, E2>(io: IO<A, E1>, fallback: (e: E1) => IO<A, E2>): IO<A, E2> =>
  bind(attempt(io), (r) => (r.ok ? pure(r.value) : fallback(r.error)));

export const mapError = <A, E1, E2>(io: IO<A, E1>, f: (e: E1) => E2): IO<A, E2> =>
  orElse(io, (e) => fail(f(e)));

export const modifyRef = <A>(ref: IORef<A>, f: (v: A) => A): IO<void> =>
  bind(readRef(ref), (a) => writeRef(ref, f(a)));

export const attempt = <A, E>(io: IO<A, E>): IO<Result<E, A>> => {
  switch (io.tag) {
    case "fail":
      return mkIO({
        tag: "pure",
        value: { error: io.error, ok: false },
      });

    case "pure":
      return mkIO({
        tag: "pure",
        value: { ok: true, value: io.value },
      });

    case "writeLine":
      return mkIO({
        next: attempt(io.next),
        tag: io.tag,
        text: io.text,
      });

    case "readLine": {
      return mkIO({
        next: (v) => attempt(io.next(v)),
        tag: io.tag,
      });
    }

    case "suspend": {
      return mkIO({
        tag: io.tag,
        thunk: () => attempt(io.thunk()),
      });
    }

    case "fetch":
      return mkIO({
        next: (v) => attempt(io.next(v)),
        onError: (e) => attempt(io.onError(e)),
        options: io.options,
        tag: io.tag,
        url: io.url,
      });

    case "sleep":
      return mkIO({
        ms: io.ms,
        next: attempt(io.next),
        tag: io.tag,
      });

    case "newRef":
      return mkIO({
        initial: io.initial,
        next: (ref) => attempt(io.next(ref)),
        tag: io.tag,
      });

    case "writeRef":
      return mkIO({
        next: attempt(io.next),
        ref: io.ref,
        tag: io.tag,
        value: io.value,
      });

    case "readRef":
      return mkIO({
        next: (v) => attempt(io.next(v)),
        ref: io.ref,
        tag: io.tag,
      });

    case "die":
      return mkIO({
        defect: io.defect,
        tag: io.tag,
      });

    default:
      return exhaustive(io);
  }
};
