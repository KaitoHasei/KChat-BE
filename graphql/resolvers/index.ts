import lodash from "lodash";

import userResolvers from "./user";
import conversationResolvers from "./conversation";

export default lodash.merge({}, userResolvers, conversationResolvers);
