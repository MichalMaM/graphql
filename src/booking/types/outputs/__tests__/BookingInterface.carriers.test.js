// @flow

import { RestApiMock } from '../../../../common/services/TestingTools';

import { commonFields } from '../BookingInterface';
import config from '../../../../../config/application';
import AirlinesDataset from '../../../../flight/datasets/airlines.json';
import { createContext } from '../../../../common/services/GraphqlContext';

beforeEach(() => {
  RestApiMock.onGet(config.restApiEndpoint.airlines).replyWithData(
    AirlinesDataset,
  );
});

const legs = [
  // $FlowExpectedError: just a subset necessary for the test
  { airlineCode: 'FR' },
  // $FlowExpectedError: just a subset necessary for the test
  { airlineCode: 'FR' },
  // $FlowExpectedError: just a subset necessary for the test
  { airlineCode: 'FLIXBUS' },
];

it('returns unique list of carriers', async () => {
  const context = createContext({
    request: {
      ip: '',
      headers: {},
    },
  });
  // $FlowExpectedError: full Leg object is not needed for this test
  const carriers = await commonFields.carriers.resolve({ legs }, {}, context);

  expect(Array.from(carriers)).toEqual([
    {
      code: 'FR',
      isLowCost: true,
      name: 'Ryanair',
    },
    {
      code: 'FLIXBUS',
      isLowCost: false,
      name: 'Flixbus',
    },
  ]);
});
