import { Accounts } from 'meteor/accounts-base';

export default function configureAccounts() {
  const emailDomain = Meteor.settings.restrictAccountsToEmailDomain;
  if (emailDomain) {
    Accounts.config({
      restrictCreationByEmailDomain: emailDomain,
    });
  }
}
