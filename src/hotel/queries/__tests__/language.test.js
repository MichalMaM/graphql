// @flow

import { graphql } from 'graphql';
import { URL } from 'url';
import schema from '../../../Schema';
import { createContext } from '../../../common/services/GraphqlContext';

let calledUrl: string;
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

describe('availableHotel query', () => {
  it('should call API with czech language', async () => {
    await graphql(
      schema,
      hotelQuery,
      null,
      createContext({ request: fakeRequest }),
      {
        language: 'cs',
      },
    );
    assertLanguage(calledUrl, 'cs');
  });

  it('should call API with special english language', async () => {
    await graphql(
      schema,
      hotelQuery,
      null,
      createContext({ request: fakeRequest }),
      {
        language: 'enus',
      },
    );
    assertLanguage(calledUrl, 'en-us');
  });

  it('should not call API with language when language param is not set', async () => {
    await graphql(
      schema,
      hotelQuery,
      null,
      createContext({ request: fakeRequest }),
      {
        language: null,
      },
    );
    assertLanguage(calledUrl, null);
  });
});

describe('allAvailableHotels query', () => {
  it('should call API with czech language', async () => {
    await graphql(
      schema,
      allHotelsQuery,
      null,
      createContext({ request: fakeRequest }),
      {
        language: 'cs',
      },
    );
    assertLanguage(calledUrl, 'cs');
  });

  it('should call API with special english language', async () => {
    await graphql(
      schema,
      allHotelsQuery,
      null,
      createContext({ request: fakeRequest }),
      {
        language: 'enus',
      },
    );
    assertLanguage(calledUrl, 'en-us');
  });

  it('should not call API with language when language param is not set', async () => {
    await graphql(
      schema,
      allHotelsQuery,
      null,
      createContext({ request: fakeRequest }),
      {
        language: null,
      },
    );
    assertLanguage(calledUrl, null);
  });
});

function assertLanguage(calledUrl, language) {
  const parsedUrl = new URL(calledUrl);
  expect(parsedUrl.searchParams.get('language')).toEqual(language);
}

const hotelQuery = `query availableHotel($language: Language) {
    availableHotel(
      search: {
        checkin: "2018-03-22",
        checkout: "2018-03-28",
        roomsConfiguration: [{adultsCount: 1}],
        hotelId: "aG90ZWw6MjUyMTU=",
        language: $language
      }
    ) {
      hotel {
        name
        summary
      }
    }
  }
`;

const allHotelsQuery = `query allAvailableHotels($language: Language) {
    allAvailableHotels(
      search: {
        cityId: "aG90ZWxDaXR5Oi0yMTQwMjA1"
        checkin: "2017-11-16"
        checkout: "2017-11-23"
        roomsConfiguration: [{ adultsCount: 1 }]
        language: $language
      }
      first: 2
    ) {
      edges {
        node {
          hotel {
            name
            summary
          }
        }
      }
    }
  }
`;
