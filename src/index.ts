import { pure } from "./ constructors.ts";
import { IO } from "./type.ts";

export const bind = <A, B>(io: IO<A>, f: (a: A) => IO<B>): IO<B> => {
  switch (io.tag) {
    case "pure":
      return f(io.value);

    case "writeLine":
      return {
        next: bind(io.next, f),
        tag: "writeLine",
        text: io.text,
      };

    case "readLine":
      return {
        next: (a) => bind(io.next(a), f),
        tag: "readLine",
      };
  }
};

export const map = <A, B>(io: IO<A>, f: (a: A) => B): IO<B> => bind(io, (a) => pure(f(a)));
export const andThen = <A, B>(first: IO<A>, second: IO<B>): IO<B> => bind(first, () => second);

export const sequence = <A>(arr: IO<A>[]): IO<Array<A>> =>
  arr.reduce<IO<Array<A>>>(
    (acc, item) => bind(acc, (pureArr) => bind(item, (pureItem) => pure([...pureArr, pureItem]))),
    pure([]),
  );
