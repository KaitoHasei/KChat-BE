import userTypeDefs from "./user";
import conversationTypeDefs from "./conversation";

const generalTypeDefs = `#graphql
    type Response {
        success: Boolean!
        message: String
    }

    type User {
        id: String!
        name: String
        image: String
    }

    type Message {
        userId: String!
        content: String
        createdAt: String
    }

    type Conversation {
        id: String!
        participants: [User]!
        name: String
        image: String
        userIdsHaveSeen: [String]!
        createdBy: String!
    }
`;

const typeDefs = [generalTypeDefs, userTypeDefs, conversationTypeDefs];

export default typeDefs;
