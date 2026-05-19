import { IO, IORef } from "./types.ts";
import { exhaustive } from "./utils.ts";
import { World } from "./world.ts";

export const runIO = async <A>(io: IO<A>, world: World): Promise<A> => {
  let current: IO<any, any> = io;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    switch (current.tag) {
      case "pure": {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return current.value;
      }
      // TODO: wrap in try
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
        const body = await world.fetch(current.url, current.options);
        current = current.next(body);
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

      default:
        return exhaustive(current);
    }
  }
};
