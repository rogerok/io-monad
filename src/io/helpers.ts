import { pure } from "./constructors/index.ts";
import { IO } from "./core/types.ts";

export const unit: IO<void> = pure(undefined);
