// @flow

import FlightsFiltersInput from '../FlightsFiltersInput';

it('FlightsFiltersInput type should have valid fields', () => {
  expect(FlightsFiltersInput.getFields()).toMatchSnapshot();
});
