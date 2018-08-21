// @flow

import DataLoader from 'dataloader';
import idx from 'idx';
import sha1 from 'sha1';

import parseAcceptLanguage from './context/ParseAcceptLanguage';

import IdentityDataloader from '../../identity/dataloaders/Identity';
import createBookingLoader from '../../booking/dataloaders/Booking';
import createCurrencyLoader from '../../currency/dataloaders/Currency';
import createAirlineLoader from '../../flight/dataloaders/Airline';
import createRatesLoader from '../dataloaders/Rates';
import createFAQLoader from '../../FAQ/dataloaders/searchFAQ';
import FAQCategoriesLoader from '../../FAQ/dataloaders/FAQCategories';
import createFAQArticleLoader from '../../FAQ/dataloaders/FAQArticle';
import createSingleBookingLoader from '../../booking/dataloaders/SingleBooking';
import BookingsLoader from '../../booking/dataloaders/Bookings';
import LocationsLoader from '../../location/dataloaders/Locations';
import LocationLoader from '../../location/dataloaders/Location';
import FlightLoader from '../../flight/dataloaders/Flight';
import OptionsStorage from './context/OptionsStorage';
import HotelsAvailability from '../../hotel/dataloaders/HotelsAvailability';
import { type SearchParameters as HotelKey } from '../../hotel/dataloaders/flow/SearchParameters';
import createHotelByIdLoader from '../../hotel/dataloaders/HotelByID';
import HotelCities from '../../hotel/dataloaders/HotelCities';
import CitiesByID from '../../hotel/dataloaders/CitiesByID';
import HotelRoomsLoader from '../../hotel/dataloaders/HotelRooms';
import HotelRoomAvailabilityLoader from '../../hotel/dataloaders/HotelRoomAvailability';
import HotelRoomBeddingLoader from '../../hotel/dataloaders/RoomBedding';
import PriceStatsLoader from '../../hotel/dataloaders/PriceStats';
import DynamicPackagesLoader from '../../dynamicPackage/dataloaders/DynamicPackages';
import createCustomerSupportNumberLoader from '../../customerSupport/dataloaders/CustomerSupportNumber';

import type { Booking } from '../../booking/Booking';
import type { Args as SingleBookingArgs } from '../../booking/dataloaders/SingleBooking';
import type { Airline } from '../../flight/Flight';
import type { CurrencyDetail } from '../../currency/CurrencyDetail';
import type { HotelType } from '../../hotel/dataloaders/flow/HotelType';
import type { City } from '../../hotel/dataloaders/flow/City';
import type { Args as FAQArgs } from '../../FAQ/dataloaders/searchFAQ';
import type { FAQArticleItem } from '../../FAQ/dataloaders/FAQCategories';
import type {
  Args as FAQCArticleArgs,
  FAQArticleDetail,
} from '../../FAQ/dataloaders/FAQArticle';
import type { CustomerSupportNumber } from '../../customerSupport/types/CustomerSupportNumber';

/**
 * FIXME:
 * This is stupid - it's already defined by data-loader itself but currently
 * it's needed to type resolvers. How to do it better?
 */
export type GraphqlContextType = {|
  // DataLoader<K, V>
  locale: {|
    +language: string, // cs
    +territory: string, // CZ
    +format: {|
      +underscored: string, // cs_CZ
      +dashed: string, // cs-CZ
    |},
  |},
  apiToken: ?string,
  whoIAm: string,
  dataLoader: {|
    airline: DataLoader<string, ?Airline>,
    booking: DataLoader<number | string, Booking>,
    bookings: BookingsLoader,
    singleBooking: DataLoader<SingleBookingArgs, Booking>,
    currency: DataLoader<string, CurrencyDetail>,
    flight: FlightLoader,
    identity: IdentityDataloader,
    location: LocationLoader,
    locations: LocationsLoader,
    rates: DataLoader<string, ?number>,
    city: DataLoader<string, City>,
    hotel: {
      availabilityByLocation: DataLoader<HotelKey, HotelType[]>,
      availabilityByID: DataLoader<HotelKey, HotelType[]>,
      byID: DataLoader<$FlowFixMe, $FlowFixMe>,
      cities: HotelCities,
      room: HotelRoomsLoader,
      roomAvailability: HotelRoomAvailabilityLoader,
      roomBedding: typeof HotelRoomBeddingLoader,
      priceStats: DataLoader<
        { searchParams: HotelKey, boundary: 'MAX' | 'MIN' },
        number,
      >,
    },
    FAQ: DataLoader<FAQArgs, FAQArticleItem[]>,
    FAQCategories: FAQCategoriesLoader,
    FAQArticle: DataLoader<FAQCArticleArgs, FAQArticleDetail>,
    dynamicPackages: DynamicPackagesLoader,
    customerSupportNumber: DataLoader<string, ?CustomerSupportNumber>,
  |},
  options: OptionsStorage,
  _traceCollector?: Object,
|};

/**
 * Although API contains several FAQ trees, this is currently the only relevant tree.
 * Others may include testing data or the ones not intended for displaying
 */
const FAQ_CATEGORY_ID = '3';

type ContextParameterType = {
  token?: ?string,
  acceptLanguage?: ?string,
  request?: {
    ip: string,
    headers: Object,
  },
};

export function createContext({
  token,
  acceptLanguage,
  request,
}: ContextParameterType): GraphqlContextType {
  const bookings = new BookingsLoader(token);
  const locations = new LocationsLoader();
  const location = new LocationLoader();
  const hotelCities = new HotelCities();

  const [language, territory] = parseAcceptLanguage(acceptLanguage);
  const userAgent = idx(request, _ => _.headers['user-agent']) || '';
  const userIp = idx(request, _ => _.ip) || '';

  const locale = {
    language,
    territory: territory,
    format: {
      underscored: language + '_' + territory,
      dashed: language + '-' + territory,
    },
  };

  return {
    locale,
    apiToken: token,
    whoIAm: sha1(userAgent + userIp),
    dataLoader: {
      airline: createAirlineLoader(),
      booking: createBookingLoader(token, bookings),
      bookings: bookings,
      singleBooking: createSingleBookingLoader(),
      currency: createCurrencyLoader(),
      flight: new FlightLoader(location, locations),
      identity: new IdentityDataloader(token),
      location: location,
      locations: locations,
      rates: createRatesLoader(),
      city: CitiesByID,
      hotel: {
        availabilityByLocation: HotelsAvailability,
        availabilityByID: HotelsAvailability,
        byID: createHotelByIdLoader(locale.format.underscored),
        cities: hotelCities,
        room: new HotelRoomsLoader(locale.format.underscored),
        roomAvailability: new HotelRoomAvailabilityLoader(),
        roomBedding: HotelRoomBeddingLoader,
        priceStats: PriceStatsLoader,
      },
      FAQ: createFAQLoader(locale.language, FAQ_CATEGORY_ID),
      FAQCategories: new FAQCategoriesLoader(locale.language, FAQ_CATEGORY_ID),
      FAQArticle: createFAQArticleLoader(locale.language),
      dynamicPackages: new DynamicPackagesLoader(location),
      customerSupportNumber: createCustomerSupportNumberLoader(),
    },
    options: new OptionsStorage(),
  };
}
