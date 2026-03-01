import { BankStatementAnalyzer } from './analyzer.js';
import { ReportGenerator } from './report-generator.js';
import fs from 'fs/promises';

async function analyzeStatement8234() {
  console.log('🚀 Starting analysis of Account_Statement_8234.pdf');
  console.log('=' .repeat(60));
  
  const analyzer = new BankStatementAnalyzer();
  
  try {
    // Process the PDF file
    const analysis = await analyzer.processStatementFile('Account_Statement_8234.pdf');
    
    // Generate timestamp for unique filenames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportId = `statement-8234-${timestamp}`;
    
    // Save JSON analysis
    const jsonPath = `reports/${reportId}.json`;
    await analyzer.saveAnalysis(analysis, jsonPath);
    console.log(`✅ JSON analysis saved to: ${jsonPath}`);
    
    // Generate HTML report
    const htmlPath = `${reportId}-report.html`;
    await ReportGenerator.saveHTMLReport(analysis, htmlPath);
    console.log(`✅ HTML report saved to: ${htmlPath}`);
    
    // Display comprehensive summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 COMPREHENSIVE ANALYSIS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log('\n🏦 ACCOUNT OVERVIEW:');
    console.log(`Account Holder: ${analysis.accountOverview?.accountHolder || 'N/A'}`);
    console.log(`Account Number: ${analysis.accountOverview?.accountNumber || 'N/A'}`);
    console.log(`Bank: ${analysis.accountOverview?.bank || 'N/A'}`);
    console.log(`Statement Period: ${analysis.accountOverview?.statementPeriod || 'N/A'}`);
    console.log(`Opening Balance: ₦${(analysis.accountOverview?.openingBalance || 0).toLocaleString()}`);
    console.log(`Closing Balance: ₦${(analysis.accountOverview?.closingBalance || 0).toLocaleString()}`);
    console.log(`Total Inflows: ₦${(analysis.accountOverview?.totalInflows || 0).toLocaleString()}`);
    console.log(`Total Outflows: ₦${(analysis.accountOverview?.totalOutflows || 0).toLocaleString()}`);
    console.log(`Net Flow: ₦${(analysis.accountOverview?.netFlow || 0).toLocaleString()}`);
    
    console.log('\n🎰 GAMBLING ANALYSIS:');
    console.log(`Total Gambling Outflows: ₦${(analysis.gamblingAnalysis?.totalGamblingOutflows || 0).toLocaleString()}`);
    console.log(`Total Gambling Inflows: ₦${(analysis.gamblingAnalysis?.totalGamblingInflows || 0).toLocaleString()}`);
    console.log(`Net Gambling Loss: ₦${(analysis.gamblingAnalysis?.netGamblingLoss || 0).toLocaleString()}`);
    console.log(`Gambling Risk Level: ${analysis.gamblingAnalysis?.riskLevel || 'N/A'}`);
    console.log(`Gambling Platforms: ${analysis.gamblingAnalysis?.gamblingPlatforms?.join(', ') || 'None detected'}`);
    
    console.log('\n💰 LOAN ANALYSIS:');
    console.log(`Total Loans Received: ₦${(analysis.loanAnalysis?.totalLoansReceived || 0).toLocaleString()}`);
    console.log(`Total Loans Disbursed: ₦${(analysis.loanAnalysis?.totalLoansDisbursed || 0).toLocaleString()}`);
    console.log(`Total Repayments: ₦${(analysis.loanAnalysis?.totalRepayments || 0).toLocaleString()}`);
    console.log(`Outstanding Loans: ₦${(analysis.loanAnalysis?.outstandingLoans || 0).toLocaleString()}`);
    
    console.log('\n💼 SALARY ANALYSIS:');
    console.log(`Total Salary Income: ₦${(analysis.salaryAnalysis?.totalSalaryIncome || 0).toLocaleString()}`);
    console.log(`Average Monthly Salary: ₦${(analysis.salaryAnalysis?.averageMonthlySalary || 0).toLocaleString()}`);
    console.log(`Salary Frequency: ${analysis.salaryAnalysis?.salaryFrequency || 'N/A'}`);
    console.log(`Salary to Expense Ratio: ${analysis.salaryAnalysis?.salaryToExpenseRatio || 0}`);
    
    console.log('\n⚠️ RISK ASSESSMENT:');
    console.log(`Overall Risk Level: ${analysis.riskAssessment?.overallRiskLevel || 'N/A'}`);
    console.log(`Gambling Risk: ${analysis.riskAssessment?.gamblingRisk || 'N/A'}`);
    console.log(`Loan Risk: ${analysis.riskAssessment?.loanRisk || 'N/A'}`);
    console.log(`Cash Flow Risk: ${analysis.riskAssessment?.cashFlowRisk || 'N/A'}`);
    
    if (analysis.riskAssessment?.riskFactors?.length > 0) {
      console.log('\n🚨 RISK FACTORS:');
      analysis.riskAssessment.riskFactors.forEach((factor, index) => {
        console.log(`${index + 1}. ${factor}`);
      });
    }
    
    console.log('\n💡 KEY INSIGHTS:');
    if (analysis.insights?.keyFindings?.length > 0) {
      console.log('\n📋 Key Findings:');
      analysis.insights.keyFindings.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding}`);
      });
    }
    
    if (analysis.insights?.recommendations?.length > 0) {
      console.log('\n📝 Recommendations:');
      analysis.insights.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    if (analysis.insights?.redFlags?.length > 0) {
      console.log('\n🚩 Red Flags:');
      analysis.insights.redFlags.forEach((flag, index) => {
        console.log(`${index + 1}. ${flag}`);
      });
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ ANALYSIS COMPLETED SUCCESSFULLY');
    console.log(`📄 View detailed HTML report: ${htmlPath}`);
    console.log(`📊 View JSON data: ${jsonPath}`);
    console.log('=' .repeat(60));
    
    return analysis;
    
  } catch (error) {
    console.error('\n❌ ANALYSIS FAILED:');
    console.error(`Error: ${error.message}`);
    console.error('\nPlease check:');
    console.error('1. PDF file exists and is readable');
    console.error('2. Python dependencies are installed');
    console.error('3. Gemini API key is valid');
    console.error('4. Internet connection is stable');
    throw error;
  }
}

// Run the analysis
analyzeStatement8234().catch(console.error);