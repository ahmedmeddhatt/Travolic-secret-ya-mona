// Import necessary modules
import axios from "axios";
import { supportedCurrencies, defaultCurrency } from './pos';
import logger from '../../../../configs/logger';

// Environment variables
const { THEBARGAINTRIP_URL, THEBARGAINTRIP_TOKEN } = process.env;

// Check if there's any missing environment variable (Uncomment for debugging)
if(!process.env.THEBARGAINTRIP_TOKEN || !process.env.THEBARGAINTRIP_URL){
    logger.error('Missing environment variables for THEBARGAINTRIP!');
};

// Mapping cabin class object
const cabinClassMap = {
    Economy: '1',
    Premium_Economy: '2',
    Business: '4',
    First: '6'
};

// Mapping trip type object
const tripTypeMap = {
    round: 'roundtrip',
    oneway: 'oneway'
};

// Transform options function to match provider's schema
const transformOptions = (options: SearchOptions) => {
    const {
        adults,
        children,
        infants,
        cabinClass,
        country,
        currency,
        language,
        tripType,
        legs
    } = options;

    // Turn it to the provider's schema
    return {
        adults,
        children,
        infants,
        cabin: cabinClassMap[cabinClass],
        country,
        currency: supportedCurrencies.includes(currency)
        ? currency
        : defaultCurrency,
        language,
        tripType: tripTypeMap[tripType],
        legs
    }
};

// Search function to fetch data from provider
const search = async (input: SearchOptions) => {
    // Only allowed types [oneway, round]
    if(input.tripType === 'multi'){
        return {};
    };

    // Transform the input data to match the provider's schema
    const options = transformOptions(input),
    source = 'TRAVOLIC',
    siteid = '105',

    // Origin|destination|departure
    sec1Param = `${options.legs[0].origin}|${options.legs[0].destination}|${options.legs[0].departure}`;

    // Provider URL
    let URL = `${THEBARGAINTRIP_URL}?sec1=${sec1Param}&adults=${options.adults}&child=${options.children}&infants=${options.infants}&cabin=${options.cabin}&source=${source}&siteid=${siteid}&token=${THEBARGAINTRIP_TOKEN}`
    
    // Check if it's a round trip and add the return leg
    if(options.tripType === 'round'){
        const sec2Param = `${options.legs[1].origin}|${options.legs[1].destination}|${options.legs[1].departure}`;
        // Use & instead of $ for the query parameter
        URL = URL.concat(`&sec2=${sec2Param}`);
        console.log('round url', URL); 
    };
    console.log('URL', URL);

    try {
        // Send a request to the provider
        const res = await axios.get(URL);
        console.log('data', res.data.flights); 
        
        // Return the search results
        return res.data;
    } catch (err) {
        logger.error(err.message);
        return {};
    }
};

export default search;
