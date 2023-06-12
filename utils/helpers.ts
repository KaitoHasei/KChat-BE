import { ObjectId } from "mongodb";
import _ from "lodash";

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
