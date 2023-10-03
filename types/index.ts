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
  expires?: string;
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

export interface SignUpInput {
  username: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  email: string;
  verifyCode: string;
}

export interface SignInResponse {
  id: string;
  name?: string;
  email: string;
  image?: string;
  accessToken: string;
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

export interface ConversationUpdated {
  id: string;
  participants: User[];
  latestMessage?: Message;
  name?: string;
  image?: string;
  userIdsHaveSeen: string[];
  createdBy: string;
}

export interface HasUpdateConversationResponse {
  conversation: ConversationUpdated;
  actionUpdate: string;
}
