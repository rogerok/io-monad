import { Freer } from "./types.ts";

export const freerBind = <I, A, B>(m: Freer<I, A>, f: (a: A) => Freer<I, B>): Freer<I, B> => {
  if (m.tag === "pure") return f(m.value);

  return {
    cont: (resp) => freerBind(m.cont(resp), f),
    op: m.op,
    tag: "impure",
  };
};
