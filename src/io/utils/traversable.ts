import { andThen, bind, map } from "../combinators/index.ts";
import { pure } from "../constructors/index.ts";
import { IO } from "../core/types.ts";

export const forEach = <A>(arr: IO<A>[]): IO<void> =>
  arr.reduce<IO<void>>((acc, item) => map(andThen(acc, item), () => undefined), pure(undefined));

export const sequence = <A>(arr: IO<A>[]): IO<Array<A>> =>
  arr.reduce<IO<Array<A>>>(
    (acc, item) => bind(acc, (pureArr) => bind(item, (pureItem) => pure([...pureArr, pureItem]))),
    pure([]),
  );
