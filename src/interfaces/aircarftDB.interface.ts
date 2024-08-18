import Document from 'mongoose';

interface IaircarftDB extends Document {
  icao_codes: string;
  iata_codes: string;
  group_name: string;
  subgroup_name: string;
  is_wide_body: boolean;
}

export default IaircarftDB;
