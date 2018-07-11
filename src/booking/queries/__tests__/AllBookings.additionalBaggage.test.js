// @flow

import { graphql, RestApiMock } from '../../../common/services/TestingTools';
import config from '../../../../config/application';
import AllBookingsDataset from '../../datasets/AllBookings.json';
import Booking2707224Dataset from '../../datasets/booking-2707224.json';
import Booking2707229Dataset from '../../datasets/booking-2707229.json';
import Booking2707251Dataset from '../../datasets/booking-2707251.json';
import Booking7474870Dataset from '../../datasets/booking-7474870.json';

const { allBookings } = config.restApiEndpoint;

beforeEach(() => {
  RestApiMock.onGet(allBookings).replyWithData(AllBookingsDataset);
  RestApiMock.onGet(
    `${allBookings}/2707251\\?simple_token=[0-9a-f-]{36}`,
  ).replyWithData(Booking2707251Dataset);
  RestApiMock.onGet(
    `${allBookings}/2707229\\?simple_token=[0-9a-f-]{36}`,
  ).replyWithData(Booking2707229Dataset);
  RestApiMock.onGet(
    `${allBookings}/2707224\\?simple_token=[0-9a-f-]{36}`,
  ).replyWithData(Booking2707224Dataset);
  RestApiMock.onGet(
    `${allBookings}/7474870\\?simple_token=[0-9a-f-]{36}`,
  ).replyWithData(Booking7474870Dataset);
});

describe('flights query with legs', () => {
  it('should return valid array of flight legs', async () => {
    const additionalBaggageQuery = `{
      allBookings {
        edges {
          node {
            databaseId 
            allowedBaggage {
              additionalBaggage {
                price {
                  amount
                  currency
                }
                quantity
              }
            }
          }
        }
      }
    }`;
    expect(await graphql(additionalBaggageQuery)).toMatchSnapshot();
  });
});
