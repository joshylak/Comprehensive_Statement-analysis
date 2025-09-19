import fs from 'fs/promises';

class ReportGenerator {
  static formatCurrency(amount, currency = 'NGN') {
    const symbol = currency === 'NGN' ? '₦' : '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  static generateHTMLReport(analysis) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Bank Statement Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .table { border-collapse: collapse; width: 100%; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .risk-high { color: #d32f2f; font-weight: bold; }
        .risk-medium { color: #f57c00; font-weight: bold; }
        .risk-low { color: #388e3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Bank Statement Analysis Report</h1>
        <h2>1. Account Overview</h2>
        <p><strong>Account Holder:</strong> ${analysis.accountOverview.accountHolder}</p>
        <p><strong>Account Number:</strong> ${analysis.accountOverview.accountNumber}</p>
        <p><strong>Bank:</strong> ${analysis.accountOverview.bank}</p>
        <p><strong>Statement Period:</strong> ${analysis.accountOverview.statementPeriod}</p>
        <p><strong>Currency:</strong> ${analysis.accountOverview.currency}</p>
        
        <table class="table">
            <tr><th>Financial Metric</th><th>Amount</th></tr>
            <tr><td>Opening Balance</td><td>${this.formatCurrency(analysis.accountOverview.openingBalance)}</td></tr>
            <tr><td>Total Inflows</td><td>${this.formatCurrency(analysis.accountOverview.totalInflows)}</td></tr>
            <tr><td>Total Outflows</td><td>${this.formatCurrency(analysis.accountOverview.totalOutflows)}</td></tr>
            <tr><td>Closing Balance</td><td>${this.formatCurrency(analysis.accountOverview.closingBalance)}</td></tr>
            <tr><td>Net Flow</td><td>${this.formatCurrency(analysis.accountOverview.netFlow)}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>2. Gambling Transaction Analysis</h2>
        <p><strong>Total Gambling Outflows:</strong> ${this.formatCurrency(analysis.gamblingAnalysis.totalGamblingOutflows)}</p>
        <p><strong>Total Gambling Inflows:</strong> ${this.formatCurrency(analysis.gamblingAnalysis.totalGamblingInflows)}</p>
        <p><strong>Net Gambling Loss:</strong> ${this.formatCurrency(analysis.gamblingAnalysis.netGamblingLoss)}</p>
        <p><strong>Risk Level:</strong> <span class="risk-${analysis.gamblingAnalysis.riskLevel.toLowerCase()}">${analysis.gamblingAnalysis.riskLevel}</span></p>
        
        <h3>Significant Gambling Transactions</h3>
        <table class="table">
            <tr><th>Date</th><th>Description</th><th>Outflow</th><th>Inflow</th></tr>
            ${analysis.gamblingAnalysis.significantTransactions.map(t => 
                `<tr><td>${t.date}</td><td>${t.description}</td><td>${this.formatCurrency(t.outflow || 0)}</td><td>${this.formatCurrency(t.inflow || 0)}</td></tr>`
            ).join('')}
        </table>
    </div>

    <div class="section">
        <h2>3. Loan Activity Analysis</h2>
        <p><strong>Total Loans Received:</strong> ${this.formatCurrency(analysis.loanAnalysis.totalLoansReceived)}</p>
        <p><strong>Total Loans Disbursed:</strong> ${this.formatCurrency(analysis.loanAnalysis.totalLoansDisbursed)}</p>
        <p><strong>Total Repayments:</strong> ${this.formatCurrency(analysis.loanAnalysis.totalRepayments)}</p>
        
        <h3>Loans Received</h3>
        <table class="table">
            <tr><th>Date</th><th>Description</th><th>Amount</th><th>Source</th></tr>
            ${analysis.loanAnalysis.loansReceived.map(l => 
                `<tr><td>${l.date}</td><td>${l.description}</td><td>${this.formatCurrency(l.amount)}</td><td>${l.source}</td></tr>`
            ).join('')}
        </table>
    </div>

    <div class="section">
        <h2>4. Salary Analysis</h2>
        <p><strong>Total Salary Income:</strong> ${this.formatCurrency(analysis.salaryAnalysis.totalSalaryIncome)}</p>
        <p><strong>Average Monthly Salary:</strong> ${this.formatCurrency(analysis.salaryAnalysis.averageMonthlySalary)}</p>
        <p><strong>Salary Frequency:</strong> ${analysis.salaryAnalysis.salaryFrequency}</p>
        <p><strong>Salary to Expense Ratio:</strong> ${(analysis.salaryAnalysis.salaryToExpenseRatio * 100).toFixed(1)}%</p>
    </div>

    <div class="section">
        <h2>5. Risk Assessment</h2>
        <p><strong>Overall Risk Level:</strong> <span class="risk-${analysis.riskAssessment.overallRiskLevel.toLowerCase()}">${analysis.riskAssessment.overallRiskLevel}</span></p>
        <ul>
            ${analysis.riskAssessment.riskFactors.map(factor => `<li>${factor}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>6. Key Insights & Recommendations</h2>
        <h3>Key Findings:</h3>
        <ul>${analysis.insights.keyFindings.map(finding => `<li>${finding}</li>`).join('')}</ul>
        
        <h3>Recommendations:</h3>
        <ul>${analysis.insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
    </div>
</body>
</html>`;
  }

  static async saveHTMLReport(analysis, outputPath) {
    const html = this.generateHTMLReport(analysis);
    await fs.writeFile(outputPath, html);
  }
}

export { ReportGenerator };