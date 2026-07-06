import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { buildContext } from './context.js';
import { config } from './config.js';
import { logger } from './logger.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Surface a stable error code; hide internal stack traces in production.
  formatError: (formattedError, error) => {
    logger.error('graphql.error', {
      message: formattedError.message,
      code: formattedError.extensions?.code,
    });
    if (
      config.nodeEnv === 'production' &&
      formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR'
    ) {
      return { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } };
    }
    return formattedError;
  },
});

const { url } = await startStandaloneServer(server, {
  listen: { port: config.port },
  context: buildContext,
});

logger.info('server.started', { url });
