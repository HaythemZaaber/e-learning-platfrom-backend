import { Transform } from 'class-transformer';

export function GQLDate() {
  return Transform(({ value }) => new Date(value).toISOString());
}
