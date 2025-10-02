// generate-suggestions.dto.ts
import { IsObject, IsEnum, IsOptional, IsNumber } from 'class-validator';

export enum SuggestionType {
  GENERAL = 'general',
  TITLE = 'title',
  DESCRIPTION = 'description',
  STRUCTURE = 'structure',
  SEO = 'seo',
  PRICING = 'pricing',
  CONTENT = 'content',
}

export class GenerateSuggestionsDto {
  @IsEnum(SuggestionType)
  type: SuggestionType;

  @IsObject()
  context: {
    courseData: any;
    currentStep?: number;
    contentByLecture?: any;
  };
}



