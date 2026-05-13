import { pure } from "./ constructors.ts";
import { IO } from "./type.ts";
import { exhaustive } from "./utils.ts";

export const bind = <A, B>(io: IO<A>, f: (a: A) => IO<B>): IO<B> => {
  switch (io.tag) {
    case "pure":
      return f(io.value);

    case "writeLine":
      return {
        next: bind(io.next, f),
        tag: io.tag,
        text: io.text,
      };

    case "readLine":
      return {
        next: (a) => bind(io.next(a), f),
        tag: io.tag,
      };

    case "fetch":
      return {
        next: (body) => bind(io.next(body), f),
        options: io.options,
        tag: io.tag,
        url: io.url,
      };

    case "sleep":
      return {
        ms: io.ms,
        next: bind(io.next, f),
        tag: io.tag,
      };

    default:
      return exhaustive(io);
  }
};

export const map = <A, B>(io: IO<A>, f: (a: A) => B): IO<B> => bind(io, (a) => pure(f(a)));
export const andThen = <A, B>(first: IO<A>, second: IO<B>): IO<B> => bind(first, () => second);

export const sequence = <A>(arr: IO<A>[]): IO<Array<A>> =>
  arr.reduce<IO<Array<A>>>(
    (acc, item) => bind(acc, (pureArr) => bind(item, (pureItem) => pure([...pureArr, pureItem]))),
    pure([]),
  );
