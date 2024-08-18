import { merge } from 'lodash';
import { LanguageEnum } from '../enums/language.enum';

const DEFAULT_LANGUAGE: LanguageEnum = LanguageEnum.en;

class TranslationService {
  static translate(doc: any, language: string) {
    doc = doc.toObject
      ? doc.toObject({ virtuals: false })
      : JSON.parse(JSON.stringify(doc));

    if (language == DEFAULT_LANGUAGE) {
      doc.translation = undefined;
      if (doc.city) {
        doc.city.translation = undefined;

        if (doc.city.country) {
          doc.city.country.translation = undefined;

          if (doc.city.country.currency) {
            doc.city.country.currency.translation = undefined;
          }
        }

        if (doc.city.state) {
          doc.city.state.translation = undefined;

          if (doc.city.state.country) {
            doc.city.state.country.translation = undefined;

            if (doc.city.state.country.currency) {
              doc.city.state.country.currency.translation = undefined;
            }
          }
        }
      }

      if (doc.country) {
        doc.country.translation = undefined;

        if (doc.country.currency) {
          doc.country.currency.translation = undefined;
        }
      }

      if (doc.state) {
        doc.state.translation = undefined;

        if (doc.state.country) {
          doc.state.country.translation = undefined;

          if (doc.state.country.currency) {
            doc.state.country.currency.translation = undefined;
          }
        }
      }

      if (doc.currency) {
        doc.currency.translation = undefined;
      }

      return doc;
    }

    let translation = doc.translation.find(
      (tr: any) => tr.language == language
    );

    doc = merge(doc, translation);
    doc.translation = undefined;

    if (doc.city && doc.city.translation) {
      translation = doc.city.translation.find(
        (tr: any) => tr.language == language
      );
      doc.city = merge(doc.city, translation);
      doc.city.translation = undefined;

      if (doc.city.country && doc.city.country.translation) {
        translation = doc.city.country.translation.find(
          (tr: any) => tr.language == language
        );
        doc.city.country = merge(doc.city.country, translation);
        doc.city.country.translation = undefined;

        if (
          doc.city.country.currency &&
          doc.city.country.currency.translation
        ) {
          translation = doc.city.country.currency.translation.find(
            (tr: any) => tr.language == language
          );
          doc.city.country.currency = merge(
            doc.city.country.currency,
            translation
          );
          doc.city.country.currency.translation = undefined;
        }
      }

      if (doc.city.state && doc.city.state.translation) {
        translation = doc.city.state.translation.find(
          (tr: any) => tr.language == language
        );
        doc.city.state = merge(doc.city.state, translation);
        doc.city.state.translation = undefined;

        if (doc.city.state.country && doc.city.state.country.translation) {
          translation = doc.city.state.country.translation.find(
            (tr: any) => tr.language == language
          );
          doc.city.state.country = merge(doc.city.state.country, translation);
          doc.city.state.country.translation = undefined;

          if (
            doc.city.state.country.currency &&
            doc.city.state.country.currency.translation
          ) {
            translation = doc.city.state.country.currency.translation.find(
              (tr: any) => tr.language == language
            );
            doc.city.state.country.currency = merge(
              doc.city.state.country.currency,
              translation
            );
            doc.city.state.country.currency.translation = undefined;
          }
        }
      }
    }

    if (doc.state && doc.state.translation) {
      translation = doc.state.translation.find(
        (tr: any) => tr.language == language
      );
      doc.state = merge(doc.state, translation);
      doc.state.translation = undefined;

      if (doc.state.country && doc.state.country.translation) {
        translation = doc.state.country.translation.find(
          (tr: any) => tr.language == language
        );
        doc.state.country = merge(doc.state.country, translation);
        doc.state.country.translation = undefined;

        if (
          doc.state.country.currency &&
          doc.state.country.currency.translation
        ) {
          translation = doc.state.country.currency.translation.find(
            (tr: any) => tr.language == language
          );
          doc.state.country.currency = merge(
            doc.state.country.currency,
            translation
          );
          doc.state.country.currency.translation = undefined;
        }
      }
    }

    if (doc.country && doc.country.translation) {
      translation = doc.country.translation.find(
        (tr: any) => tr.language == language
      );
      doc.country = merge(doc.country, translation);
      doc.country.translation = undefined;

      if (doc.country.currency && doc.country.currency.translation) {
        translation = doc.country.currency.translation.find(
          (tr: any) => tr.language == language
        );
        doc.country.currency = merge(doc.country.currency, translation);
        doc.country.currency.translation = undefined;
      }
    }

    if (doc.currency && doc.currency.translation) {
      translation = doc.currency.translation.find(
        (tr: any) => tr.language == language
      );
      doc.currency = merge(doc.currency, translation);
      doc.currency.translation = undefined;
    }

    return doc;
  }

  static translateDocs(docs: any, language: string) {
    return docs.map((doc: any) => {
      return TranslationService.translate(doc, language);
    });
  }

  static interceptor(language: any, data: any) {
    return data.map((doc: any) => {
      if (!doc) return;

      if (doc && Array.isArray(doc)) {
        return TranslationService.translateDocs(doc, language);
      } else {
        return TranslationService.translate(doc, language);
      }
    });
  }
}

export default TranslationService;
