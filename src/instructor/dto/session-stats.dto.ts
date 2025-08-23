import { ApiProperty } from '@nestjs/swagger';

export class SessionStatsDto {
  @ApiProperty({ description: 'Number of pending booking requests' })
  pendingRequests: number;

  @ApiProperty({ description: 'Total earnings from completed sessions' })
  totalEarnings: number;

  @ApiProperty({ description: 'Number of upcoming scheduled sessions' })
  upcomingSessions: number;

  @ApiProperty({ description: 'Session completion rate as percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Average bid amount from booking requests' })
  averageBid: number;

  @ApiProperty({ description: 'Most popular time slots for sessions', type: [String] })
  popularTimeSlots: string[];

  @ApiProperty({ description: 'Total number of sessions' })
  totalSessions: number;

  @ApiProperty({ description: 'Number of completed sessions' })
  completedSessions: number;

  @ApiProperty({ description: 'Number of cancelled sessions' })
  cancelledSessions: number;

  @ApiProperty({ description: 'Average rating from session reviews' })
  averageRating: number;

  @ApiProperty({ description: 'Total number of unique learners' })
  totalLearners: number;

  @ApiProperty({ description: 'Total number of students (reservations)' })
  totalStudents: number;

  @ApiProperty({ description: 'Total number of paid payouts' })
  totalPayouts: number;

  @ApiProperty({ description: 'Number of pending payouts' })
  pendingPayouts: number;
}
