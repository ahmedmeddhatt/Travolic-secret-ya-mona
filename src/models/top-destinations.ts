import { Schema, model } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import {
  ITopDestinationDocument,
  ITopDestinationModel
} from '../interfaces/trending.interface';
import translationSchema from './translation';

const topDestinationSchema = new Schema(
  {
    type: String,
    rank: {
      type: Number,
      default: 1
    },
    phrase: String,
    originName: String,
    originCode: String,
    originCityCode: String,
    destinationCityCode: String,
    destinationName: String,
    destinationCode: String,
    oneWayPrice: {
      minPrice: {
        amount: Number
      },
      maxPrice: {
        amount: Number
      }
    },
    roundPrice: {
      minPrice: {
        amount: Number
      },
      maxPrice: {
        amount: Number
      }
    },
    translation: [translationSchema]
  },
  {
    timestamps: true
  }
);

topDestinationSchema.plugin(paginate);

topDestinationSchema.statics.trendingPipeline = async function (
  limit: number,
  page: number,
  origin: string,
  searchWord: string
) {
  if (searchWord !== '') {
    return await this.aggregate([
      {
        $match: {
          originCode: origin,
          $and: [
            {
              oneWayPrice: {
                $exists: true
              }
            },
            {
              roundPrice: {
                $exists: true
              }
            },
            {
              'oneWayPrice.maxPrice.amount': { $gt: 0 }
            },
            {
              'oneWayPrice.maxPrice.amount': { $gt: 0 }
            },
            {
              'roundPrice.maxPrice.amount': { $gt: 0 }
            },
            {
              'roundPrice.minPrice.amount': { $gt: 0 }
            }
          ]
        }
      },
      {
        $sort: {
          rank: -1
        }
      },
      {
        $limit: limit
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $match: {
          $or: [
            {
              destinationCode: {
                $regex: new RegExp(`^${searchWord}$`, 'i')
              }
            },
            {
              destinationName: {
                $regex: new RegExp(`^${searchWord}$`, 'i')
              }
            }
          ]
        }
      }
    ]);
  } else {
    return await this.aggregate([
      {
        $match: {
          originCode: origin,
          $and: [
            {
              oneWayPrice: {
                $exists: true
              }
            },
            {
              roundPrice: {
                $exists: true
              }
            },
            {
              'oneWayPrice.maxPrice.amount': { $gt: 0 }
            },
            {
              'oneWayPrice.maxPrice.amount': { $gt: 0 }
            },
            {
              'roundPrice.maxPrice.amount': { $gt: 0 }
            },
            {
              'roundPrice.minPrice.amount': { $gt: 0 }
            }
          ]
        }
      },
      {
        $sort: {
          rank: -1
        }
      },
      {
        $limit: limit
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $facet: {
          metadata: [
            {
              $count: 'total'
            }
          ],
          data: [
            {
              $skip: (page - 1) * limit
            },
            {
              $limit: limit
            }
          ]
        }
      }
    ]);
  }
};

topDestinationSchema.statics.trendingAirportsPipeline = async function (
  origin: string,
  type: string,
  page: number,
  limit: number
) {
  if (type === 'city') {
    return await this.aggregate([
      {
        $match: {
          originCityCode: origin
        }
      },
      {
        $sort: {
          rank: -1
        }
      },
      {
        $limit: limit
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $unset: [
          'createdAt',
          '__v',
          'updatedAt',
          'originCode',
          'originName',
          'originCityCode',
          'rank'
        ]
      }
    ]);
  } else if (type === 'airport') {
    return await this.aggregate([
      {
        $match: {
          originCode: origin
        }
      },
      {
        $sort: {
          rank: -1
        }
      },
      {
        $limit: limit
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $unset: [
          'createdAt',
          '__v',
          'updatedAt',
          'originCode',
          'originName',
          'originCityCode',
          'rank'
        ]
      }
    ]);
  } else {
    return [];
  }
};

const TopDestination = model<ITopDestinationDocument, ITopDestinationModel>(
  'TopDestination',
  topDestinationSchema
);

export default TopDestination;
