import "dotenv/config";

import { IncomingMessage } from "http";
import fetch from "node-fetch";
import { Session } from "../types";

export const getServerSession = async ({
  req,
}: {
  req?: Partial<IncomingMessage> & { body?: any };
}): Promise<Session | null> => {
  try {
    const options: any = {
      headers: {
        "Content-Type": "application/json",
        ...(req?.headers?.cookie ? { cookie: req.headers.cookie } : {}),
      },
    };

    const res = await fetch(process.env.AUTH_SESSION_URL, options);
    const data = await res.json();

    if (!res.ok) throw data;

    return Object.keys(data).length > 0 ? (data as Session) : null;
  } catch (error) {
    console.error("CLIENT_FETCH_ERROR", { error: error as Error });
    return null;
  }
};
