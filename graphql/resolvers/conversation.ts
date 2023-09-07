import { withFilter } from "graphql-subscriptions";
import lodash from "lodash";

import { ErrorCode, handleResolverError } from "../handle-errors";

import {
  Response,
  Message,
  Conversation,
  GetConversationsResponse,
  CreateConversationResponse,
  GraphQLContext,
  HasUpdateConversationResponse,
} from "../../types";

import { checkUserInConversation, convertRawData } from "../../utils/helpers";

import { ACTION_UPDATE_CONVERSATION, SUB_EVENT_NAME } from "../constants";

const resolvers = {
  Query: {
    getConversations: async (
      _: any,
      __: any,
      context: GraphQLContext
    ): Promise<GetConversationsResponse[]> => {
      if (!context.session) handleResolverError(ErrorCode.UNAUTHENTICATED);

      const { session, prisma } = context;
      const user = session.user;

      try {
        const rawConversations = await prisma.conversation.aggregateRaw({
          pipeline: [
            {
              $match: {
                messages: {
                  $exists: true,
                },
                $expr: {
                  $in: [{ $oid: user.id }, "$participantIds"],
                },
              },
            },
            { $addFields: { latestMessage: { $last: "$messages" } } },
            {
              $lookup: {
                from: "User",
                localField: "participantIds",
                foreignField: "_id",
                as: "participants",
                pipeline: [
                  {
                    $project: {
                      email: 0,
                      emailVerified: 0,
                      conversationIds: 0,
                    },
                  },
                ],
              },
            },
            { $sort: { updatedAt: -1 } },
            {
              $project: {
                createdAt: 0,
                updatedAt: 0,
                participantIds: 0,
                messages: 0,
              },
            },
          ],
        });

        const conversations = convertRawData(rawConversations);

        return conversations;
      } catch (error) {
        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },

    getConversationMessages: async (
      _: any,
      {
        inputs: { conversationId, offset = 0, limit = 10 },
      }: { inputs: { conversationId: string; offset: number; limit: number } },
      context: GraphQLContext
    ): Promise<Message[]> => {
      if (!context.session) handleResolverError(ErrorCode.UNAUTHENTICATED);

      const { prisma } = context;

      const isUserInConversation = await checkUserInConversation(
        conversationId,
        context
      );

      if (!isUserInConversation)
        handleResolverError({
          message: "You are not member of conversation!",
          code: "FORBIDDEN",
          status: 403,
        });

      try {
        const rawConversationMessages = await prisma.conversation.aggregateRaw({
          pipeline: [
            { $match: { _id: { $oid: conversationId } } },
            { $unwind: "$messages" },
            { $sort: { "messages.createdAt": -1 } },
            { $skip: offset },
            { $limit: limit },
            { $group: { _id: "$_id", messages: { $push: "$messages" } } },
            { $project: { messages: { $reverseArray: "$messages" } } },
          ],
        });

        const conversationMessage = convertRawData(rawConversationMessages);
        const messages = conversationMessage?.[0]?.messages;

        return messages ? messages : [];
      } catch (error) {
        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },

    retrieveConversation: async (
      _: any,
      { conversationId }: { conversationId: string },
      context: GraphQLContext
    ): Promise<Conversation> => {
      if (!context.session) handleResolverError(ErrorCode.UNAUTHENTICATED);

      if (!conversationId.trim())
        handleResolverError({
          message: "Require conversationId",
          code: "BAD_REQUEST",
          status: ErrorCode.BAD_REQUEST,
        });

      const { prisma } = context;

      const isUserInConversation = await checkUserInConversation(
        conversationId,
        context
      );

      if (!isUserInConversation)
        handleResolverError({
          message: "You are not member of conversation!",
          code: "FORBIDDEN",
          status: 403,
        });

      try {
        const conversation = prisma.conversation.findUnique({
          where: {
            id: conversationId,
          },
          select: {
            id: true,
            participants: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            name: true,
            image: true,
            userIdsHaveSeen: true,
            createdBy: true,
          },
        });

        return conversation;
      } catch (error) {
        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },
  },

  Mutation: {
    createConversation: async (
      _: any,
      { listUserId }: { listUserId: string[] },
      context: GraphQLContext
    ): Promise<CreateConversationResponse> => {
      if (!context?.session) handleResolverError(ErrorCode.UNAUTHENTICATED);

      const { session, prisma } = context;
      const user = session.user;

      const createConversationAction: {
        [condition: string]: (
          listId: string[],
          userId: string
        ) => Promise<CreateConversationResponse>;
      } = {
        ["TRUE"]: async (listId: string[], userId: string) => {
          const _conversation = await prisma.conversation.create({
            data: {
              createdBy: userId,
              participants: {
                connect: listId.map((userId) => ({ id: userId })),
              },
            },
            select: {
              id: true,
              participantIds: true,
              participants: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              name: true,
              image: true,
              createdBy: true,
            },
          });

          return _conversation;
        },
        ["FALSE"]: async (listId: string[], userId: string) => {
          const _findedConversation = await prisma.conversation.findMany({
            where: {
              participantIds: {
                hasEvery: listId,
              },
            },
            select: {
              id: true,
              participantIds: true,
              participants: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              name: true,
              image: true,
              createdBy: true,
            },
          });

          if (!lodash.isEmpty(_findedConversation))
            return _findedConversation[0];

          const _conversation = await prisma.conversation.create({
            data: {
              createdBy: userId,
              participants: {
                connect: listId.map((userId) => ({ id: userId })),
              },
            },
            select: {
              id: true,
              participantIds: true,
              participants: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              name: true,
              image: true,
              createdBy: true,
            },
          });

          return _conversation;
        },
      };

      if (listUserId.length === 0 || listUserId.includes(session.user.id))
        handleResolverError({
          message: "There must be at least one person",
          code: "BAD_REQUEST",
          status: ErrorCode.BAD_REQUEST,
        });

      try {
        const participantIds = lodash.cloneDeep(listUserId);

        participantIds.push(user.id);

        const conversationCreated = await createConversationAction[
          String(participantIds.length > 2).toUpperCase()
        ](participantIds, user.id);

        return conversationCreated;
      } catch (error) {
        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },

    sendMessage: async (
      _: any,
      {
        inputs: { conversationId, content },
      }: {
        inputs: {
          conversationId: string;
          content: string;
        };
      },
      context: GraphQLContext
    ): Promise<boolean> => {
      if (!context?.session) handleResolverError(ErrorCode.UNAUTHENTICATED);

      const { session, prisma, pubSub } = context;
      const user = session?.user;

      const isUserInConversation = await checkUserInConversation(
        conversationId,
        context
      );

      if (!isUserInConversation)
        handleResolverError({
          message: "You are not member of conversation!",
          code: "FORBIDDEN",
          status: 403,
        });

      try {
        const conversationAddedMessage = await prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            messages: {
              push: {
                userId: user.id,
                content,
              },
            },
            userIdsHaveSeen: {
              set: [user.id],
            },
          },
          select: {
            id: true,
            participants: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            messages: true,
            name: true,
            image: true,
            userIdsHaveSeen: true,
            createdBy: true,
          },
        });

        const newMessage = conversationAddedMessage.messages.at(-1);

        lodash.set(newMessage, "createdAt", newMessage.createdAt.toUTCString());

        pubSub.publish(SUB_EVENT_NAME.SENT_MESSAGE, {
          sentMessage: {
            conversationId: conversationAddedMessage.id,
            message: newMessage,
          },
        });

        const conversationHasUpdate = {
          ...conversationAddedMessage,
          latestMessage: newMessage,
        };

        delete conversationHasUpdate["messages"];

        pubSub.publish(SUB_EVENT_NAME.UPDATE_CONVERSATION, {
          hasUpdateConversation: {
            conversation: conversationHasUpdate,
            actionUpdate: ACTION_UPDATE_CONVERSATION.SENT_MESSAGE,
          },
        });

        return true;
      } catch (error) {
        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },
    markAsRead: async (
      _: any,
      { conversationId }: { conversationId: string },
      context: GraphQLContext
    ): Promise<boolean> => {
      if (!context.session) handleResolverError(ErrorCode.UNAUTHENTICATED);

      const { session, prisma, pubSub } = context;
      const user = session?.user;

      const isUserInConversation = await checkUserInConversation(
        conversationId,
        context
      );

      if (!isUserInConversation)
        handleResolverError({
          message: "You are not member of conversation!",
          code: "FORBIDDEN",
          status: 403,
        });

      try {
        const conversationHasUpdate = await prisma.conversation.update({
          select: {
            id: true,
            participants: true,
            userIdsHaveSeen: true,
            createdBy: true,
          },
          where: {
            id: conversationId,
          },
          data: {
            userIdsHaveSeen: {
              push: user.id,
            },
          },
        });

        pubSub.publish(SUB_EVENT_NAME.UPDATE_CONVERSATION, {
          hasUpdateConversation: {
            conversation: conversationHasUpdate,
            actionUpdate: ACTION_UPDATE_CONVERSATION.MARK_READ,
          },
        });

        return true;
      } catch (error) {
        handleResolverError(ErrorCode.INTERNAL_SERVER);
      }
    },
  },

  Subscription: {
    sentMessage: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubSub } = context;

          return pubSub.asyncIterator([SUB_EVENT_NAME.SENT_MESSAGE]);
        },
        (
          payload: {
            sentMessage: { conversationId: string; message: Message };
          },
          {
            conversationId,
          }: {
            conversationId: string;
          },
          _: GraphQLContext
        ) => {
          const { conversationId: conversationSentMessageId } =
            payload.sentMessage;

          return conversationSentMessageId === conversationId;
        }
      ),
    },
    hasUpdateConversation: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubSub } = context;

          return pubSub.asyncIterator([SUB_EVENT_NAME.UPDATE_CONVERSATION]);
        },
        (
          payload: { hasUpdateConversation: HasUpdateConversationResponse },
          __: any,
          context: GraphQLContext
        ) => {
          const { participants } = payload.hasUpdateConversation.conversation;
          const {
            session: { user },
          } = context;

          return participants.some((participant) =>
            participant.id === user.id ? true : false
          );
        }
      ),
    },
  },
};

export default resolvers;
