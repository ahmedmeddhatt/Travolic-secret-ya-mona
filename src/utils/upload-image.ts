import stream from 'stream';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import logger from '../configs/logger';

const { GCLOUD_PROJECT_ID, GCLOUD_KEY_FILE, GCLOUD_STORAGE_BUCKET } =
  process.env;

const storage = new Storage({
  projectId: GCLOUD_PROJECT_ID,
  keyFilename: GCLOUD_KEY_FILE
});
const bucket = storage.bucket(GCLOUD_STORAGE_BUCKET);

export const PutItemInBucket = async (
  filename: string,
  content: any,
  options: Record<string, any>
): Promise<any> => {
  const destination: string =
    options && options.path ? options.path : undefined;
  const filePath = `${destination}/${filename}.png`;
  const file = bucket.file(filePath);

  content = await sharp(content, {})
    .resize({
      fit: sharp.fit.fill,
      width: 330,
      height: 330
    })
    .toFormat('png')
    .toBuffer();

  const passthroughStream = new stream.PassThrough();
  passthroughStream.write(content);
  passthroughStream.end();

  async function streamFileUpload() {
    passthroughStream.pipe(file.createWriteStream()).on('finish', () => {
      logger.info(`File ${filename} uploaded to bucket.`);
    });
  }

  await streamFileUpload().catch((err) => {
    logger.error(err);
  });

  return {
    path: destination,
    pathWithFilename: filePath,
    filename: filename,
    mime: 'PNG'
  };
};
