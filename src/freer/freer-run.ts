import { World } from "../world.ts";
import { FreerIO } from "./types.ts";

export const freerRun = async <I, A>(freer: FreerIO<I, A>, world: World): Promise<A> => {
  let current: FreerIO<I, A> = freer;

  while (true) {
    if (current.tag === "pure") {
      return current.value;
    }

    if (current.tag === "suspend") {
      current = current.thunk();
      continue;
    }

    const op = current.op;

    switch (op.tag) {
      case "readLine": {
        const v = await world.readLine();
        current = current.cont(v);
        break;
      }

      case "writeLine": {
        await world.writeLine(op.text);
        current = current.cont();
      }
    }
  }
};
