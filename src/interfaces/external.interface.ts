import { Request } from 'express';

interface RequestClient extends Request {
  client: {
    clientName: string;
    apiKey: string;
  };
}

export default RequestClient;
