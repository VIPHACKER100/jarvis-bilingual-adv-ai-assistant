// ==========================================================================
// JARVIS v4.0 — Commands API service
// ==========================================================================

import apiClient from './client';
import type {
  CommandRequest,
  CommandResult,
  ConfirmationRequest,
  BaseResponse,
} from '../types';

export const commandsApi = {
  /** Execute a voice/text command */
  async execute(data: CommandRequest): Promise<CommandResult> {
    const { data: res } = await apiClient.post<CommandResult>('/command', data);
    return res;
  },

  /** Confirm/deny a dangerous action */
  async confirm(
    confirmationId: string,
    data: ConfirmationRequest,
  ): Promise<BaseResponse> {
    const { data: res } = await apiClient.post<BaseResponse>(
      `/confirm/${confirmationId}`,
      data,
    );
    return res;
  },

  /** List pending confirmations */
  async getPending(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get<Record<string, unknown>>('/pending');
    return data;
  },
};
