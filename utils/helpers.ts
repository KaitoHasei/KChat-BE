import { ObjectId } from "mongodb";
import _ from "lodash";
import { GraphQLContext } from "../graphql";

export const checkUserInConversation = async (
  conversationId: string,
  context: GraphQLContext
): Promise<boolean> => {
  const { session, prisma } = context;
  const currentUser = session.user;
  const findUserInConversation = await prisma.conversation.findUnique({
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

  return findUserInConversation ? true : false;
};

export const convertRawData = (data: any): any => {
  if (_.isArray(data)) {
    return data.map((item) => convertRawData(item));
  } else if (_.isObject(data) && data !== null) {
    const newObj: any = {};

    for (const key in data) {
      if (key === "$oid") {
        return new ObjectId(data[key]).toHexString();
      } else if (key === "$date") {
        return data[key];
      } else {
        newObj[key] = convertRawData(data[key]);
      }

      if (key === "_id") {
        newObj["id"] = newObj["_id"];
        delete newObj["_id"];
      }
    }
    return newObj;
  }
  return data;
};
