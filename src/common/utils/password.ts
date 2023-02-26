import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
export class HashPassword {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltOrRounds);
  }

  static hashPasswordSync(password: string): string {
    return bcrypt.hashSync(password, saltOrRounds);
  }

  static matchHashedPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }
}
