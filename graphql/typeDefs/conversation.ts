const conversationTypeDefs = `#graphql
    type Query {
        getConversations: [GetConversationsResponse]!
        getConversationMessages(inputs: GetConversationMessagesInput!): [Message]!
        retrieveConversation(conversationId: String!): Conversation!
    }

    type Mutation {
        createConversation(listUserId: [String]!): CreateConversationResponse!
        sendMessage(inputs: SendMessageInput!): Response!
    }

    type Subscription {
        sentMessage(conversationId: String!): SentMessageResponse!
        hasUpdateConversation: GetConversationsResponse!
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
`;

export default conversationTypeDefs;
