import InquiryService from "services/InquiryService";

export default async () => {
  try {
    await InquiryService.loginAccount(true);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};
