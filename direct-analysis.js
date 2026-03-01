import fs from 'fs/promises';

class DirectAnalyzer {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  }

  async analyzePDFDirect(pdfPath) {
    console.log('🚀 Starting direct PDF analysis...');
    
    // Read PDF as base64
    const pdfBuffer = await fs.readFile(pdfPath);
    const base64PDF = pdfBuffer.toString('base64');
    
    const prompt = `Analyze this bank statement PDF thoroughly and provide comprehensive financial analysis.

Extract and analyze:
1. Account information (holder, number, bank, period, balances)
2. All transactions with dates, descriptions, amounts
3. Gambling activities (betting platforms, amounts)
4. Loan transactions (received, disbursed, repayments)
5. Salary/income patterns
6. Spending categories and patterns
7. Risk assessment

Return ONLY valid JSON in this exact format:
{
  "accountOverview": {
    "accountHolder": "string",
    "accountNumber": "string", 
    "bank": "string",
    "statementPeriod": "string",
    "currency": "string",
    "openingBalance": number,
    "totalInflows": number,
    "totalOutflows": number,
    "closingBalance": number,
    "netFlow": number,
    "totalTurnover": number
  },
  "inflowAnalysis": {
    "totalInflows": number,
    "largestCredit": {"amount": number, "description": "string", "date": "string"},
    "majorInflows": [{"amount": number, "description": "string", "date": "string"}],
    "inflowCategories": [{"category": "string", "amount": number, "count": number}]
  },
  "outflowAnalysis": {
    "totalOutflows": number,
    "expenditureBreakdown": [{"category": "string", "amount": number, "percentage": number, "transactions": [{"description": "string", "amount": number, "date": "string"}]}]
  },
  "gamblingAnalysis": {
    "totalGamblingOutflows": number,
    "totalGamblingInflows": number,
    "netGamblingLoss": number,
    "gamblingPlatforms": ["string"],
    "significantTransactions": [{"date": "string", "description": "string", "outflow": number, "inflow": number}],
    "frequency": "string",
    "riskLevel": "string"
  },
  "loanAnalysis": {
    "loansReceived": [{"date": "string", "description": "string", "amount": number, "source": "string"}],
    "loansDisbursed": [{"date": "string", "description": "string", "amount": number, "recipient": "string"}],
    "loanRepayments": [{"date": "string", "description": "string", "amount": number, "recipient": "string"}],
    "totalLoansReceived": number,
    "totalLoansDisbursed": number,
    "totalRepayments": number,
    "outstandingLoans": number
  },
  "salaryAnalysis": {
    "salaryTransactions": [{"date": "string", "description": "string", "amount": number, "employer": "string"}],
    "totalSalaryIncome": number,
    "averageMonthlySalary": number,
    "salaryFrequency": "string",
    "salaryGrowth": "string",
    "salaryToExpenseRatio": number
  },
  "riskAssessment": {
    "gamblingRisk": "string",
    "loanRisk": "string", 
    "cashFlowRisk": "string",
    "overallRiskLevel": "string",
    "riskFactors": ["string"]
  },
  "insights": {
    "keyFindings": ["string"],
    "spendingPatterns": ["string"],
    "recommendations": ["string"],
    "redFlags": ["string"]
  }
}`;

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "application/pdf", data: base64PDF } }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API Response received');
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      console.error('Invalid API response:', JSON.stringify(result, null, 2));
      throw new Error('Invalid API response structure');
    }
    
    const text = result.candidates[0].content.parts[0].text;
    console.log('Parsing AI response...');
    
    // Clean and parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Raw response:', text);
      throw new Error('No JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
  }

  async saveReport(analysis, filename) {
    await fs.writeFile(`reports/${filename}.json`, JSON.stringify(analysis, null, 2));
    
    // Generate simple HTML report
    const html = `<!DOCTYPE html>
<html><head><title>Bank Statement Analysis</title>
<style>body{font-family:Arial;margin:20px}h2{color:#333;border-bottom:2px solid #ddd}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.risk-high{color:red}.risk-medium{color:orange}.risk-low{color:green}</style>
</head><body>
<h1>Bank Statement Analysis Report</h1>

<h2>Account Overview</h2>
<table>
<tr><th>Account Holder</th><td>${analysis.accountOverview.accountHolder}</td></tr>
<tr><th>Account Number</th><td>${analysis.accountOverview.accountNumber}</td></tr>
<tr><th>Bank</th><td>${analysis.accountOverview.bank}</td></tr>
<tr><th>Period</th><td>${analysis.accountOverview.statementPeriod}</td></tr>
<tr><th>Opening Balance</th><td>₦${analysis.accountOverview.openingBalance.toLocaleString()}</td></tr>
<tr><th>Closing Balance</th><td>₦${analysis.accountOverview.closingBalance.toLocaleString()}</td></tr>
<tr><th>Total Inflows</th><td>₦${analysis.accountOverview.totalInflows.toLocaleString()}</td></tr>
<tr><th>Total Outflows</th><td>₦${analysis.accountOverview.totalOutflows.toLocaleString()}</td></tr>
<tr><th>Net Flow</th><td>₦${analysis.accountOverview.netFlow.toLocaleString()}</td></tr>
</table>

<h2>Gambling Analysis</h2>
<table>
<tr><th>Total Gambling Outflows</th><td>₦${analysis.gamblingAnalysis.totalGamblingOutflows.toLocaleString()}</td></tr>
<tr><th>Total Gambling Inflows</th><td>₦${analysis.gamblingAnalysis.totalGamblingInflows.toLocaleString()}</td></tr>
<tr><th>Net Gambling Loss</th><td>₦${analysis.gamblingAnalysis.netGamblingLoss.toLocaleString()}</td></tr>
<tr><th>Risk Level</th><td class="risk-${analysis.gamblingAnalysis.riskLevel.toLowerCase()}">${analysis.gamblingAnalysis.riskLevel}</td></tr>
<tr><th>Platforms</th><td>${analysis.gamblingAnalysis.gamblingPlatforms.join(', ')}</td></tr>
</table>

<h2>Loan Analysis</h2>
<table>
<tr><th>Total Loans Received</th><td>₦${analysis.loanAnalysis.totalLoansReceived.toLocaleString()}</td></tr>
<tr><th>Total Loans Disbursed</th><td>₦${analysis.loanAnalysis.totalLoansDisbursed.toLocaleString()}</td></tr>
<tr><th>Total Repayments</th><td>₦${analysis.loanAnalysis.totalRepayments.toLocaleString()}</td></tr>
<tr><th>Outstanding Loans</th><td>₦${analysis.loanAnalysis.outstandingLoans.toLocaleString()}</td></tr>
</table>

<h2>Salary Analysis</h2>
<table>
<tr><th>Total Salary Income</th><td>₦${analysis.salaryAnalysis.totalSalaryIncome.toLocaleString()}</td></tr>
<tr><th>Average Monthly Salary</th><td>₦${analysis.salaryAnalysis.averageMonthlySalary.toLocaleString()}</td></tr>
<tr><th>Salary Frequency</th><td>${analysis.salaryAnalysis.salaryFrequency}</td></tr>
<tr><th>Salary to Expense Ratio</th><td>${analysis.salaryAnalysis.salaryToExpenseRatio}</td></tr>
</table>

<h2>Risk Assessment</h2>
<table>
<tr><th>Overall Risk</th><td class="risk-${analysis.riskAssessment.overallRiskLevel.toLowerCase()}">${analysis.riskAssessment.overallRiskLevel}</td></tr>
<tr><th>Gambling Risk</th><td class="risk-${analysis.riskAssessment.gamblingRisk.toLowerCase()}">${analysis.riskAssessment.gamblingRisk}</td></tr>
<tr><th>Loan Risk</th><td class="risk-${analysis.riskAssessment.loanRisk.toLowerCase()}">${analysis.riskAssessment.loanRisk}</td></tr>
<tr><th>Cash Flow Risk</th><td class="risk-${analysis.riskAssessment.cashFlowRisk.toLowerCase()}">${analysis.riskAssessment.cashFlowRisk}</td></tr>
</table>

<h2>Key Insights</h2>
<h3>Key Findings</h3>
<ul>${analysis.insights.keyFindings.map(f => `<li>${f}</li>`).join('')}</ul>
<h3>Recommendations</h3>
<ul>${analysis.insights.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
<h3>Red Flags</h3>
<ul>${analysis.insights.redFlags.map(f => `<li style="color:red">${f}</li>`).join('')}</ul>

</body></html>`;
    
    await fs.writeFile(`${filename}-report.html`, html);
  }
}

