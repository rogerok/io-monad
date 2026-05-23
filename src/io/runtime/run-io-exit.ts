import { Exit, IO } from "../core/types.ts";
import { runIO } from "./run-io.ts";
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
};
