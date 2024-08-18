import { Strategy as AnonymousStrategy } from 'passport-anonymous';

export class AnonymousAuth {
  public static init(_passport: any): any {
    _passport.use(new AnonymousStrategy());
  }
}
