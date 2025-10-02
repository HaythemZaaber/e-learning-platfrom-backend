// generate-content.dto.ts
import { IsEnum, IsObject } from 'class-validator';

export enum ContentType {
  LECTURE_OUTLINE = 'lecture_outline',
  ASSESSMENT_QUESTIONS = 'assessment_questions',
  SEO_CONTENT = 'seo_content',
  MARKETING_COPY = 'marketing_copy',
  TITLE_SUGGESTIONS = 'title_suggestions',
  DESCRIPTION_IMPROVEMENT = 'description_improvement',
  LEARNING_OBJECTIVES = 'learning_objectives',
  TARGET_AUDIENCE = 'target_audience',
}

export class GenerateContentDto {
  @IsEnum(ContentType)
  type: ContentType;

  @IsObject()
  context: {
    courseData: any;
    currentStep?: number;
    contentByLecture?: any;
  };
}