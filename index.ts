import * as dotenv from "dotenv";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";
import { PrismaClient } from "@prisma/client";
import { createServer } from "http";
import express from "express";
import { WebSocketServer } from "ws";
import bodyParser from "body-parser";
import cors from "cors";

import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import { GraphQLContext, SubscriptionContext, formatError } from "./graphql";

import { AllowedOrigins, PORT } from "./configs/server-config";
import { getServerSession } from "./utils/getServerSession";

dotenv.config();

// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });
const prisma = new PrismaClient();
const pubSub = new PubSub();

// Create an Express app and HTTP server; we will attach both the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = createServer(app);

// Create our WebSocket server using the HTTP server we just set up.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql/subscriptions",
});
// Save the returned server's info so we can shutdown this server later
const serverCleanup = useServer(
  {
    schema,
    context: async (ctx: SubscriptionContext): Promise<GraphQLContext> => {
      const session = ctx.connectionParams.session;

      return { session, prisma, pubSub };
    },
  },
  wsServer
);

// Set up ApolloServer.
const server = new ApolloServer<GraphQLContext>({
  schema,
  formatError,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

const options: cors.CorsOptions = {
  origin: AllowedOrigins,
  credentials: true,
};

await server.start();
app.use(
  "/graphql",
  cors(options),
  bodyParser.json(),
  expressMiddleware(server, {
    context: async ({ req }): Promise<GraphQLContext> => {
      const session = await getServerSession(req);

      return { session, prisma, pubSub };
    },
  })
);

// Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is now running on http://localhost:${PORT}/graphql`);
});
