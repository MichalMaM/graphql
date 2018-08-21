// @flow

import 'dotenv/config';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import compression from 'compression';
import cors from 'cors';

import type { $Request, $Response } from 'express';
import {
  TraceCollector,
  instrumentSchemaForTracing,
  formatTraceData,
} from 'apollo-tracing';

import Schema from './Schema';
import { createContext } from './common/services/GraphqlContext';
import Logger from './common/services/Logger';

process.on('unhandledRejection', reason => {
  Logger.error(reason);
});

const app = express();
app.use(cors({ methods: ['GET', 'POST'] }));
app.use(compression());

app.all('/', (request: $Request, response: $Response) => {
  if (process.env.NODE_ENV === 'production' && request.method === 'GET') {
    return response.status(405).json({
      message: 'Use POST for GraphQL request.',
      hint: 'Maybe you are looking for GraphiQL? https://kiwi-graphiql.now.sh/',
    });
  }

  const token = request.header('authorization') || null;
  const acceptLanguage = request.header('Accept-Language');
  const context = createContext({ token, acceptLanguage, request });
  if (process.env.NODE_ENV !== 'test' && !process.env.IS_LAMBDA) {
    const traceCollector = new TraceCollector();
    traceCollector.requestDidStart();
    context._traceCollector = traceCollector;
  }
  return createGraphqlServer(Schema, context)(request, response);
});

export default app;

function createGraphqlServer(schema, context) {
  return graphqlHTTP({
    schema: instrumentSchemaForTracing(schema),
    pretty: false,
    graphiql: true,
    context: context,
    extensions: () => {
      const traceCollector = context._traceCollector;
      if (!traceCollector) {
        return {};
      }
      traceCollector.requestDidEnd();
      return {
        tracing: formatTraceData(traceCollector),
      };
    },
  });
}
