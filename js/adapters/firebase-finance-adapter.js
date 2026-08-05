function notConfigured() {
  throw new Error('El adaptador financiero todavía no está configurado. Mantén financeMode en mock.');
}

export const FirebaseFinanceAdapter = {
  getProjectFinance: notConfigured,
  updateSettings: notConfigured,
  createIncome: notConfigured,
  updateIncome: notConfigured,
  voidIncome: notConfigured,
  createCost: notConfigured,
  updateCost: notConfigured,
  deleteCost: notConfigured,
  createTimeEntry: notConfigured,
  updateTimeEntry: notConfigured,
  deleteTimeEntry: notConfigured,
  updateMemberRate: notConfigured,
  subscribe: () => () => {},
  resetDemo: notConfigured
};
