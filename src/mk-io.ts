import { YieldWrap } from "./gen.ts";
import { IO, RawIO } from "./types.ts";

export const mkIO = <A, E>(io: RawIO<A, E>): IO<A, E> => {
  Object.defineProperty(io, Symbol.iterator, {
    configurable: true,
    enumerable: false,
    value: function* () {
      return (yield new YieldWrap(this)) as A;
    },
    writable: false,
  });

  return io as IO<A, E>;
};
