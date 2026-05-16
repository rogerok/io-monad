import { YieldWrap } from "./gen.ts";
import { IO, RawIO } from "./types.ts";

export const mkIO = <A>(io: RawIO<A>): IO<A> => {
  Object.defineProperty(io, Symbol.iterator, {
    configurable: true,
    enumerable: false,
    value: function* () {
      return (yield new YieldWrap(this)) as A;
    },
    writable: false,
  });

  return io as IO<A>;
};
