import { ISODateString } from "next-auth";
import { Context } from "graphql-ws";
import { PubSub } from "graphql-subscriptions";
import { PrismaClient, User } from "@prisma/client";

export interface Session {
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: ISODateString;
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

export interface SuccessResponse {
  message: string;
}

export interface SearchUserResponse {
  users: User[] | null;
}

//-----------------------Conversation---------------------

export interface Message {
  userId: string;
  content: string;
  createdAt: ISODateString;
}

export interface Participant {
  id: string;
  name: string;
  image: string;
}

export interface ConversationCreatedResponse {
  id: string;
  participantIds: string[];
  participants: Participant[];
  name: string;
  image: string;
  createdBy: string;
}

export interface RetrieveConversationResponse {
  id: string;
  participants: Participant[];
  name: string;
  image: string;
  userHaveSeen: string[];
  createdBy: string;
}

export interface GetConversationsResponse {
  id: string;
  participants: Participant[];
  lastMessage: Message;
  name: string;
  image: string;
  userHaveSeen: string[];
  createdBy: string;
}
