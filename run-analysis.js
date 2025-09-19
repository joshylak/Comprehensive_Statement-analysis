import { BankStatementAnalyzer } from './analyzer.js';
import { ReportGenerator } from './report-generator.js';

async function runAnalysis() {
  const analyzer = new BankStatementAnalyzer('bankstatement-468307');
  
  try {
    console.log('Starting comprehensive bank statement analysis...');
    
    // Change this to your PDF file path
    const analysis = await analyzer.processStatementFile('statement.pdf');
    await analyzer.saveAnalysis(analysis, 'analysis-output.json');
    
    await ReportGenerator.saveHTMLReport(analysis, 'comprehensive-report.html');
    
    console.log('✓ Analysis completed successfully');
    console.log('✓ JSON output saved to: analysis-output.json');
    console.log('✓ HTML report saved to: comprehensive-report.html');
    
    // Display key metrics
    console.log('\n--- KEY FINDINGS ---');
    console.log(`Gambling Risk Level: ${analysis.gamblingAnalysis?.riskLevel || 'N/A'}`);
    console.log(`Total Loans Received: ${analysis.loanAnalysis?.totalLoansReceived || 0}`);
    console.log(`Monthly Salary Average: ${analysis.salaryAnalysis?.averageMonthlySalary || 0}`);
    console.log(`Overall Risk Assessment: ${analysis.riskAssessment?.overallRiskLevel || 'N/A'}`);
    
  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

runAnalysis();