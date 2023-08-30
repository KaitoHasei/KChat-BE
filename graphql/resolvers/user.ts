import { ErrorCode, handleResolverError } from "../handle-errors";
import { GraphQLContext, Response, User } from "../../types";

const resolvers = {
  Query: {
    searchUsers: async (
      _: any,
      { searchTerms }: { searchTerms: string },
      context: GraphQLContext
    ): Promise<User[]> => {
      if (!context?.session) handleResolverError(ErrorCode.UNAUTHENTICATED);

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

      if (commonStrings.includes(searchTerms) || !searchTerms.trim())
        handleResolverError({
          message: "Invalid search terms",
          code: "BAD_REQUEST",
          status: ErrorCode.BAD_REQUEST,
        });

      const { session, prisma } = context;
      const user = session?.user;

      try {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { email: { contains: searchTerms } },
              { name: { contains: searchTerms } },
            ],
            NOT: {
              id: user.id,
            },
          },
        });

        return users;
      } catch (error) {
        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },
  },
  Mutation: {
    changeUserName: async (
      _: any,
      { userName }: { userName: string },
      context: GraphQLContext
    ): Promise<Response> => {
      if (!context?.session) handleResolverError(ErrorCode.UNAUTHENTICATED);

      if (!userName.trim())
        handleResolverError({
          message: "Invalid username",
          code: "BAD_REQUEST",
          status: ErrorCode.BAD_REQUEST,
        });

      const { session, prisma } = context;
      const user = session?.user;

      try {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            name: userName,
          },
        });

        return {
          success: true,
          message: "Update username success!",
        };
      } catch (error) {
        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },
  },
};

export default resolvers;
