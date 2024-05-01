import { md5 } from "js-md5";
import dotenv from "dotenv";

dotenv.config();

export function hashPassword(password) {
  let hashedPassword = password + process.env.SALT;
  for (let i = 0; i < 10; i++) {
    hashedPassword = md5(hashedPassword);
  }
  return hashedPassword;
}
