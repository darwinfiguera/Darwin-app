export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  AddTab: undefined;
  Goals: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  AddTransaction: { transactionId?: string } | undefined;
  RedeemCode: undefined;
  Paywall: undefined;
  EditProfile: undefined;
};
