import Document from 'mongoose';

interface Iaircarft extends Document {
  type: string;
  model: string;
}

export default Iaircarft;
