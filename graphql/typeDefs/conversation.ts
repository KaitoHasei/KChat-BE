const conversationTypeDefs = `#graphql
    type Query {
        getConversations: [GetConversationsResponse]!
        getConversationMessages(inputs: GetConversationMessagesInput!): [Message]!
        retrieveConversation(conversationId: String!): Conversation!
    }

    type Mutation {
        createConversation(listUserId: [String]!): CreateConversationResponse!
        sendMessage(inputs: SendMessageInput!): Boolean!
        markAsRead(conversationId: String!): Boolean!
    }

    type Subscription {
        sentMessage(conversationId: String!): SentMessageResponse!
        hasUpdateConversation: HasUpdateConversationResponse!
    }

    enum ActionUpdate {
        SENT_MESSAGE
        MARK_READ
    }

    input GetConversationMessagesInput {
        conversationId: String!
        offset: Int
        limit: Int
    }

    input SendMessageInput {
        conversationId: String
        content: String
    }

    type ConversationUpdated {
        id: String!
        participants: [User]!
        latestMessage: Message
        name: String
        image: String
        userIdsHaveSeen: [String]!
        createdBy: String!
    }

    type GetConversationsResponse {
        id: String!
        participants: [User]!
        latestMessage: Message
        name: String
        image: String
        userIdsHaveSeen: [String]!
        createdBy: String!
    }

    type CreateConversationResponse {
        id: String!
        participantIds: [String]!
        participants: [User]!
        name: String
        image: String
        createdBy: String!
    }

    type SentMessageResponse {
        conversationId: String!
        message: Message!
    }

    type HasUpdateConversationResponse {
        conversation: ConversationUpdated!,
        actionUpdate: ActionUpdate!
    }
`;

export default conversationTypeDefs;
