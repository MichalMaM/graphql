// @flow

import { graphql, RestApiMock } from '../../../common/services/TestingTools';
import * as Http from '../../../common/services/HttpRequest';

import Booking2707251 from '../../datasets/booking-2707251.json';

beforeEach(() => {
  RestApiMock.onGet(
    'https://booking-api.skypicker.com/api/v0.1/users/self/bookings/123456?simple_token=lol-token',
  ).replyWithData({
    ...Booking2707251,
    passengers: [
      ...Booking2707251.passengers,
      {
        category: 'adults',
        bags: 0,
        insurance_price: null,
        firstname: 'chatbot',
        travel_document: {
          cardno: null,
          expiration: null,
        },
        lastname: 'test',
        pkpass: null,
        title: 'mr',
        hand_bags: {},
        birthday: '1985-01-01',
        contact_passenger: false,
        nationality: 'us',
        id: 123,
        insurance_type: 'travel_basic',
      },
      {
        category: 'adults',
        bags: 0,
        insurance_price: null,
        firstname: 'chatbot',
        travel_document: {
          cardno: null,
          expiration: null,
        },
        lastname: 'test',
        pkpass: null,
        title: 'mr',
        hand_bags: {},
        birthday: '1985-01-01',
        contact_passenger: false,
        nationality: 'us',
        id: 1234,
        insurance_type: 'travel_plus',
      },
    ],
    passenger_ids: [...Booking2707251.passenger_ids, 123, 1234],
  });
  RestApiMock.onPost(
    'https://booking-api.skypicker.com/mmb/v1/bookings/123456/insurances',
  ).replyWithData({});
});

const queryParams = {
  id: 'Qm9va2luZ1JldHVybjoxMjM0NTY=',
  passengers: [
    {
      passengerId: 123,
      insuranceType: 'NONE',
    },
    {
      passengerId: 1234,
      insuranceType: 'TRAVEL_BASIC',
    },
  ],
  simpleToken: 'lol-token',
};

describe('RefundInsurance', () => {
  it('should work', async () => {
    expect(
      await graphql(
        `
          mutation(
            $id: ID!
            $passengers: [PassengerInsuranceInput!]!
            $simpleToken: String!
          ) {
            refundInsurance(
              id: $id
              passengers: $passengers
              simpleToken: $simpleToken
            ) {
              success
            }
          }
        `,
        queryParams,
      ),
    ).toEqual({ data: { refundInsurance: { success: true } } });
  });

  it('should send the right payload when passenger insurances are not changed', async () => {
    const spy = jest.spyOn(Http, 'post');
    await graphql(
      `
        mutation(
          $id: ID!
          $passengers: [PassengerInsuranceInput!]!
          $simpleToken: String!
        ) {
          refundInsurance(
            id: $id
            passengers: $passengers
            simpleToken: $simpleToken
          ) {
            success
          }
        }
      `,
      queryParams,
    );
    expect(spy).toHaveBeenCalledWith(
      'https://booking-api.skypicker.com/mmb/v1/bookings/123456/insurances',
      {
        insurances: [
          { passenger_id: 123, insurance_type: 'none' },
          { passenger_id: 1234, insurance_type: 'travel_basic' },
        ],
        price: {
          amount: -29.14,
          base: -29.14,
          currency: 'EUR',
        },
        use_credits: false,
      },
      { 'kw-user-token': 'test_token', 'kw-simple-token': 'lol-token' },
    );
    spy.mockClear();
  });

  it('should have the right payload when called with no changes to original situation', async () => {
    const spy = jest.spyOn(Http, 'post');
    await graphql(
      `
        mutation(
          $id: ID!
          $passengers: [PassengerInsuranceInput!]!
          $simpleToken: String!
        ) {
          refundInsurance(
            id: $id
            passengers: $passengers
            simpleToken: $simpleToken
          ) {
            success
          }
        }
      `,
      {
        id: 'Qm9va2luZ1JldHVybjoxMjM0NTY=',
        passengers: [
          {
            passengerId: 123,
            insuranceType: 'TRAVEL_BASIC',
          },
          {
            passengerId: 1234,
            insuranceType: 'TRAVEL_PLUS',
          },
        ],
        simpleToken: 'lol-token',
      },
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockClear();
  });
});
