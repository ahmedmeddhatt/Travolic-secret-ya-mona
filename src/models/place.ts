import { Schema, model } from 'mongoose';
import { IPlace, IPlaceModel } from '../interfaces/place.interface';
import translationSchema from './translation';

const placeSchema: Schema = new Schema({
  code: String,
  cityCode: String,
  countryCode: String,
  stations: Number,
  airports: Number,
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  },
  name: String,
  phrase: String,
  placeType: String,
  placeTypeIndex: Number,
  translation: [translationSchema]
});

placeSchema.index({ name: 1, code: 1 });
placeSchema.index({ location: '2dsphere' });

placeSchema.statics.searchFlightPlacesPipeline = async function (
  searchWord: string,
  language: string
): Promise<IPlace[]> {
  let result;
  if (language === 'en') {
    result = await this.aggregate([
      {
        $match: {
          $or: [
            {
              placeType: 'airport',
              $or: [
                {
                  code: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  phrase: {
                    $regex: searchWord,
                    $options: 'i'
                  }
                },
                {
                  cityCode: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                }
              ]
            },
            {
              placeType: 'city',
              airports: {
                $gt: 0
              },
              $or: [
                {
                  code: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  phrase: {
                    $regex: searchWord,
                    $options: 'i'
                  }
                },
                {
                  cityCode: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                }
              ]
            }
          ]
        }
      },
      {
        $set: {
          phraseSplit: {
            $split: ['$phrase', '|']
          },
          city: {
            code: '$cityCode'
          }
        }
      },
      {
        $set: {
          codeMatch: {
            $cond: {
              if: { $eq: [{ $toLower: '$code' }, searchWord] },
              then: true,
              else: false
            }
          },
          Highlighting: {
            $map: {
              input: '$phraseSplit',
              as: 'phrase',
              in: { $indexOfBytes: [{ $toLower: '$$phrase' }, searchWord] }
            }
          }
        }
      },
      {
        $set: {
          Highlighting: {
            $filter: {
              input: '$Highlighting',
              as: 'highlight',
              cond: { $gte: ['$$highlight', 0] }
            }
          }
        }
      },
      {
        $sort: {
          PlaceType: 1,
          Highlighting: 1,
          codeMatch: -1
        }
      },
      {
        $unset: ['phraseSplit', 'codeMatch']
      }
    ]);
  } else {
    result = await this.aggregate([
      {
        $match: {
          $or: [
            {
              placeType: 'airport',
              $or: [
                {
                  code: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  cityCode: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  translation: {
                    $elemMatch: {
                      phrase: {
                        $regex: searchWord,
                        $options: 'i'
                      },
                      language: language
                    }
                  }
                }
              ]
            },
            {
              placeType: 'city',
              airports: {
                $gt: 0
              },
              $or: [
                {
                  code: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  cityCode: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  translation: {
                    $elemMatch: {
                      phrase: {
                        $regex: searchWord,
                        $options: 'i'
                      },
                      language: language
                    }
                  }
                }
              ]
            }
          ]
        }
      },
      {
        $set: {
          phraseSplit: {
            $split: ['$phrase', '|']
          },
          city: {
            code: '$cityCode'
          }
        }
      },
      {
        $set: {
          codeMatch: {
            $cond: {
              if: { $eq: [{ $toLower: '$code' }, searchWord] },
              then: true,
              else: false
            }
          },
          Highlighting: {
            $map: {
              input: '$phraseSplit',
              as: 'phrase',
              in: { $indexOfBytes: [{ $toLower: '$$phrase' }, searchWord] }
            }
          }
        }
      },
      {
        $set: {
          Highlighting: {
            $filter: {
              input: '$Highlighting',
              as: 'highlight',
              cond: { $gte: ['$$highlight', 0] }
            }
          }
        }
      },
      {
        $sort: {
          PlaceType: 1,
          Highlighting: 1,
          codeMatch: -1
        }
      },
      {
        $unset: ['phraseSplit', 'codeMatch']
      }
    ]);
  }

  return result;
};

