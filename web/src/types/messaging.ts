export interface Conversation {
  id: string
  mentorship_id: string
  mentor_id: string
  mentee_id: string
  other_user_id: string
  other_full_name: string
  other_role: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  read_at: string | null
  hidden_at: string | null
  created_at: string
}

export interface ConversationsResponse {
  data: Conversation[]
  meta: { limit: number }
}

export interface MessagesResponse {
  data: Message[]
  meta: { limit: number }
}

export interface CreateMessageRequest {
  body: string
}

export interface CreateConversationRequest {
  mentorship_id: string
}

export interface ReportMessageRequest {
  reason: string
}
