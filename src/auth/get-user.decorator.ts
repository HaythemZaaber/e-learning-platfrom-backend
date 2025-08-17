import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    try {
      // Handle GraphQL context
      if (ctx.getType() === 'graphql' as any) {
        const gqlCtx = GqlExecutionContext.create(ctx);
        const context = gqlCtx.getContext();
        // In GraphQL, user is set on req.user by the AuthGuard
        return context.req?.user || null;
      }
      
      // Handle HTTP context
      const request = ctx.switchToHttp().getRequest();
      return request.user || null;
    } catch (error) { 
      return null;
    }
  },
);
