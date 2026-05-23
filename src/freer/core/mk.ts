import { YieldWrap } from "../../shared/yield-wrap.ts";
import { Freer, Instr, RawFreer } from "./types.ts";

export const freerMk = <I extends Instr<any>, A>(freer: RawFreer<I, A>): Freer<I, A> => {
  Object.defineProperty(freer, Symbol.iterator, {
    configurable: true,
    enumerable: false,
    value: function* () {
      return (yield new YieldWrap(this)) as A;
    },
    writable: false,
  });

  return freer as Freer<I, A>;
};
