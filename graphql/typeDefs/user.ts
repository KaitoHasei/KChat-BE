const userTypeDefs = `#graphql
    type Query {
        searchUsers(searchTerms: String!): [User]!
    }

    type Mutation {
        changeUserName(userName: String!): Response!
    }
`;

export default userTypeDefs;