placeSchema.statics.searchCityPlacesPipeline = async function (
  searchWord: string,
  language: string
): Promise<IPlace[]> {
  let result;
  if (language === 'en') {
    result = await this.aggregate([
      {
        $match: {
          placeType: 'city',
          $or: [
            {
              code: {
                $regex: '^' + searchWord,
                $options: 'i'
              }
            },
            {
              phrase: {
                $regex: searchWord,
                $options: 'i'
              }
            }
          ]
        }
      },
      {
        $set: {
          phraseSplit: {
            $split: ['$phrase', '|']
          }
        }
      },
      {
        $set: {
          codeMatch: {
            $cond: {
              if: { $eq: [{ $toLower: '$code' }, searchWord] },
              then: true,
              else: false
            }
          },
          Highlighting: {
            $map: {
              input: '$phraseSplit',
              as: 'phrase',
              in: { $indexOfBytes: [{ $toLower: '$$phrase' }, searchWord] }
            }
          }
        }
      },
      {
        $set: {
          Highlighting: {
            $filter: {
              input: '$Highlighting',
              as: 'highlight',
              cond: { $gte: ['$$highlight', 0] }
            }
          }
        }
      },
      {
        $sort: {
          PlaceType: 1,
          Highlighting: 1,
          codeMatch: -1
        }
      },
      {
        $unset: ['phraseSplit', 'codeMatch']
      }
    ]);
  } else {
    result = await this.aggregate([
      {
        $match: {
          placeType: 'city',
          $or: [
            {
              code: {
                $regex: '^' + searchWord,
                $options: 'i'
              }
            },
            {
              translation: {
                $elemMatch: {
                  phrase: {
                    $regex: searchWord,
                    $options: 'i'
                  },
                  language: language
                }
              }
            }
          ]
        }
      },
      {
        $set: {
          phraseSplit: {
            $split: ['$phrase', '|']
          }
        }
      },
      {
        $set: {
          codeMatch: {
            $cond: {
              if: { $eq: [{ $toLower: '$code' }, searchWord] },
              then: true,
              else: false
            }
          },
          Highlighting: {
            $map: {
              input: '$phraseSplit',
              as: 'phrase',
              in: { $indexOfBytes: [{ $toLower: '$$phrase' }, searchWord] }
            }
          }
        }
      },
      {
        $set: {
          Highlighting: {
            $filter: {
              input: '$Highlighting',
              as: 'highlight',
              cond: { $gte: ['$$highlight', 0] }
            }
          }
        }
      },
      {
        $sort: {
          PlaceType: 1,
          Highlighting: 1,
          codeMatch: -1
        }
      },
      {
        $unset: ['phraseSplit', 'codeMatch']
      }
    ]);
  }

  return result;
};

