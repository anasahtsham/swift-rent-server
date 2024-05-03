import { md5 } from "js-md5";
import dotenv from "dotenv";

dotenv.config();

//Securing the password by adding salt and hashing it multiple times
//This will make it difficult for the attacker to crack the password
//The compute needed to crack the password will increase exponentially
//But the cost for the server to authenticate the password will also increase
export function hashPassword(password) {
  let hashedPassword = password + process.env.SALT;
  let salt_rounds = parseInt(process.env.SALT_ROUNDS);
  for (let i = 0; i < salt_rounds; i++) {
    hashedPassword = md5(hashedPassword);
  }
  return hashedPassword;
}
