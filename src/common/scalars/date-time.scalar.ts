import { Scalar } from '@nestjs/graphql';
import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

@Scalar('DateTime')
export class DateTimeScalar extends GraphQLScalarType {
  constructor() {
    super({
      name: 'DateTime',
      description: 'DateTime custom scalar type',

      serialize(value: unknown): string {
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === 'string') {
          return value;
        }
        if (typeof value === 'number') {
          return new Date(value).toISOString();
        }
        throw new Error('GraphQL DateTime Scalar serializer expected a `Date` object');
      },

      parseValue(value: unknown): Date {
        if (typeof value === 'string') {
          return new Date(value);
        }
        if (typeof value === 'number') {
          return new Date(value);
        }
        throw new Error('GraphQL DateTime Scalar parser expected a `string` or `number`');
      },

      parseLiteral(ast: ValueNode): Date | null {
        if (ast.kind === Kind.STRING) {
          return new Date(ast.value);
        }
        if (ast.kind === Kind.INT) {
          return new Date(parseInt(ast.value, 10));
        }
        return null;
      },
    });
  }
} 