import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';

/**
 * Listens for session events and creates app-level notifications
 * that are pushed via WebSocket for real-time UX
 */
@Injectable()
export class SessionNotificationListener {
  constructor(private notificationService: NotificationService) {}

  @OnEvent('session.live_started')
  async handleSessionLiveStarted(payload: {
    sessionId: string;
    sessionTitle: string;
    participantIds: string[];
    actionUrl?: string;
  }) {
    const { sessionId, sessionTitle, participantIds, actionUrl } = payload;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const joinUrl = `${baseUrl}/sessions/${sessionId}/video-call`;

    for (const userId of participantIds) {
      await this.notificationService.createNotification({
        userId,
        type: 'SESSION_LIVE',
        title: 'Session is Live!',
        message: `"${sessionTitle}" has started. Join now to participate.`,
        data: { sessionId },
        priority: 'HIGH',
        actionUrl: actionUrl || joinUrl,
      });
    }
  }

  @OnEvent('session.ended')
  async handleSessionEnded(payload: {
    sessionId: string;
    sessionTitle: string;
    participantIds: string[];
  }) {
    const { sessionTitle, participantIds } = payload;

    for (const userId of participantIds) {
      await this.notificationService.createNotification({
        userId,
        type: 'SESSION_ENDED',
        title: 'Session Completed',
        message: `"${sessionTitle}" has ended. Thank you for participating!`,
        data: { sessionId: payload.sessionId },
        priority: 'NORMAL',
      });
    }
  }

  @OnEvent('session.cancelled')
  async handleSessionCancelled(payload: {
    sessionId: string;
    sessionTitle: string;
    participantIds: string[];
    reason?: string;
  }) {
    const { sessionTitle, participantIds, reason } = payload;

    for (const userId of participantIds) {
      await this.notificationService.createNotification({
        userId,
        type: 'SESSION_CANCELLED',
        title: 'Session Cancelled',
        message: `"${sessionTitle}" has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
        data: { sessionId: payload.sessionId },
        priority: 'HIGH',
      });
    }
  }

  @OnEvent('session.rescheduled')
  async handleSessionRescheduled(payload: {
    sessionId: string;
    sessionTitle: string;
    participantIds: string[];
    newStartTime: string;
    reason?: string;
  }) {
    const { sessionTitle, participantIds, newStartTime, reason } = payload;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const sessionUrl = `${baseUrl}/student/sessions`;

    for (const userId of participantIds) {
      await this.notificationService.createNotification({
        userId,
        type: 'SESSION_RESCHEDULED',
        title: 'Session Rescheduled',
        message: `"${sessionTitle}" has been rescheduled to ${newStartTime}.${reason ? ` ${reason}` : ''}`,
        data: { sessionId: payload.sessionId },
        priority: 'HIGH',
        actionUrl: sessionUrl,
      });
    }
  }
}
