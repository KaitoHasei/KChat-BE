import { Message } from "@prisma/client";
import { withFilter } from "graphql-subscriptions";
import lodash from "lodash";

import {
  ConversationCreatedResponse,
  GetConversationResponse,
  GraphQLContext,
  RetrieveConversationResponse,
  Participant,
} from "../types";
import { ERROR_STATUS, handleResolverError } from "../handle-errors";

import { convertRawData } from "../../utils/helpers";

import { SUB_EVENT_NAME } from "../constants";

const resolvers = {
  Query: {
    getConversations: async (
      _: any,
      __: any,
      context: GraphQLContext
    ): Promise<GetConversationResponse> => {
      if (!context.session) handleResolverError(ERROR_STATUS.UNAUTHENTICATED);

      const { session, prisma } = context;
      const { user: currentUser } = session;

      try {
        const rawConversations = await prisma.conversation.aggregateRaw({
          pipeline: [
            {
              $match: {
                messages: {
                  $ne: [],
                },
                $expr: {
                  $in: [{ $oid: currentUser.id }, "$participantIds"],
                },
              },
            },
            { $addFields: { lastMessage: { $last: "$messages" } } },
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
        handleResolverError(ERROR_STATUS.INTERNAL_SERVER);
      }
    },

    getConversationMessages: async (
      _: any,
      {
        inputs: { conversationId, offset, limit },
      }: { inputs: { conversationId: string; offset: number; limit: number } },
      context: GraphQLContext
    ): Promise<Message> => {
      if (!context.session) handleResolverError(ERROR_STATUS.UNAUTHENTICATED);

      const { session, prisma } = context;
      const { user: currentUser } = session;

      const userInConversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
          participantIds: {
            has: currentUser?.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (!userInConversation)
        handleResolverError({
          message: "You are not member of conversation!",
          code: "FORBIDDEN",
          status: 403,
        });

      try {
        const rawConversationMessage = await prisma.conversation.aggregateRaw({
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

        const conversationMessage = convertRawData(rawConversationMessage);

        return conversationMessage?.[0]?.messages;
      } catch (error) {
        handleResolverError(ERROR_STATUS.INTERNAL_SERVER);
      }
    },

    retrieveConversation: async (
      _: any,
      { conversationId }: { conversationId: string },
      context: GraphQLContext
    ): Promise<RetrieveConversationResponse> => {
      if (!context.session) handleResolverError(ERROR_STATUS.UNAUTHENTICATED);

      if (!conversationId.trim())
        handleResolverError({
          message: "Require conversationId",
          code: "BAD_REQUEST",
          status: ERROR_STATUS.BAD_REQUEST,
        });

      const { prisma } = context;

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
            image: true,
            userHaveSeen: true,
            createdBy: true,
          },
        });

        return conversation;
      } catch (error) {
        handleResolverError(ERROR_STATUS.INTERNAL_SERVER);
      }
    },
  },

  Mutation: {
    createConversation: async (
      _: any,
      { listUserId }: { listUserId: string[] },
      context: GraphQLContext
    ): Promise<ConversationCreatedResponse> => {
      if (!context?.session) handleResolverError(ERROR_STATUS.UNAUTHENTICATED);

      const { session, prisma, pubSub } = context;
      const currentUser = session.user;

      const createConversationAction: {
        [condition: string]: (listId: string[]) => any;
      } = {
        ["TRUE"]: async (listId: string[]) => {
          const _conversation = await prisma.conversation.create({
            data: {
              createdBy: currentUser.id,
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
              image: true,
              createdBy: true,
            },
          });

          return _conversation;
        },
        ["FALSE"]: async (listId: string[]) => {
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
              image: true,
              createdBy: true,
            },
          });

          if (!lodash.isEmpty(_findedConversation))
            return _findedConversation[0];

          const _conversation = await prisma.conversation.create({
            data: {
              createdBy: currentUser.id,
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
          status: ERROR_STATUS.BAD_REQUEST,
        });

      try {
        const participantIds = lodash.clone(listUserId);

        participantIds.push(currentUser.id);

        const conversationCreated = await createConversationAction[
          String(participantIds.length > 2).toUpperCase()
        ](participantIds);

        return conversationCreated;
      } catch (error) {
        handleResolverError(ERROR_STATUS.INTERNAL_SERVER);
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
    ): Promise<Boolean> => {
      if (!context?.session) handleResolverError(ERROR_STATUS.UNAUTHENTICATED);

      const { session, prisma, pubSub } = context;
      const currentUser = session?.user;

      const userInConversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
          participantIds: {
            has: currentUser?.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (!userInConversation)
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
                userId: currentUser?.id,
                content,
              },
            },
            userHaveSeen: {
              set: [currentUser.id],
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
            image: true,
            userHaveSeen: true,
            createdBy: true,
          },
        });

        const newMessage = conversationAddedMessage.messages.at(-1);

        pubSub.publish(SUB_EVENT_NAME.SENT_MESSAGE, {
          sentMessage: {
            conversationId: conversationAddedMessage.id,
            message: newMessage,
          },
        });

        pubSub.publish(SUB_EVENT_NAME.CONVERSATION_HAS_MESSAGE, {
          conversationHasMessage: {
            id: conversationAddedMessage.id,
            participants: conversationAddedMessage.participants,
            lastMessage: newMessage,
            image: conversationAddedMessage.image,
            userHaveSeen: conversationAddedMessage.userHaveSeen,
            createdBy: conversationAddedMessage.createdBy,
          },
        });

        return true;
      } catch (error) {
        handleResolverError(ERROR_STATUS.INTERNAL_SERVER);
      }

      return false;
    },
  },

  Subscription: {
    // conversationCreated: {
    //   subscribe: withFilter(
    //     (_: any, __: any, context: GraphQLContext) => {
    //       const { pubSub } = context;

    //       return pubSub.asyncIterator([SUB_EVENT_NAME.CONVERSATION_CREATED]);
    //     },
    //     (
    //       payload: { conversationCreated: any },
    //       _: any,
    //       context: GraphQLContext
    //     ) => {
    //       const { session } = context;
    //       const {
    //         conversationCreated: { participantIds },
    //       } = payload;

    //       return participantIds.includes(session.user.id);
    //     }
    //   ),
    // },
    conversationHasMessage: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubSub } = context;

          return pubSub.asyncIterator([
            SUB_EVENT_NAME.CONVERSATION_HAS_MESSAGE,
          ]);
        },
        (
          payload: {
            conversationHasMessage: {
              participants: Participant[];
            };
          },
          _: any,
          context: GraphQLContext
        ) => {
          const {
            session: { user },
          } = context;
          const {
            conversationHasMessage: { participants },
          } = payload;

          const isIncludeConversation = participants.some((element) => {
            if (element.id === user.id) return true;

            return false;
          });

          return isIncludeConversation;
        }
      ),
    },
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
          const {
            sentMessage: { conversationId: conversationSentMessageId },
          } = payload;

          return conversationSentMessageId === conversationId;
        }
      ),
    },
  },
};

export default resolvers;
