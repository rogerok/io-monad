import { pure, suspend } from "./ constructors.ts";
import { bind } from "./index.ts";
import { IO, IOGen } from "./type.ts";

export const doIo = <A>(genFn: () => IOGen<A>): IO<A> =>
  suspend(() => {
    const gen = genFn();

    const walk = (v: unknown): IO<A> => {
      const result = gen.next(v);

      if (result.done) {
        return pure(result.value);
      }

      return bind(result.value.value, (v) => suspend(() => walk(v)));
    };

    return walk(undefined);
  });