placeSchema.statics.searchStationPlacesPipeline = async function (
  searchWord: string,
  language: string
): Promise<IPlace[]> {
  let result;

  if (language === 'en') {
    result = await this.aggregate([
      {
        $match: {
          $or: [
            {
              placeType: {
                $in: [
                  'train_station',
                  'bus_station',
                  'tram_station',
                  'ferry_station'
                ]
              },
              $or: [
                {
                  code: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  cityCode: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  phrase: {
                    $regex: searchWord,
                    $options: 'i'
                  }
                }
              ]
            },
            {
              placeType: 'city',
              stations: {
                $gt: 0
              },
              $or: [
                {
                  code: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  cityCode: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  phrase: {
                    $regex: searchWord,
                    $options: 'i'
                  }
                }
              ]
            }
          ]
        }
      },
      {
        $set: {
          phraseSplit: {
            $split: ['$phrase', '|']
          },
          city: {
            code: '$cityCode'
          }
        }
      },
      {
        $set: {
          codeMatch: {
            $cond: {
              if: { $eq: [{ $toLower: '$code' }, searchWord] },
              then: true,
              else: false
            }
          },
          Highlighting: {
            $map: {
              input: '$phraseSplit',
              as: 'phrase',
              in: { $indexOfBytes: [{ $toLower: '$$phrase' }, searchWord] }
            }
          }
        }
      },
      {
        $set: {
          Highlighting: {
            $filter: {
              input: '$Highlighting',
              as: 'highlight',
              cond: { $gte: ['$$highlight', 0] }
            }
          }
        }
      },
      {
        $sort: {
          PlaceType: 1,
          Highlighting: 1,
          codeMatch: -1
        }
      },
      {
        $unset: ['phraseSplit', 'codeMatch']
      }
    ]);
  } else {
    result = await this.aggregate([
      {
        $match: {
          $or: [
            {
              placeType: {
                $in: [
                  'train_station',
                  'bus_station',
                  'tram_station',
                  'ferry_station'
                ]
              },
              $or: [
                {
                  code: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  cityCode: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  translation: {
                    $elemMatch: {
                      phrase: {
                        $regex: searchWord,
                        $options: 'i'
                      },
                      language: language
                    }
                  }
                }
              ]
            },
            {
              placeType: 'city',
              stations: {
                $gt: 0
              },
              $or: [
                {
                  code: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  cityCode: {
                    $regex: '^' + searchWord,
                    $options: 'i'
                  }
                },
                {
                  translation: {
                    $elemMatch: {
                      phrase: {
                        $regex: searchWord,
                        $options: 'i'
                      },
                      language: language
                    }
                  }
                }
              ]
            }
          ]
        }
      },
      {
        $set: {
          phraseSplit: {
            $split: ['$phrase', '|']
          },
          city: {
            code: '$cityCode'
          }
        }
      },
      {
        $set: {
          codeMatch: {
            $cond: {
              if: { $eq: [{ $toLower: '$code' }, searchWord] },
              then: true,
              else: false
            }
          },
          Highlighting: {
            $map: {
              input: '$phraseSplit',
              as: 'phrase',
              in: { $indexOfBytes: [{ $toLower: '$$phrase' }, searchWord] }
            }
          }
        }
      },
      {
        $set: {
          Highlighting: {
            $filter: {
              input: '$Highlighting',
              as: 'highlight',
              cond: { $gte: ['$$highlight', 0] }
            }
          }
        }
      },
      {
        $sort: {
          PlaceType: 1,
          Highlighting: 1,
          codeMatch: -1
        }
      },
      {
        $unset: ['phraseSplit', 'codeMatch']
      }
    ]);
  }

  return result;
};

placeSchema.statics.searchHotelPlacesPipeline = async function (
  searchWord: string,
  language: string
): Promise<IPlace[]> {
  const result = await this.aggregate([
    {
      $match: {
        $or: [
          {
            $or: [
              {
                code: {
                  $regex: '^' + searchWord,
                  $options: 'i'
                }
              },
              {
                name: {
                  $regex: '^' + searchWord,
                  $options: 'i'
                }
              },
              {
                agoda_city_id: {
                  $regex: '^' + searchWord + '$',
                  $options: 'i'
                }
              },
              {
                translation: {
                  $elemMatch: {
                    phrase: {
                      $regex: searchWord,
                      $options: 'i'
                    },
                    language: language
                  }
                }
              }
            ],
            placeType: 'city',
            agoda_city_id: {
              $exists: true
            }
          },
          {
            $or: [
              {
                code: {
                  $regex: '^' + searchWord + '$',
                  $options: 'i'
                }
              },
              {
                cityCode: {
                  $regex: '^' + searchWord,
                  $options: 'i'
                }
              },
              {
                name: {
                  $regex: '^' + searchWord,
                  $options: 'i'
                }
              }
            ],
            placeType: 'hotel'
          }
        ]
      }
    },
    {
      $set: {
        phraseSplit: {
          $split: ['$phrase', '|']
        }
      }
    },
    {
      $set: {
        codeMatch: {
          $cond: {
            if: { $eq: [{ $toLower: '$code' }, searchWord] },
            then: true,
            else: false
          }
        },
        Highlighting: {
          $map: {
            input: '$phraseSplit',
            as: 'phrase',
            in: { $indexOfBytes: [{ $toLower: '$$phrase' }, searchWord] }
          }
        }
      }
    },
    {
      $set: {
        Highlighting: {
          $filter: {
            input: '$Highlighting',
            as: 'highlight',
            cond: { $gte: ['$$highlight', 0] }
          }
        }
      }
    },
    {
      $sort: {
        PlaceType: 1,
        Highlighting: 1,
        codeMatch: -1
      }
    },
    {
      $unset: ['phraseSplit', 'codeMatch']
    },
    {
      $set: {
        city: {
          code: '$cityCode'
        }
      }
    }
  ]);

  return result;
};

const Place = model<IPlace, IPlaceModel>('Place', placeSchema);

export default Place;
