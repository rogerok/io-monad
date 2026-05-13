import { suspend } from "./ constructors.ts";
import { IO, IOGen } from "./type.ts";

export const doIo = <A>(genFn: () => IOGen<A>): IO<A> =>
  suspend(() => {
    const gen = genFn();
  });
