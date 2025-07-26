import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { CourseLevel, EnrollmentType } from '../../../generated/prisma';

@InputType()
export class CreateCourseInput {
  @Field()
  @IsString()
  @MinLength(10, {
    message: 'Course title must be at least 10 characters long',
  })
  @MaxLength(100, { message: 'Course title cannot exceed 100 characters' })
  title: string;

  @Field()
  @IsString()
  @MinLength(100, {
    message: 'Course description must be at least 100 characters long',
  })
  @MaxLength(2000, {
    message: 'Course description cannot exceed 2000 characters',
  })
  description: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Short description cannot exceed 300 characters' })
  shortDescription?: string;

  @Field()
  @IsString()
  category: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @Field(() => CourseLevel, { defaultValue: CourseLevel.BEGINNER })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @Field(() => EnrollmentType, { defaultValue: EnrollmentType.FREE })
  @IsEnum(EnrollmentType)
  enrollmentType: EnrollmentType;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0, { message: 'Price cannot be negative' })
  @Max(9999.99, { message: 'Price cannot exceed $9999.99' })
  price: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Original price cannot be negative' })
  originalPrice?: number;

  @Field({ defaultValue: 'USD' })
  @IsString()
  currency: string;

  @Field(() => [String], { defaultValue: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @Field(() => [String], { defaultValue: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @Field(() => [String], { defaultValue: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatYouLearn?: string[];

  @Field(() => [String], { defaultValue: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoTags?: string[];

  @Field(() => [String], { defaultValue: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  marketingTags?: string[];

  @Field({ defaultValue: 'en' })
  @IsString()
  language: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  isPublic: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  certificate: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  hasAITutor: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  aiPersonality?: string;

  @Field(() => Int, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  estimatedHours: number;
}

@InputType()
export class UpdateCourseInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(100)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(100)
  @MaxLength(2000)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @Field(() => CourseLevel, { defaultValue: CourseLevel.BEGINNER })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @Field(() => EnrollmentType, { nullable: true })
  @IsOptional()
  @IsEnum(EnrollmentType)
  enrollmentType?: EnrollmentType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999.99)
  price?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatYouLearn?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoTags?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  marketingTags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  certificate?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasAITutor?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  aiPersonality?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;
}

@InputType()
export class CourseFiltersInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => CourseLevel, { defaultValue: CourseLevel.BEGINNER })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string; // 'title', 'createdAt', 'updatedAt', 'price'

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortOrder?: string; // 'asc', 'desc'
}
