
// analyze-course.dto.ts
import { IsObject, IsOptional } from 'class-validator';

export class AnalyzeCourseDto {
  @IsObject()
  courseData: any;

  @IsObject()
  @IsOptional()
  contentByLecture?: any;
}
