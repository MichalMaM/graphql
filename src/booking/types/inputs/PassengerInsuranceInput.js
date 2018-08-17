// @flow

import { GraphQLInputObjectType, GraphQLInt, GraphQLNonNull } from 'graphql';

import GraphQLInsuranceTypeEnum from '../outputs/InsuranceTypeEnum';

export default new GraphQLInputObjectType({
  name: 'PassengerInsuranceInput',
  fields: {
    passengerId: {
      type: GraphQLNonNull(GraphQLInt),
    },
    insuranceType: {
      type: GraphQLInsuranceTypeEnum,
      description: 'New insurance type for passenger',
    },
  },
});
