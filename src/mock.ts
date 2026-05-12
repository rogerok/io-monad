import { IO } from "./type.ts";

export const greeting: IO<void> = {
  next: {
    next: (name) => ({
      next: { tag: "pure", value: undefined },
      tag: "writeLine",
      text: `Hello, ${name}!`,
    }),
    tag: "readLine",
  },
  tag: "writeLine",
  text: "What is your name?",
};
