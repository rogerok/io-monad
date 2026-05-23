import { exhaustive } from "../../shared/exhaustive.ts";
import { FreerIO, FreerWorld } from "../core/types.ts";

export const freerRun = async <A>(freer: FreerIO<A>, world: FreerWorld): Promise<A> => {
  let current: FreerIO<A> = freer;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
        break;
      }

      case "fetch": {
        const v = await world.fetch(op.url, op.options);
        current = current.cont(v);
        break;
      }

      case "random": {
        current = current.cont(world.random());
        break;
      }

      case "sleep": {
        await world.sleep(op.ms);
        current = current.cont();
        break;
      }

      case "fail": {
        throw op.error;
      }

      default:
        return exhaustive(op);
    }
  }
};

export const runWithLogging = async <A>(
  freer: FreerIO<A>,
  world: FreerWorld,
  log: (...args: any[]) => void,
): Promise<A> => {
  const decoratedWorld: FreerWorld = {
    fetch: async (url, options) => {
      log("[freer]: fetch", url);
      return world.fetch(url, options);
    },
    random: () => {
      const random = Math.random();
      log(`[freer]: random with`, random);
      return random;
    },
    readLine: async () => {
      log(`[freer]: readLine`);
      return world.readLine();
    },
    sleep: (ms) => {
      log(`[freer]: sleep`, ms);
      return world.sleep(ms);
    },
    writeLine: async (text) => {
      log(`[freer]: writeLine `, text);
      return world.writeLine(text);
    },
  };

  return freerRun(freer, decoratedWorld);
};
