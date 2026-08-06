import { API_CONFIG } from '../config/api-config.js?v=12.0.0';
import { MockFinanceAdapter } from '../adapters/mock-finance-adapter.js?v=12.0.0';
import { AppsScriptFinanceAdapter } from '../adapters/apps-script-finance-adapter.js?v=12.0.0';
import { FirebaseFinanceAdapter } from '../adapters/firebase-finance-adapter.js?v=12.0.0';

function adapter() {
  if (API_CONFIG.financeMode === 'apps-script') return AppsScriptFinanceAdapter;
  if (API_CONFIG.financeMode === 'firebase') return FirebaseFinanceAdapter;
  return MockFinanceAdapter;
}

export const FinanceService = {
  mode: API_CONFIG.financeMode || 'mock',
  getProjectFinance: options => adapter().getProjectFinance(options),
  updateSettings: options => adapter().updateSettings(options),
  createIncome: options => adapter().createIncome(options),
  updateIncome: options => adapter().updateIncome(options),
  voidIncome: options => adapter().voidIncome(options),
  createCost: options => adapter().createCost(options),
  updateCost: options => adapter().updateCost(options),
  deleteCost: options => adapter().deleteCost(options),
  createTimeEntry: options => adapter().createTimeEntry(options),
  updateTimeEntry: options => adapter().updateTimeEntry(options),
  deleteTimeEntry: options => adapter().deleteTimeEntry(options),
  updateMemberRate: options => adapter().updateMemberRate(options),
  subscribe: listener => adapter().subscribe(listener),
  resetDemo: () => adapter().resetDemo()
};
