import fs from 'fs/promises';

class FinalAnalyzer {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  }

  async analyzeExtractedData() {
    const csvData = await fs.readFile('conversion-results/Account_Statement_8234_2025-09-19T10-58-28-594Z.csv', 'utf8');
    
    const prompt = `Analyze this bank statement data extracted from PDF:

${csvData}

This is real bank statement data from Fidelity Bank for account 5210068234 (BROADFUX AUTOS).
Period: 18 June 2025 to 22 September 2025
Opening Balance: 263,059.19 NGN

Analyze all transactions and provide comprehensive analysis in JSON format:

{
  "accountOverview": {
    "accountHolder": "BROADFUX AUTOS",
    "accountNumber": "5210068234",
    "bank": "Fidelity Bank",
    "statementPeriod": "18 June 2025 to 22 September 2025",
    "currency": "NGN",
    "openingBalance": 263059.19,
    "totalInflows": 0,
    "totalOutflows": 0,
    "closingBalance": 0,
    "netFlow": 0,
    "totalTurnover": 0
  },
  "inflowAnalysis": {
    "totalInflows": 0,
    "largestCredit": {"amount": 0, "description": "", "date": ""},
    "majorInflows": [],
    "inflowCategories": []
  },
  "outflowAnalysis": {
    "totalOutflows": 0,
    "expenditureBreakdown": []
  },
  "gamblingAnalysis": {
    "totalGamblingOutflows": 0,
    "totalGamblingInflows": 0,
    "netGamblingLoss": 0,
    "gamblingPlatforms": [],
    "significantTransactions": [],
    "frequency": "None detected",
    "riskLevel": "Low"
  },
  "loanAnalysis": {
    "loansReceived": [],
    "loansDisbursed": [],
    "loanRepayments": [],
    "totalLoansReceived": 0,
    "totalLoansDisbursed": 0,
    "totalRepayments": 0,
    "outstandingLoans": 0
  },
  "salaryAnalysis": {
    "salaryTransactions": [],
    "totalSalaryIncome": 0,
    "averageMonthlySalary": 0,
    "salaryFrequency": "None detected",
    "salaryGrowth": "N/A",
    "salaryToExpenseRatio": 0
  },
  "riskAssessment": {
    "gamblingRisk": "Low",
    "loanRisk": "Low",
    "cashFlowRisk": "Low",
    "overallRiskLevel": "Low",
    "riskFactors": []
  },
  "insights": {
    "keyFindings": [],
    "spendingPatterns": [],
    "recommendations": [],
    "redFlags": []
  }
}

Calculate actual amounts from the transaction data. Focus on business transactions, transfers, and any patterns.`;

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
      })
    });

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  }

  async generateReport(analysis) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportId = `final-8234-${timestamp}`;
    
    await fs.writeFile(`reports/${reportId}.json`, JSON.stringify(analysis, null, 2));
    
    const html = `<!DOCTYPE html>
<html><head><title>Bank Statement Analysis - BROADFUX AUTOS</title>
<style>
body{font-family:Arial;margin:20px;background:#f5f5f5}
.container{max-width:1200px;margin:0 auto;background:white;padding:20px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}
h1{color:#2c3e50;text-align:center;border-bottom:3px solid #3498db;padding-bottom:10px}
.overview{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;margin:20px 0}
.card{background:#f8f9fa;padding:15px;border-radius:5px;border-left:4px solid #3498db}
.card h3{margin:0 0 10px 0;color:#2c3e50}
.card .amount{font-size:1.2em;font-weight:bold;color:#27ae60}
.negative{color:#e74c3c !important}
table{width:100%;border-collapse:collapse;margin:15px 0}
th,td{border:1px solid #ddd;padding:12px;text-align:left}
th{background:#34495e;color:white}
tr:nth-child(even){background:#f8f9fa}
</style>
</head><body>
<div class="container">
<h1>🏦 Bank Statement Analysis - BROADFUX AUTOS</h1>
<p style="text-align:center;color:#7f8c8d">Account: ${analysis.accountOverview.accountNumber} | ${analysis.accountOverview.statementPeriod}</p>

<div class="overview">
<div class="card">
<h3>💰 Opening Balance</h3>
<div class="amount">₦${analysis.accountOverview.openingBalance.toLocaleString()}</div>
</div>
<div class="card">
<h3>📈 Total Inflows</h3>
<div class="amount">₦${analysis.accountOverview.totalInflows.toLocaleString()}</div>
</div>
<div class="card">
<h3>📉 Total Outflows</h3>
<div class="amount negative">₦${analysis.accountOverview.totalOutflows.toLocaleString()}</div>
</div>
<div class="card">
<h3>💵 Net Flow</h3>
<div class="amount ${analysis.accountOverview.netFlow >= 0 ? '' : 'negative'}">₦${analysis.accountOverview.netFlow.toLocaleString()}</div>
</div>
</div>

<h2>📊 Key Insights</h2>
<ul>
${analysis.insights.keyFindings.map(f => `<li>${f}</li>`).join('')}
</ul>

<h2>📝 Recommendations</h2>
<ul>
${analysis.insights.recommendations.map(r => `<li>${r}</li>`).join('')}
</ul>

<p style="margin-top:40px;text-align:center;color:#7f8c8d">
Report Generated: ${new Date().toLocaleString()}
</p>

</div>
</body></html>`;
    
    await fs.writeFile(`${reportId}-report.html`, html);
    return reportId;
  }
}

async function main() {
  const analyzer = new FinalAnalyzer();
  
  try {
    console.log('🚀 Running FINAL analysis with extracted data...');
    const analysis = await analyzer.analyzeExtractedData();
    const reportId = await analyzer.generateReport(analysis);
    
    console.log('\n📊 FINAL ANALYSIS COMPLETE');
    console.log('=' .repeat(60));
    console.log(`🏦 Account: ${analysis.accountOverview.accountHolder}`);
    console.log(`🏛️ Bank: ${analysis.accountOverview.bank}`);
    console.log(`📅 Period: ${analysis.accountOverview.statementPeriod}`);
    console.log(`💰 Opening Balance: ₦${analysis.accountOverview.openingBalance.toLocaleString()}`);
    console.log(`📈 Total Inflows: ₦${analysis.accountOverview.totalInflows.toLocaleString()}`);
    console.log(`📉 Total Outflows: ₦${analysis.accountOverview.totalOutflows.toLocaleString()}`);
    console.log(`💵 Net Flow: ₦${analysis.accountOverview.netFlow.toLocaleString()}`);
    console.log(`⚠️ Risk Level: ${analysis.riskAssessment.overallRiskLevel}`);
    
    console.log('\n✅ REPORTS GENERATED:');
    console.log(`📄 HTML: ${reportId}-report.html`);
    console.log(`📊 JSON: reports/${reportId}.json`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

main();