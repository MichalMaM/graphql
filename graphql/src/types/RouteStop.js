// @flow

import { GraphQLObjectType, GraphQLNonNull } from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import Airport from './Airport';

import type { AirportType, ArrivalType } from '../Entities';

export default new GraphQLObjectType({
  name: 'RouteStop',
  fields: {
    airport: {
      type: new GraphQLNonNull(Airport),
      resolve: ({ where }: ArrivalType): AirportType => where,
    },

    time: {
      type: GraphQLDateTime,
      resolve: ({ when }: ArrivalType): ?Date =>
        when == null ? null : when.utc, // intentional ==, can be null or undefined
    },

    localTime: {
      type: GraphQLDateTime,
      resolve: ({ when }: ArrivalType): ?Date =>
        when == null ? null : when.local, // intentional ==, can be null or undefined
    },
  },
});
