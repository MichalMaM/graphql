// @flow

import { GraphQLObjectType } from 'graphql';

import Login from './identity/mutations/Login';
import ResetPassword from './identity/mutations/ResetPassword';
import addFAQArticleComment from './FAQ/mutations/addFAQArticleComment';
import UpdatePassenger from './booking/mutations/UpdatePassenger';
import RefundInsurance from './booking/mutations/RefundInsurance';

export default new GraphQLObjectType({
  name: 'RootMutation',
  description: 'Root Mutation.',
  fields: {
    addFAQArticleComment,
    login: Login,
    resetPassword: ResetPassword,
    updatePassenger: UpdatePassenger,
    refundInsurance: RefundInsurance,
  },
});
