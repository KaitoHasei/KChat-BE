const accountTypeDefs = `#graphql
    type Mutation {
        signUp(inputs: SignUpInput!): Boolean!
        signIn(inputs: SignInInput!): SignInResponse!
        verifyEmail(inputs: VerifyEmailInput!): Boolean!
    }

    input SignUpInput {
        username: String!
        email: String!
        password: String!
    }

    input SignInInput {
        email: String!
        password: String!
    }

    input VerifyEmailInput {
        email: String!
        verifyCode: String!
    }

    type SignInResponse {
        id: String!
        name: String
        email: String!
        image: String
        accessToken: String!
    }
`;

export default accountTypeDefs;
