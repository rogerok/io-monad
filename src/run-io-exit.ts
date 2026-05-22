import { runIO } from "./run-io.ts";
import { Exit, IO } from "./types.ts";
import { World } from "./world.ts";

const isDslError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "_tag" in error;

export const runIOExit = async <A, E>(io: IO<A, E>, world: World): Promise<Exit<E, A>> => {
  try {
    const value = await runIO(io, world);
    return { _tag: "Success", value };
  } catch (error) {
    if (isDslError(error)) {
      return {
        _tag: "Failure",
        cause: {
          _tag: "Fail",
          error: error as E,
        },
      };
    }
    return {
      _tag: "Failure",
      cause: {
        _tag: "Die",
        defect: error,
      },
    };
  }

  // while (true) {
  //   switch (current.tag) {
  //     case "pure":
  //       return {
  //         _tag: "Success",
  //         value: current.value,
  //       };
  //
  //     case "writeLine": {
  //       try {
  //         await world.writeLine(current.text);
  //         current = current.next;
  //       } catch (e) {
  //         current = die(e);
  //       }
  //       break;
  //     }
  //
  //     case "readLine": {
  //       try {
  //         const res = await world.readLine();
  //         current = current.next(res);
  //       } catch (e) {
  //         current = die(e);
  //       }
  //       break;
  //     }
  //
  //     case "fetch": {
  //       try {
  //         const res = await world.fetch(current.url, current.options);
  //         current = current.next(res);
  //       } catch (e) {
  //         current = die(e);
  //       }
  //       break;
  //     }
  //
  //     case "sleep": {
  //       try {
  //         await world.sleep(current.ms);
  //         current = current.next;
  //       } catch (e) {
  //         current = die(e);
  //       }
  //       break;
  //     }
  //
  //     case "suspend": {
  //       try {
  //         current = current.thunk();
  //       } catch (e) {
  //         current = die(e);
  //       }
  //       break;
  //     }
  //
  //     case "newRef": {
  //       const ref: IORef<unknown> = { current: current.initial };
  //       current = current.next(ref);
  //       break;
  //     }
  //
  //     case "readRef": {
  //       current = current.next(current.ref.current);
  //       break;
  //     }
  //
  //     case "writeRef": {
  //       current.ref.current = current.value;
  //       current = current.next;
  //       break;
  //     }
  //
  //     case "die":
  //       return {
  //         _tag: "Failure",
  //         cause: {
  //           _tag: "Die",
  //           defect: current.defect,
  //         },
  //       };
  //
  //     case "fail":
  //       return {
  //         _tag: "Failure",
  //         cause: {
  //           _tag: "Fail",
  //           error: current.error,
  //         },
  //       };
  //
  //     default:
  //       return exhaustive(current);
  //   }
  // }
};
