import { BankStatementAnalyzer } from './analyzer.js';
import { ReportGenerator } from './report-generator.js';

async function runFixedAnalysis() {
  console.log('🚀 Running FIXED analysis of Account_Statement_8234.pdf');
  console.log('=' .repeat(60));
  
  const analyzer = new BankStatementAnalyzer();
  
  try {
    const analysis = await analyzer.processStatementFile('Account_Statement_8234.pdf');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportId = `fixed-8234-${timestamp}`;
    
    await analyzer.saveAnalysis(analysis, `reports/${reportId}.json`);
    await ReportGenerator.saveHTMLReport(analysis, `${reportId}-report.html`);
    
    console.log('\n📊 FIXED ANALYSIS COMPLETE');
    console.log('=' .repeat(60));
    console.log(`🏦 Account: ${analysis.accountOverview?.accountHolder || 'N/A'}`);
    console.log(`💰 Opening: ₦${(analysis.accountOverview?.openingBalance || 0).toLocaleString()}`);
    console.log(`💰 Closing: ₦${(analysis.accountOverview?.closingBalance || 0).toLocaleString()}`);
    console.log(`📈 Inflows: ₦${(analysis.accountOverview?.totalInflows || 0).toLocaleString()}`);
    console.log(`📉 Outflows: ₦${(analysis.accountOverview?.totalOutflows || 0).toLocaleString()}`);
    console.log(`🎰 Gambling Loss: ₦${(analysis.gamblingAnalysis?.netGamblingLoss || 0).toLocaleString()}`);
    console.log(`💰 Outstanding Loans: ₦${(analysis.loanAnalysis?.outstandingLoans || 0).toLocaleString()}`);
    console.log(`⚠️ Risk Level: ${analysis.riskAssessment?.overallRiskLevel || 'N/A'}`);
    
    console.log('\n✅ REPORTS GENERATED:');
    console.log(`📄 HTML: ${reportId}-report.html`);
    console.log(`📊 JSON: reports/${reportId}.json`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

runFixedAnalysis();