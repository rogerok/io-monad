import { freerFetchUrl, freerReadLine, freerWriteLine } from "./constructors.ts";
import { freerDo } from "./freer-do.ts";

const myProgram = freerDo(function* () {
  yield* freerWriteLine("What is your name?");
  const name = yield* freerReadLine;
  yield* freerWriteLine(`Hello, ${name}! How old are you?`);
  const age = yield* freerReadLine;
  yield* freerWriteLine("Loading greeting of the day...");
  const body = yield* freerFetchUrl("https://httpbin.org/uuid");
  yield* freerWriteLine(`Wow, ${name}, ${age}! Token: ${body}`);
});

// void (async () => {
//   const rl = readline.createInterface({ input, output });
//
//   const productionNodeWorld = {
//     fetch: async (url: string, options?: RequestInit) => {
//       let resp: Response;
//
//       try {
//         resp = await fetch(url, options);
//       } catch (e) {
//         throw new FetchError(url, e);
//       }
//
//       if (resp.status > 299) {
//         throw new HttpError(resp.status, url);
//       } else {
//         return await resp.text();
//       }
//     },
//     readLine: () => rl.question(""),
//     sleep: sleep,
//     //  eslint-disable-next-line @typescript-eslint/require-await
//     writeLine: async (s: string) => {
//       console.log(s);
//     },
//   };
//
//   await runIO(myProgram, productionNodeWorld);
//   rl.close();
// })();
