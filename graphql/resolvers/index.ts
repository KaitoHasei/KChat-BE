import lodash from "lodash";

import userResolvers from "./user";
import accountResolvers from "./account";
import conversationResolvers from "./conversation";

export default lodash.merge(
  {},
  userResolvers,
  accountResolvers,
  conversationResolvers
);
