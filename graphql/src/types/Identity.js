// @flow

import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql';
import { toGlobalId } from '../services/OpaqueIdentifier';
import type { IdentityType } from '../Entities';

export default new GraphQLObjectType({
  name: 'Identity',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: ({ userId }: IdentityType): string =>
        toGlobalId('identity', userId),
    },

    databaseId: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ userId }: IdentityType): string => userId,
    },

    email: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Raw input by user, use "login" if you want normalized email.',
      resolve: ({ email }: IdentityType): string => email,
    },

    emailVerified: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ emailVerified }: IdentityType): boolean => emailVerified,
    },

    firstName: {
      type: GraphQLString,
      resolve: ({ firstName }: IdentityType) => firstName,
    },

    lastName: {
      type: GraphQLString,
      resolve: ({ lastName }: IdentityType) => lastName,
    },

    fullName: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Concatenation of first and last name with fallback to the login field.',
      resolve: ({ firstName, lastName, login }: IdentityType): string => {
        if (firstName === null && lastName === null) {
          return login;
        }
        return [firstName, lastName].filter(word => word !== null).join(' ');
      },
    },

    login: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Use this in API calls. It is email but normalized.',
      resolve: ({ login }: IdentityType): string => login,
    },
  },
});