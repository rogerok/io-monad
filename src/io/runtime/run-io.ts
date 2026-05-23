import { IO, IORef } from "../core/types.ts";
import { exhaustive } from "../utils/index.ts";
import { World } from "./world.ts";

export const runIO = async <A, E>(io: IO<A, E>, world: World): Promise<A> => {
  let current: IO<any, any> = io;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    switch (current.tag) {
      case "pure": {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return current.value;
      }
      case "writeLine": {
        await world.writeLine(current.text);
        current = current.next;
        break;
      }

      case "readLine": {
        const res = await world.readLine();
        current = current.next(res);
        break;
      }

      case "fetch": {
        try {
          const body = await world.fetch(current.url, current.options);
          current = current.next(body);
        } catch (e) {
          if (current.tag === "fetch") current = current.onError(e);
        }
        break;
      }

      case "sleep": {
        await world.sleep(current.ms);
        current = current.next;
        break;
      }

      case "suspend": {
        current = current.thunk();
        break;
      }

      case "newRef": {
        const ref: IORef<unknown> = { current: current.initial };
        current = current.next(ref);
        break;
      }

      case "readRef": {
        current = current.next(current.ref.current);
        break;
      }

      case "writeRef": {
        current.ref.current = current.value;
        current = current.next;
        break;
      }

      case "fail": {
        throw current.error;
      }

      case "die": {
        throw current.defect;
      }

      default:
        return exhaustive(current);
    }
  }
};
