import { exhaustive } from "../utils.ts";
import { freerMk } from "./freer-mk.ts";
import { Freer, Instr } from "./types.ts";

export const freerBind = <I extends Instr<any>, A, B>(
  m: Freer<I, A>,
  f: (a: A) => Freer<I, B>,
): Freer<I, B> => {
  switch (m.tag) {
    case "pure":
      return f(m.value);

    case "suspend":
      return freerMk({
        tag: m.tag,
        thunk: () => freerBind(m.thunk(), f),
      });

    case "impure":
      return freerMk({
        cont: (resp) => freerBind(m.cont(resp), f),
        op: m.op,
        tag: "impure",
      });

    default:
      return exhaustive(m);
  }
};
