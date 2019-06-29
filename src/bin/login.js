import AccountService from "services/AccountService";

export default async () => {
  await AccountService.login();
};
