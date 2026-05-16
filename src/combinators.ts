import { pure } from "./ constructors.ts";
import { mkIO } from "./mk-io.ts";
import { IO } from "./types.ts";
import { exhaustive } from "./utils.ts";

export const bind = <A, B>(io: IO<A>, f: (a: A) => IO<B>): IO<B> => {
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

    default:
      return exhaustive(io);
  }
};

export const map = <A, B>(io: IO<A>, f: (a: A) => B): IO<B> => bind(io, (a) => pure(f(a)));

export const andThen = <A, B>(first: IO<A>, second: IO<B>): IO<B> => bind(first, () => second);
