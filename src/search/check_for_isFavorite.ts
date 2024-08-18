import user_favorites from '../models/user-favs';
export const checkIsFavorite = async (
  input: SearchOptions,
  transformedResult: TransformedResult
) => {
  const userId = input.userData._id;
  if (userId) {
    const userFavourites = await user_favorites.find({ userId: userId });
    userFavourites.forEach((userFavourite) => {
      const { itineraryId } = userFavourite;
      if (transformedResult.itineraries[itineraryId]) {
        transformedResult.itineraries[itineraryId].isFavorite = true;
      }
    });
  }
  return transformedResult;
};
