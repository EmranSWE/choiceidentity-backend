export type CreditRequest = {
  userEmail: string;
}

export type Account = {
  type: string;
  balance: number;
  status: string;
}

export type CreditReport = {
  creditScore: number;
  accounts: Account[];
  inquiries: any[];
  publicRecords: any[];
  riskScore: number;
}
