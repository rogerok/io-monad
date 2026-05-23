export class YieldWrap<T> {
  readonly _Y!: () => T;
  constructor(readonly value: T) {}
}
