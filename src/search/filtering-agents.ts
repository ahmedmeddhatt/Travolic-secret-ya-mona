export const filteringAgents = async (
  input: SearchOptions,
  transformedResult: TransformedResult
) => {
  const { itineraries, agents } = transformedResult;

  if (Object.keys(itineraries).length === 0) {
    transformedResult.agents = {};
    transformedResult.itineraries = {};
    return transformedResult;
  }

  const temp = { ...agents };
  for (const itinerary in itineraries) {
    itineraries[itinerary]['pricingOptions'].forEach(
      (agent) => delete temp[agent.agent]
    );
  }

  for (const agent in temp) {
    delete agents[agent];
  }

  return transformedResult;
};
