import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../../generated/prisma';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of the user',
});

@ObjectType()
export class UserObject {
  @Field(() => ID)
  id: string;

  @Field()
  clerkId: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  zip?: string;

  @Field({ nullable: true })
  country?: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 