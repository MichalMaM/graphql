// @flow

import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import idx from 'idx';

import { post } from '../../common/services/HttpRequest';
import GraphQLUpdatePassenger from '../types/outputs/UpdatePassenger';
import GraphQLPassengerInsuranceInputType from '../types/inputs/PassengerInsuranceInput';
import type { InsurancePrice, Passenger } from '../Booking';
import type { GraphqlContextType } from '../../common/services/GraphqlContext';

type InsuranceInputType = 'TRAVEL_PLUS' | 'TRAVEL_BASIC' | 'NONE';
type InsuranceType = 'travel_plus' | 'travel_basic' | 'none';

type PassengerInputType = {|
  +passengerId: number,
  +insuranceType: InsuranceInputType,
|};

type Change = {|
  +passengerId: number,
  +from: InsuranceType,
  +to: InsuranceType,
|};

type Args = {
  +id: string,
  +passengers: $ReadOnlyArray<PassengerInputType>,
  +simpleToken: string,
};

type UpdatePassengerResponse = {|
  +success: boolean,
|};

export default {
  type: GraphQLUpdatePassenger,
  args: {
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'The global booking id',
    },
    simpleToken: {
      type: GraphQLNonNull(GraphQLString),
    },
    passengers: {
      type: GraphQLNonNull(
        GraphQLList(GraphQLNonNull(GraphQLPassengerInsuranceInputType)),
      ),
    },
  },
  resolve: async (
    _: mixed,
    { passengers, id, simpleToken }: Args,
    { dataLoader, apiToken }: GraphqlContextType,
  ): Promise<UpdatePassengerResponse> => {
    if (!simpleToken && !apiToken) {
      throw new Error('You must be logged in to update passenger.');
    }
    const headers = {};
    if (apiToken) {
      headers['kw-user-token'] = apiToken;
    }
    if (simpleToken) {
      headers['kw-simple-token'] = simpleToken;
    }
    const { id: bookingId } = fromGlobalId(id);

    const booking = await dataLoader.singleBooking.load({
      id: parseInt(bookingId),
      authToken: simpleToken,
    });

    const insurancePrices = booking.insurancePrices;
    const currentPassengers = booking.passengers;

    const currency = getCurrency(insurancePrices);

    const changes = compareChanges(currentPassengers, passengers);

    const amount = computeAmount(changes, insurancePrices);

    if (amount > 0) {
      throw new Error('Impossible to refund a positive amount.');
    }

    const insurances = getInsurancesPayload(changes, passengers);

    if (insurances.length === 0) {
      throw new Error('Impossible to refund when no changes occurred.');
    }

    const payload = {
      insurances,
      price: {
        amount,
        base: amount,
        currency,
      },
      use_credits: false,
    };

    await post(
      `https://booking-api.skypicker.com/mmb/v1/bookings/${bookingId}/insurances`,
      payload,
      headers,
    );

    return {
      success: true,
    };
  },
};

function getCurrency(insurancePrices: InsurancePrice[]) {
  const currencies = new Set();
  insurancePrices.forEach(insurancePrice => {
    const currency = idx(insurancePrice, _ => _.price.currency);
    if (currency) {
      currencies.add(currency);
    }
  });
  if (currencies.size !== 1) {
    throw new Error(
      'Impossible to compute the price with different currencies.',
    );
  }
  return currencies.values().next().value;
}

function compareChanges(
  currentPassengers: $ReadOnlyArray<Passenger>,
  newPassengers: $ReadOnlyArray<PassengerInputType>,
): Change[] {
  return (
    newPassengers &&
    newPassengers.map(newPassenger => {
      const passengerId = newPassenger.passengerId;
      const currentPassenger = currentPassengers.find(
        passenger => passenger.id === passengerId,
      );
      if (!currentPassenger) {
        throw new Error('Passenger could not be found');
      }
      const from = currentPassenger.insuranceType;
      const to = newPassenger.insuranceType.toLowerCase();
      if (
        (from === 'travel_plus' ||
          from === 'travel_basic' ||
          from === 'none') &&
        (to === 'travel_plus' || to === 'travel_basic' || to === 'none')
      ) {
        return {
          passengerId,
          from,
          to,
        };
      }
      throw new Error("Passenger's insurance could not be found");
    })
  );
}

function computeAmount(changes: Change[], insurancePrices: InsurancePrice[]) {
  const prices = {};
  insurancePrices.forEach(insurancePrice => {
    prices[insurancePrice.type] = insurancePrice.price;
  });
  return (
    changes &&
    changes
      .map(change => ({
        from: prices[change.from],
        to: prices[change.to],
      }))
      .reduce((acc, curr) => {
        const fromAmount = idx(curr, _ => _.from.amount) || 0;
        const toAmount = idx(curr, _ => _.to.amount) || 0;
        return acc + toAmount - fromAmount;
      }, 0)
  );
}

const getInsurancesPayload = (
  changes: Change[],
  passengers: $ReadOnlyArray<PassengerInputType>,
) => {
  const passengerIdsWithChange = changes
    .filter(change => change.from !== change.to)
    .map(change => change.passengerId);

  const passengersWithChange = passengers.filter(passenger =>
    passengerIdsWithChange.includes(passenger.passengerId),
  );

  return passengersWithChange.map(passenger => ({
    passenger_id: passenger.passengerId,
    insurance_type: passenger.insuranceType.toLowerCase(),
  }));
};
