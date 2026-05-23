import { freerBind } from "./combinators/bind.ts";
import { freerPure, freerSuspend } from "./constructors/index.ts";
import { FreerGen, FreerIO } from "./core/types.ts";

export const freerDo = <A>(genFn: () => FreerGen<A>): FreerIO<A> =>
  freerSuspend(() => {
    const gen = genFn();

    const walk = (v: unknown): FreerIO<A> => {
      const result = gen.next(v);

      if (result.done) {
        return freerPure(result.value);
      }

      return freerBind(result.value.value, (v) => freerSuspend(() => walk(v)));
    };

    return walk(undefined);
  });
