export interface LabeledValue<T extends string = string> {
  readonly value: T;
  readonly label: string;
}
