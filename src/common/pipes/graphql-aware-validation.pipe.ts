import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

@Injectable()
export class GraphQLAwareValidationPipe implements PipeTransform {
  private validationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  transform(value: any, metadata: ArgumentMetadata) {
    // Skip validation for GraphQL input types
    if (metadata.metatype && this.isGraphQLInputType(metadata.metatype)) {
      console.log(`🔍 GraphQL input detected: ${metadata.metatype.name}, skipping validation`);
      return value;
    }
    
    console.log(`🔍 REST input detected: ${metadata.metatype?.name || 'unknown'}, applying validation`);
    return this.validationPipe.transform(value, metadata);
  }

  private isGraphQLInputType(metatype: any): boolean {
    // Check if the class has GraphQL @InputType() decorator
    if (!metatype || !metatype.name) return false;
    
    // Check for GraphQL input type naming patterns
    const isGraphQLInput = metatype.name.includes('Input') || 
                          metatype.name.includes('Create') ||
                          metatype.name.includes('Update') ||
                          metatype.name.includes('Submit') ||
                          metatype.name.includes('Save') ||
                          metatype.name.includes('Add') ||
                          metatype.name.includes('Delete');
    
    // Also check if the class has GraphQL metadata
    const hasGraphQLMetadata = metatype.prototype && 
                              (metatype.prototype.constructor.name.includes('Input') ||
                               metatype.prototype.constructor.name.includes('Create') ||
                               metatype.prototype.constructor.name.includes('Update'));
    
    return isGraphQLInput || hasGraphQLMetadata;
  }
}
