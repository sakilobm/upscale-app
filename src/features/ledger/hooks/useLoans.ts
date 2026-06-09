import { useLoansStore, daysUntilPayment, loanProgress } from '@store/loansStore';
import type { LoanType } from '@store/loansStore';

export function useLoans(type?: LoanType) {
  const loans         = useLoansStore((s) => s.loans);
  const addLoan       = useLoansStore((s) => s.addLoan);
  const recordPayment = useLoansStore((s) => s.recordPayment);
  const deleteLoan    = useLoansStore((s) => s.deleteLoan);
  const updateLoan    = useLoansStore((s) => s.updateLoan);

  const filtered = type ? loans.filter((l) => l.type === type) : loans;

  const totalDebt = loans
    .filter((l) => l.type === 'BORROWED')
    .reduce((sum, l) => sum + (l.principalAmount - l.amountPaid), 0);

  const totalLent = loans
    .filter((l) => l.type === 'LENT')
    .reduce((sum, l) => sum + (l.principalAmount - l.amountPaid), 0);

  const upcomingPayments = loans.filter((l) => {
    const days = daysUntilPayment(l);
    return days >= 0 && days <= 7;
  });

  return {
    loans: filtered,
    totalDebt,
    totalLent,
    upcomingPayments,
    addLoan,
    recordPayment,
    deleteLoan,
    updateLoan,
    daysUntilPayment,
    loanProgress,
  };
}
