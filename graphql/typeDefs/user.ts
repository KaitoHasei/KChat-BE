const typeDefs = `#graphql
    type Query {
        searchUsers(searchTerms: String!): SearchUserResponse
    }

    type Mutation {
        changeUserName(userName: String!): SuccessResponse
    }

    type User {
        id: String
        name: String
        email: String
        image: String
    }

    type SearchUserResponse {
        users: [User]
    }
`;

export default typeDefs;
