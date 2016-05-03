import { Accounts } from 'meteor/accounts-base';

export default function configureAccounts() {
  Accounts.config({
    restrictCreationByEmailDomain: "khanacademy.org",
  });
}
