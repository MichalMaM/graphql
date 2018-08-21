// @flow

import { graphql } from 'graphql';
import schema from '../../../Schema';
import { createContext } from '../../../common/services/GraphqlContext';

let calledUrl;
jest.mock('../../../common/services/JsonFetcher', () => ({
  fetchJson: url => {
    calledUrl = url;
    return { locations: [] };
  },
}));

const fakeRequest = {
  headers: {},
  ip: '',
};

describe('locationType option in allLocations query', () => {
  it('should work when searching by string', async () => {
    const query = createQuery('search: "prg"');
    await graphql(
      schema,
      query,
      null,
      createContext({ request: fakeRequest }),
      {
        locationType: 'airport',
      },
    );
    expect(calledUrl).toEqual(
      'https://api.skypicker.com/locations?term=prg&locale=de-DE&location_types=airport',
    );
  });

  it('should work when searching by radius', async () => {
    const query = createQuery('radius: {lat: 1, lng: 2, radius: 100}');
    await graphql(
      schema,
      query,
      null,
      createContext({ request: fakeRequest }),
      {
        locationType: 'city',
      },
    );
    expect(calledUrl).toEqual(
      'https://api.skypicker.com/locations?type=radius&lat=1&lon=2&radius=100&locale=de-DE&location_types=city',
    );
  });

  it('should work when searching by area', async () => {
    const query = createQuery(
      'area: {topLeft: {lat: 3, lng: 2}, bottomRight: {lat: 1, lng: 4}}',
    );
    await graphql(
      schema,
      query,
      null,
      createContext({ request: fakeRequest }),
      {
        locationType: 'country',
      },
    );
    expect(calledUrl).toEqual(
      'https://api.skypicker.com/locations?type=box&high_lat=3&low_lon=2&low_lat=1&high_lon=4&locale=de-DE&location_types=country',
    );
  });
});

function createQuery(searchStr) {
  return `query allLocations($locationType: LocationType) {
    allLocations(
      ${searchStr},
      options: {
        locationType: $locationType,
        locale: de_DE
      }
    ) {
      edges {
        node {
          name
        }
      }
    }
  }
  `;
}
