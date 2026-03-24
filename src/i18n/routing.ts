import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de', 'zh'],
  defaultLocale: 'de',
  localePrefix: 'always'
});
