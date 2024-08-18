/// <reference path="./types/types.d.ts" />
/// <reference path="./types/user.d.ts" />

import dotenv from 'dotenv';
import EventEmitter from 'events';

dotenv.config({ path: '.env' });
import './configs/tracer';

import app from './app';
import connectDB from './configs/db';
import logger from './configs/logger';

const { PORT } = process.env;

async function start() {
  EventEmitter.setMaxListeners(100);

  connectDB();

  app.listen(PORT, () => {
    logger.info(`🚀 Server listening on port: ${PORT} 🚀`);
  });
}

start();
