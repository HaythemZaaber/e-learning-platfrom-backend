import { IsString, IsNotEmpty } from 'class-validator';

export class MarkMessagesReadDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
