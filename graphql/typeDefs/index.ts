import userType from "./user";
import conversationType from "./conversation";

const generalType = `#graphql
   type SuccessResponse {
        message: String!
    }
`;

const typeDefs = [generalType, userType, conversationType];

export default typeDefs;
