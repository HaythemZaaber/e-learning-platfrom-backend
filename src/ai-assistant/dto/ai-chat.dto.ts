import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  context?: {
    currentPage?: string;
    courseId?: string;
    sessionId?: string;
    previousMessages?: Array<{ role: string; content: string }>;
  };
}

export class ChatResponseDto {
  message: string;
  suggestions: string[];
  relatedCourses: any[];
  timestamp: Date;
}

export class CourseRecommendationDto {
  @IsArray()
  @IsString({ each: true })
  interests: string[];

  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  skillLevel: string;

  @IsNumber()
  timeCommitment: number; // hours per week

  @IsNumber()
  budget: number; // maximum price willing to pay
}

export class LearningPathDto {
  @IsString()
  goal: string; // What they want to achieve

  @IsArray()
  @IsString({ each: true })
  currentSkills: string[];

  @IsString()
  timeFrame: string; // e.g., "3 months", "6 months", "1 year"

  @IsArray()
  @IsString({ each: true })
  interests: string[];
}

export class StudyPlanDto {
  @IsString()
  courseId: string;

  @IsNumber()
  studyHours: number; // hours per week

  @IsArray()
  @IsString({ each: true })
  studyDays: string[]; // e.g., ["Monday", "Wednesday", "Friday"]

  @IsDateString()
  deadline: string; // target completion date
}

export class ChatHistoryDto {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
}

export class LearningInsightsDto {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  nextSteps: string[];
  motivation: string;
}
