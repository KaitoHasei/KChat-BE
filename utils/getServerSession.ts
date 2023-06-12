import * as dotenv from "dotenv";

import { IncomingMessage } from "http";
import fetch from "node-fetch";

import { Session } from "../graphql";

dotenv.config();

export const getServerSession = async (
  req: IncomingMessage
): Promise<Session | null> => {
  const url = process.env.NEXTAUTH_SESSION_URL;

  try {
    const options = {
      headers: {
        "Content-Type": "application/json",
        ...(req?.headers?.cookie ? { cookie: req.headers.cookie } : {}),
      },
    };

    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) throw data;

    return Object.keys(data).length > 0 ? (data as Session) : null;
  } catch (error) {
    return null;
  }
};
