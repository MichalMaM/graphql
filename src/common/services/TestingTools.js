// @flow

import {
  graphql as originalGraphQL,
  validate as originalValidate,
  parse,
} from 'graphql';
import schema from '../../Schema';
import { createContext } from './GraphqlContext';

/**
 * TestingTools must be imported FIRST otherwise mock of HttpRequest won't work.
 */
jest.mock('./HttpRequest');
jest.mock('../../hotel/services/BookingComRequest');
const mockedHttpRequest = require('./HttpRequest');
const mockedBookingComRequest = require('../../hotel/services/BookingComRequest');

class MockResponse {
  absoluteUrl: string;
  httpMethod: string;

  constructor(httpMethod: 'GET' | 'POST' | 'PATCH', absoluteUrl: string) {
    this.httpMethod = httpMethod;
    this.absoluteUrl = absoluteUrl;
  }

  replyWithData(response: Array<Object> | Object) {
    // $FlowAllowMockMagic
    mockedHttpRequest.__setMockData(
      this.httpMethod,
      this.absoluteUrl,
      response,
    );
  }
}

class MockBookingComResponse extends MockResponse {
  replyWithData(response: Array<Object> | Object) {
    // $FlowAllowMockMagic
    mockedBookingComRequest.__setMockData(
      this.httpMethod,
      this.absoluteUrl,
      response,
    );
  }
}

export class RestApiMock {
  static onGet(absoluteUrl: string) {
    return new MockResponse('GET', absoluteUrl);
  }

  static onPost(absoluteUrl: string) {
    return new MockResponse('POST', absoluteUrl);
  }
  static onPatch(absoluteUrl: string) {
    return new MockResponse('PATCH', absoluteUrl);
  }
}

export class BookingComApiMock {
  static onGet(absoluteUrl: string) {
    return new MockBookingComResponse('GET', absoluteUrl);
  }
}

export const graphql = async (
  query: string,
  variables: ?Object,
  acceptLanguage: ?string,
): Promise<Object> =>
  originalGraphQL(
    schema,
    query,
    null,
    createContext({
      token: 'test_token',
      acceptLanguage,
      request: {
        ip: '',
        headers: {},
      },
    }),
    variables,
  );

export const validate = (query: string) => {
  return originalValidate(
    schema,
    parse(query, {
      noLocation: true,
    }),
  );
};

export const evaluateResolver = (
  field: mixed,
  testValue: mixed,
  argsValue?: Object,
  contextValue?: Object,
) => {
  // $FlowAllowNextLineInThisTest (fields are possibly undefined but we assume it's fine)
  return field.resolve(testValue, argsValue, contextValue);
};
