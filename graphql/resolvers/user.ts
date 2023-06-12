import { GraphQLContext, SearchUserResponse, SuccessResponse } from "../types";
import { ERROR_STATUS, handleResolverError } from "../handle-errors";

const resolvers = {
  Query: {
    searchUsers: async (
      _: any,
      args: { searchTerms: string },
      context: GraphQLContext
    ): Promise<SearchUserResponse> => {
      if (!context?.session) handleResolverError(ERROR_STATUS.UNAUTHENTICATED);

      const commonStrings = [
        ".com",
        ".org",
        ".net",
        "com",
        "org",
        "net",
        "@",
        "@gmail",
        "gmail",
      ];

      const { searchTerms } = args;

      if (commonStrings.includes(searchTerms) || !searchTerms.trim())
        handleResolverError({
          message: "Invalid search terms",
          code: "BAD_REQUEST",
          status: ERROR_STATUS.BAD_REQUEST,
        });

      const { session, prisma } = context;
      const currentUser = session?.user;

      try {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { email: { contains: searchTerms } },
              { name: { contains: searchTerms } },
            ],
            NOT: {
              id: currentUser.id,
            },
          },
        });

        return {
          users,
        };
      } catch (error) {
        handleResolverError(ERROR_STATUS.INTERNAL_SERVER);
      }
    },
  },
  Mutation: {
    changeUserName: async (
      _: any,
      args: { userName: string },
      context: GraphQLContext
    ): Promise<SuccessResponse> => {
      if (!context?.session) handleResolverError(ERROR_STATUS.UNAUTHENTICATED);

      const { userName } = args;

      if (!userName.trim())
        handleResolverError({
          message: "Invalid username",
          code: "BAD_REQUEST",
          status: ERROR_STATUS.BAD_REQUEST,
        });

      const { session, prisma } = context;
      const currentUser = session?.user;

      try {
        await prisma.user.update({
          where: {
            id: currentUser?.id,
          },
          data: {
            name: userName,
          },
        });

        return {
          message: "Update username success!",
        };
      } catch (error) {
        handleResolverError(ERROR_STATUS.INTERNAL_SERVER);
      }
    },
  },
};

export default resolvers;
