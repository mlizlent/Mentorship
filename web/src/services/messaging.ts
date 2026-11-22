import { apiClient } from './api'
import type {
  Conversation,
  ConversationsResponse,
  CreateConversationRequest,
  CreateMessageRequest,
  Message,
  MessagesResponse,
  ReportMessageRequest,
} from '@/types/messaging'

export function listConversations(cursor?: string) {
  const params: Record<string, string> = {}
  if (cursor) params.cursor = cursor
  return apiClient.get<ConversationsResponse>('/messages', { params })
}

export function createConversation(body: CreateConversationRequest) {
  return apiClient.post<{ data: Conversation }>('/messages', body)
}

export function listMessages(
  conversationId: string,
  { cursor }: { cursor?: string } = {}
) {
  const params: Record<string, string> = {}
  if (cursor) params.cursor = cursor
  return apiClient.get<MessagesResponse>(
    `/messages/${conversationId}/messages`,
    { params }
  )
}

export function createMessage(
  conversationId: string,
  body: CreateMessageRequest
) {
  return apiClient.post<{ data: Message }>(
    `/messages/${conversationId}/messages`,
    body
  )
}

export function reportMessage(
  conversationId: string,
  messageId: string,
  body: ReportMessageRequest
) {
  return apiClient.post<{ status: string }>(
    `/messages/${conversationId}/messages/${messageId}/report`,
    body
  )
}
