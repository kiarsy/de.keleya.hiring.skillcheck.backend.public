import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
export class HashPassword {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltOrRounds);
  };

  static  hashPasswordSync(password: string): string {
    return bcrypt.hashSync(password, saltOrRounds);
  };

  static async matchHashedPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  };

}