async function main() {
  const analyzer = new DirectAnalyzer();
  
  try {
    console.log('🚀 Analyzing Account_Statement_8234.pdf...');
    const analysis = await analyzer.analyzePDFDirect('Account_Statement_8234.pdf');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportId = `statement-8234-${timestamp}`;
    
    await analyzer.saveReport(analysis, reportId);
    
    console.log('\n📊 ANALYSIS COMPLETE');
    console.log('=' .repeat(50));
    console.log(`Account: ${analysis.accountOverview.accountHolder}`);
    console.log(`Bank: ${analysis.accountOverview.bank}`);
    console.log(`Period: ${analysis.accountOverview.statementPeriod}`);
    console.log(`Opening Balance: ₦${analysis.accountOverview.openingBalance.toLocaleString()}`);
    console.log(`Closing Balance: ₦${analysis.accountOverview.closingBalance.toLocaleString()}`);
    console.log(`Total Inflows: ₦${analysis.accountOverview.totalInflows.toLocaleString()}`);
    console.log(`Total Outflows: ₦${analysis.accountOverview.totalOutflows.toLocaleString()}`);
    console.log(`Net Flow: ₦${analysis.accountOverview.netFlow.toLocaleString()}`);
    
    console.log('\n🎰 GAMBLING ANALYSIS:');
    console.log(`Gambling Outflows: ₦${analysis.gamblingAnalysis.totalGamblingOutflows.toLocaleString()}`);
    console.log(`Gambling Inflows: ₦${analysis.gamblingAnalysis.totalGamblingInflows.toLocaleString()}`);
    console.log(`Net Gambling Loss: ₦${analysis.gamblingAnalysis.netGamblingLoss.toLocaleString()}`);
    console.log(`Risk Level: ${analysis.gamblingAnalysis.riskLevel}`);
    
    console.log('\n💰 LOAN ANALYSIS:');
    console.log(`Loans Received: ₦${analysis.loanAnalysis.totalLoansReceived.toLocaleString()}`);
    console.log(`Loans Disbursed: ₦${analysis.loanAnalysis.totalLoansDisbursed.toLocaleString()}`);
    console.log(`Repayments: ₦${analysis.loanAnalysis.totalRepayments.toLocaleString()}`);
    
    console.log('\n💼 SALARY ANALYSIS:');
    console.log(`Total Salary: ₦${analysis.salaryAnalysis.totalSalaryIncome.toLocaleString()}`);
    console.log(`Monthly Average: ₦${analysis.salaryAnalysis.averageMonthlySalary.toLocaleString()}`);
    
    console.log('\n⚠️ OVERALL RISK:', analysis.riskAssessment.overallRiskLevel);
    
    console.log(`\n✅ Reports saved:`);
    console.log(`📄 HTML: ${reportId}-report.html`);
    console.log(`📊 JSON: reports/${reportId}.json`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

main();