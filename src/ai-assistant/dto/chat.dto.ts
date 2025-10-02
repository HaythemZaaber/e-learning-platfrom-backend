// chat.dto.ts
import { IsString, IsObject } from 'class-validator';

export class ChatDto {
  @IsString()
  message: string;

  @IsObject()
  context: {
    courseData: any;
    currentStep?: number;
    contentByLecture?: any;
    chatHistory?: Array<{ role: string; content: string }>;
  };
}