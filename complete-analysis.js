import { BankStatementAnalyzer } from './analyzer.js';
import fs from 'fs/promises';

async function completeAnalysis() {
  console.log('🚀 COMPLETE ANALYSIS - Account_Statement_8234.pdf');
  
  const analyzer = new BankStatementAnalyzer();
  
  try {
    const analysis = await analyzer.processStatementFile('Account_Statement_8234.pdf');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportId = `complete-8234-${timestamp}`;
    
    await analyzer.saveAnalysis(analysis, `reports/${reportId}.json`);
    
    console.log('\n📊 ANALYSIS COMPLETE');
    console.log(`Account: ${analysis.accountOverview?.accountHolder || 'N/A'}`);
    console.log(`Bank: ${analysis.accountOverview?.bank || 'N/A'}`);
    console.log(`Opening: ₦${(analysis.accountOverview?.openingBalance || 0).toLocaleString()}`);
    console.log(`Closing: ₦${(analysis.accountOverview?.closingBalance || 0).toLocaleString()}`);
    console.log(`Inflows: ₦${(analysis.accountOverview?.totalInflows || 0).toLocaleString()}`);
    console.log(`Outflows: ₦${(analysis.accountOverview?.totalOutflows || 0).toLocaleString()}`);
    console.log(`Risk: ${analysis.riskAssessment?.overallRiskLevel || 'N/A'}`);
    
    console.log(`\n✅ Report saved: reports/${reportId}.json`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

completeAnalysis();