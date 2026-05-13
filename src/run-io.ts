import { IO, World } from "./type.ts";
import { exhaustive } from "./utils.ts";

export const runIO = async <A>(io: IO<A>, world: World): Promise<A> => {
  let current: IO<any> = io;

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
        const body = await world.fetch(current.url, current.options);
        current = current.next(body);
        break;
      }

      case "sleep": {
        await world.sleep(current.ms);
        current = current.next;
        break;
      }

      default:
        return exhaustive(current);
    }
  }
};
