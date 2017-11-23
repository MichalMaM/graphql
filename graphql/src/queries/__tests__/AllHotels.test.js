// @flow

import { graphql, RestApiMock } from '../../services/TestingTools';
import { Hotels } from '../../datasets';

beforeEach(() => {
  // minimal query
  RestApiMock.onGet(
    'https://hotels-api.skypicker.com/api/hotels?latitude=45.4654&longitude=9.1859&radius=50&checkin=2017-11-16&checkout=2017-11-23&room1=A',
  ).replyWithData(Hotels.all);

  // full query
  RestApiMock.onGet(
    'https://hotels-api.skypicker.com/api/hotels?latitude=45.4654&longitude=9.1859&radius=50&checkin=2017-11-16&checkout=2017-11-23&room1=A%2CA%2C4%2C6&room2=A%2C2',
  ).replyWithData(Hotels.all);
});

describe('all hotels query', () => {
  it('should work for minimal example', async () => {
    expect(
      await graphql(`
        {
          allHotels(
            search: {
              latitude: 45.4654
              longitude: 9.1859
              checkin: "2017-11-16"
              checkout: "2017-11-23"
              roomsConfiguration: { adultsCount: 1 }
            }
          ) {
            edges {
              cursor
              node {
                id
              }
            }
          }
        }
      `),
    ).toMatchSnapshot();
  });

  it('should work for full query', async () => {
    expect(
      await graphql(`
        {
          allHotels(
            search: {
              latitude: 45.4654
              longitude: 9.1859
              checkin: "2017-11-16"
              checkout: "2017-11-23"
              roomsConfiguration: [
                { adultsCount: 2, children: [{ age: 4 }, { age: 6 }] }
                { adultsCount: 1, children: [{ age: 2 }] }
              ]
            }
          ) {
            edges {
              node {
                id
                price {
                  amount
                  currency
                }
                photoUrl
                url
                cityName
              }
            }
          }
        }
      `),
    ).toMatchSnapshot();
  });
});