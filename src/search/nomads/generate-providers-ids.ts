import fs from 'fs';
import uid from 'tiny-uid';
import providers from './providers';

const providersIds = Object.keys(providers).reduce((memo, provider) => {
  return { ...memo, [uid()]: provider };
}, {});

fs.writeFileSync(
  __dirname + '/providers-ids.ts',
  `const providerIds = ${JSON.stringify(providersIds, null, 2)};

export default providerIds;`
);
