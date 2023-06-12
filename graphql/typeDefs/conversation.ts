const typeDefs = `#graphql
    type Query {
        getConversations: [GetConversationsResponse]
        getConversationMessages(inputs: GetConversationMessagesInput!): [Message]
        retrieveConversation(conversationId: String!): RetrieveConversationResponse
    }

    type Mutation {
        createConversation(listUserId: [String]!): ConversationCreatedResponse
        sendMessage(inputs: SendMessageInput!): Boolean
    }

    type Subscription {
        conversationHasMessage: HasMessageResponse
        sentMessage(conversationId: String!): SentMessageResponse
    }

    type Participant {
        id: String
        name: String
        image: String
    }

    type Message {
        userId: String
        content: String
        createdAt: String
    }

    type Conversation {
        id: String
        participantIds: [String]
        participants: [Participant]
        messages: [Message]
        image: String
        userHaveSeen: [String]
        createdBy: String
        createdAt: String
        updatedAt: String
    }

    input GetConversationMessagesInput {
        conversationId: String
        offset: Int
        limit: Int
    }

    input SendMessageInput {
        conversationId: String
        content: String
    }

    type GetConversationsResponse {
        id: String
        participants: [Participant]
        lastMessage: Message
        image: String
        userHaveSeen: [String]
        createdBy: String
    }

    type RetrieveConversationResponse {
        id: String
        participants: [Participant]
        image: String
        userHaveSeen: [String]
        createdBy: String
    }

    type ConversationCreatedResponse {
        id: String
        participantIds: [String]
        participants: [Participant]
        image: String
        createdBy: String
    }

    type HasMessageResponse {
        id: String
        participants: [Participant]
        lastMessage: Message
        image: String
        userHaveSeen: [String]
        createdBy: String
    }

    type SentMessageResponse {
        conversationId: String
        message: Message
    }
`;

export default typeDefs;
