import InquiryService from "services/InquiryService";

export default async () => {
  await InquiryService.loginAccount(true);
};
