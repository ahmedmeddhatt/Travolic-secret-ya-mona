export enum RatingEnum {
  Negative = 'Negative',
  Neuteral = 'Neuteral',
  Postive = 'Postive'
}

export const RatingEnumQuery = {
  Postive: { $gt: 3 },
  Neuteral: { $eq: 3 },
  Negative: { $lt: 3 }
};
