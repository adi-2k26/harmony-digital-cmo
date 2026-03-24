type BudgetState = {
  dailyCap: number;
  used: number;
};

const budget: BudgetState = {
  dailyCap: Number(process.env.TOKEN_DAILY_CAP ?? 250000),
  used: 0
};

export function canSpendTokens(amount: number) {
  return budget.used + amount <= budget.dailyCap;
}

export function recordTokenSpend(amount: number) {
  if (canSpendTokens(amount)) {
    budget.used += amount;
    return true;
  }
  return false;
}

export function budgetStatus() {
  return {
    cap: budget.dailyCap,
    used: budget.used,
    remaining: Math.max(0, budget.dailyCap - budget.used)
  };
}
