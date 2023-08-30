import { ISODateString } from "next-auth";
import { Context } from "graphql-ws";
import { PubSub } from "graphql-subscriptions";
import { PrismaClient } from "@prisma/client";

export interface Session {
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires?: ISODateString;
}

export interface GraphQLContext {
  session: Session | null;
  prisma: PrismaClient;
  pubSub: PubSub;
}

export interface SubscriptionContext extends Context {
  connectionParams: {
    session?: Session;
  };
}

/*-------------------------------------------------------*/

export interface Response {
  success: boolean;
  message?: string;
}

export interface User {
  id: string;
  name?: string;
  image?: string;
}

export interface Message {
  userId: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  name?: string;
  image?: string;
  userIdsHaveSeen: string[];
  createdBy: string;
}

export interface GetConversationsResponse {
  id: string;
  participants: User[];
  latestMessage?: Message;
  name?: string;
  image?: string;
  userIdsHaveSeen: string[];
  createdBy: string;
}

export interface CreateConversationResponse {
  id: string;
  participantIds: string[];
  participants: User[];
  name?: string;
  image?: string;
  createdBy: string;
}
