import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';

class BankStatementAnalyzer {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async analyzeStatement(statementData) {
    // Check if transactions exceed 30 and need chunking
    if (statementData.transactions && statementData.transactions.length > 30) {
      return await this.analyzeStatementInChunks(statementData);
    }

    const prompt = `Analyze this bank statement data and provide a comprehensive analysis following the template format:

${JSON.stringify(statementData, null, 2)}

Return analysis in this exact JSON format:
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
    "expenditureBreakdown": [
      {"category": "string", "amount": number, "percentage": number, "transactions": [{"description": "string", "amount": number, "date": "string"}]}
    ]
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

    const result = await this.model.generateContent(prompt);
    const response = result.response.candidates[0].content.parts[0].text;
    
    try {
      return JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
    } catch {
      return { error: "Failed to parse analysis", rawResponse: response };
    }
  }

  async analyzeStatementInChunks(statementData) {
    console.log('🔄 CHUNKED ANALYSIS: Large dataset detected, processing in chunks');
    
    const transactions = statementData.transactions;
    const chunks = [];
    
    // Split transactions into chunks of 30
    for (let i = 0; i < transactions.length; i += 30) {
      chunks.push(transactions.slice(i, i + 30));
    }
    
    console.log(`📊 Split ${transactions.length} transactions into ${chunks.length} chunks of 30`);

    const chunkAnalyses = [];
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkData = {
        ...statementData,
        transactions: chunks[i]
      };
      
      console.log(`🔄 Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} transactions)`);
      const analysis = await this.analyzeStatement(chunkData);
      console.log(`✅ Chunk ${i + 1} analysis completed`);
      chunkAnalyses.push(analysis);
    }

    console.log('🔄 Merging all chunk analyses into final result...');
    const mergedResult = this.mergeChunkAnalyses(chunkAnalyses, statementData);
    console.log('✅ CHUNKED ANALYSIS COMPLETED - All chunks merged successfully');
    
    return mergedResult;
  }

  mergeChunkAnalyses(chunkAnalyses, originalData) {
    const merged = {
      accountOverview: {
        accountHolder: chunkAnalyses[0]?.accountOverview?.accountHolder || "",
        accountNumber: chunkAnalyses[0]?.accountOverview?.accountNumber || "",
        bank: chunkAnalyses[0]?.accountOverview?.bank || "",
        statementPeriod: chunkAnalyses[0]?.accountOverview?.statementPeriod || "",
        currency: chunkAnalyses[0]?.accountOverview?.currency || "",
        openingBalance: originalData.accountInfo?.openingBalance || 0,
        totalInflows: 0,
        totalOutflows: 0,
        closingBalance: originalData.accountInfo?.closingBalance || 0,
        netFlow: 0,
        totalTurnover: 0
      },
      inflowAnalysis: { totalInflows: 0, largestCredit: null, majorInflows: [], inflowCategories: [] },
      outflowAnalysis: { totalOutflows: 0, expenditureBreakdown: [] },
      gamblingAnalysis: { totalGamblingOutflows: 0, totalGamblingInflows: 0, netGamblingLoss: 0, gamblingPlatforms: [], significantTransactions: [], frequency: "", riskLevel: "" },
      loanAnalysis: { loansReceived: [], loansDisbursed: [], loanRepayments: [], totalLoansReceived: 0, totalLoansDisbursed: 0, totalRepayments: 0, outstandingLoans: 0 },
      salaryAnalysis: { salaryTransactions: [], totalSalaryIncome: 0, averageMonthlySalary: 0, salaryFrequency: "", salaryGrowth: "", salaryToExpenseRatio: 0 },
      riskAssessment: { gamblingRisk: "", loanRisk: "", cashFlowRisk: "", overallRiskLevel: "", riskFactors: [] },
      insights: { keyFindings: [], spendingPatterns: [], recommendations: [], redFlags: [] }
    };

    // Merge data from all chunks
    chunkAnalyses.forEach(analysis => {
      if (!analysis || analysis.error) return;
      
      // Sum totals
      merged.accountOverview.totalInflows += analysis.accountOverview?.totalInflows || 0;
      merged.accountOverview.totalOutflows += analysis.accountOverview?.totalOutflows || 0;
      merged.inflowAnalysis.totalInflows += analysis.inflowAnalysis?.totalInflows || 0;
      merged.outflowAnalysis.totalOutflows += analysis.outflowAnalysis?.totalOutflows || 0;
      
      // Merge arrays
      if (analysis.inflowAnalysis?.majorInflows) merged.inflowAnalysis.majorInflows.push(...analysis.inflowAnalysis.majorInflows);
      if (analysis.outflowAnalysis?.expenditureBreakdown) merged.outflowAnalysis.expenditureBreakdown.push(...analysis.outflowAnalysis.expenditureBreakdown);
      if (analysis.gamblingAnalysis?.significantTransactions) merged.gamblingAnalysis.significantTransactions.push(...analysis.gamblingAnalysis.significantTransactions);
      if (analysis.loanAnalysis?.loansReceived) merged.loanAnalysis.loansReceived.push(...analysis.loanAnalysis.loansReceived);
      if (analysis.salaryAnalysis?.salaryTransactions) merged.salaryAnalysis.salaryTransactions.push(...analysis.salaryAnalysis.salaryTransactions);
      
      // Merge gambling totals
      merged.gamblingAnalysis.totalGamblingOutflows += analysis.gamblingAnalysis?.totalGamblingOutflows || 0;
      merged.gamblingAnalysis.totalGamblingInflows += analysis.gamblingAnalysis?.totalGamblingInflows || 0;
      
      // Merge loan totals
      merged.loanAnalysis.totalLoansReceived += analysis.loanAnalysis?.totalLoansReceived || 0;
      merged.loanAnalysis.totalLoansDisbursed += analysis.loanAnalysis?.totalLoansDisbursed || 0;
      
      // Merge salary totals
      merged.salaryAnalysis.totalSalaryIncome += analysis.salaryAnalysis?.totalSalaryIncome || 0;
    });

    // Calculate derived values
    merged.accountOverview.netFlow = merged.accountOverview.totalInflows - merged.accountOverview.totalOutflows;
    merged.accountOverview.totalTurnover = merged.accountOverview.totalInflows + merged.accountOverview.totalOutflows;
    merged.gamblingAnalysis.netGamblingLoss = merged.gamblingAnalysis.totalGamblingOutflows - merged.gamblingAnalysis.totalGamblingInflows;
    
    // Set risk levels based on merged data
    merged.gamblingAnalysis.riskLevel = merged.gamblingAnalysis.totalGamblingOutflows > 1000 ? "High" : merged.gamblingAnalysis.totalGamblingOutflows > 500 ? "Medium" : "Low";
    merged.riskAssessment.overallRiskLevel = merged.gamblingAnalysis.riskLevel;

    return merged;
  }

  async processStatementFile(filePath) {
    console.log('🚀 STARTING STATEMENT FILE ANALYSIS');
    console.log(`📁 Input file: ${filePath}`);
    
    if (filePath.endsWith('.pdf')) {
      console.log('📄 File type: PDF - Using PDF processing pipeline');
      return await this.processPDFStatement(filePath);
    }
    
    console.log('📊 File type: JSON - Using direct JSON analysis');
    console.log('📖 Reading JSON file...');
    
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    console.log(`✅ JSON file loaded successfully`);
    console.log(`📈 Found ${data.transactions?.length || 0} transactions`);
    
    return await this.analyzeStatement(data);
  }

  async processPDFStatement(pdfPath) {
    console.log('🚀 STARTING PDF STATEMENT ANALYSIS PROCESS');
    console.log(`📁 Input file: ${pdfPath}`);
    console.log('=' .repeat(60));
    
    // First extract text using Python parser
    const extractedText = await this.extractTextWithPythonParser(pdfPath);
    
    if (extractedText.includes('failed')) {
      console.error('❌ PDF parsing failed, cannot proceed with analysis');
      throw new Error('PDF parsing failed');
    }
    
    // The Python parser already provides structured text data
    
    console.log('🔄 STEP 2: Preparing AI analysis prompt');
    console.log(`📊 Text data prepared for AI analysis (${extractedText.length} characters)`);
    
    const prompt = `You are a professional financial analyst. Analyze this bank statement text thoroughly and provide a comprehensive, accurate analysis. The text has been extracted and structured using advanced parsing.

BANK STATEMENT TEXT:
${extractedText}

Analyze the above bank statement text and provide detailed analysis.

IMPORTANT INSTRUCTIONS:
1. Calculate ALL totals accurately by summing individual transactions
2. Identify ALL gambling transactions (Sporty Bet, betting platforms) - calculate exact amounts
3. Find ALL loan transactions (received, disbursed, repayments) - include interest payments
4. Identify salary/income patterns - look for regular deposits from employers
5. Categorize ALL expenses properly (vehicles, electronics, food, utilities, etc.)
6. Provide detailed risk assessment based on actual transaction patterns
7. Give specific insights and recommendations based on the data
8. DO NOT use null values - calculate actual numbers from the transactions
9. Parse transaction data carefully from the structured text format
10. Extract account information from the parsed text data

Return analysis in this exact JSON format with ALL fields populated. DO NOT include comments or explanations in the JSON response:
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
    "expenditureBreakdown": [
      {"category": "string", "amount": number, "percentage": number, "transactions": [{"description": "string", "amount": number, "date": "string"}]}
    ]
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
    "gamblingRisk": "High|Medium|Low",
    "loanRisk": "High|Medium|Low",
    "cashFlowRisk": "High|Medium|Low",
    "overallRiskLevel": "High|Medium|Low",
    "riskFactors": ["string"]
  },
  "insights": {
    "keyFindings": ["string"],
    "spendingPatterns": ["string"],
    "recommendations": ["string"],
    "redFlags": ["string"]
  }
}`;

    console.log('🤖 STEP 3: Sending data to Gemini AI for analysis');
    console.log('⏳ Waiting for AI response...');
    
    const result = await this.callGeminiWithRetry(prompt, 3);
    
    console.log('✅ AI response received');
    const response = result.response.candidates[0].content.parts[0].text;
    console.log(`📄 Response length: ${response.length} characters`);
    
    console.log('🔄 STEP 4: Processing AI response and parsing JSON');
    
    try {
      console.log('🧹 Cleaning JSON response...');
      const cleanedResponse = this.cleanJsonResponse(response);
      console.log('✅ JSON response cleaned successfully');
      
      console.log('🔍 Parsing JSON data...');
      const parsedResult = JSON.parse(cleanedResponse);
      console.log('✅ JSON parsed successfully');
      
      console.log('🎉 ANALYSIS COMPLETED SUCCESSFULLY');
      console.log('=' .repeat(60));
      
      return parsedResult;
    } catch (error) {
      console.error('❌ STEP 4 FAILED: JSON Parse Error:', error.message);
      console.log('🔄 STEP 5: Attempting to regenerate response with simpler prompt');
      
      try {
        const retryPrompt = `${extractedText.substring(0, 5000)}\n\nProvide ONLY valid JSON response with no explanations. Fix any string formatting issues.`;
        console.log('🤖 Sending retry request to AI...');
        
        const retryResult = await this.callGeminiWithRetry(retryPrompt, 2);
        const retryResponse = retryResult.response.candidates[0].content.parts[0].text;
        
        console.log('✅ Retry response received');
        console.log('🧹 Cleaning retry response...');
        
        const cleanedRetry = this.cleanJsonResponse(retryResponse);
        const retryParsed = JSON.parse(cleanedRetry);
        
        console.log('✅ RETRY SUCCESSFUL - Analysis completed');
        console.log('=' .repeat(60));
        
        return retryParsed;
      } catch (retryError) {
        console.error('❌ STEP 5 FAILED: Retry failed:', retryError.message);
        console.log('🆘 STEP 6: Triggering fallback response mechanism');
        console.log('=' .repeat(60));
        
        const fallbackResult = this.createFallbackResponse(extractedText);
        console.log('✅ Fallback response created successfully');
        console.log('⚠️ ANALYSIS COMPLETED WITH FALLBACK METHOD');
        console.log('=' .repeat(60));
        
        return fallbackResult;
      }
    }
  }

  cleanJsonResponse(response) {
    // First, try to extract JSON from markdown code blocks
    let jsonText = response;
    
    // Remove markdown code blocks
    const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    }
    
    // Find the JSON object boundaries more precisely
    const startIndex = jsonText.indexOf('{');
    if (startIndex === -1) {
      throw new Error('No JSON object found in response');
    }
    
    // Find the matching closing brace
    let braceCount = 0;
    let endIndex = -1;
    
    for (let i = startIndex; i < jsonText.length; i++) {
      if (jsonText[i] === '{') {
        braceCount++;
      } else if (jsonText[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    if (endIndex === -1) {
      throw new Error('Incomplete JSON object - missing closing brace');
    }
    
    // Extract just the JSON part
    let cleaned = jsonText.substring(startIndex, endIndex + 1);
    
    // Fix common JSON issues
    cleaned = cleaned
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\/\/.*$/gm, '') // Remove comments
      .replace(/,\s*}/g, '}') // Fix trailing commas in objects
      .replace(/,\s*]/g, ']') // Fix trailing commas in arrays
      .replace(/\\n/g, '\\n') // Preserve escaped newlines
      .replace(/\\t/g, '\\t') // Preserve escaped tabs
      .replace(/([^\\])"/g, '$1"'); // Fix unescaped quotes
    
    return cleaned;
  }

  async callGeminiWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 API attempt ${attempt}/${maxRetries}`);
        
        const result = await this.model.generateContent(prompt);
        
        if (!result.response || !result.response.candidates || !result.response.candidates[0]) {
          throw new Error('Invalid response structure from Gemini API');
        }
        
        console.log(`✅ API call successful on attempt ${attempt}`);
        return result;
        
      } catch (error) {
        console.error(`❌ API attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          console.error('❌ All API retry attempts exhausted');
          throw new Error(`Gemini API failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  createFallbackResponse(extractedText) {
    // Extract basic info from text using regex patterns
    const accountMatch = extractedText.match(/Account.*?(\d{4,})/i);
    const balanceMatch = extractedText.match(/Balance.*?([\d,]+\.\d{2})/i);
    const dateMatch = extractedText.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
    
    return {
      accountOverview: {
        accountHolder: "Account Holder",
        accountNumber: accountMatch?.[1] || "****0000",
        bank: "Bank",
        statementPeriod: dateMatch?.[0] || "2024",
        currency: "NGN",
        openingBalance: 0,
        totalInflows: 0,
        totalOutflows: 0,
        closingBalance: parseFloat(balanceMatch?.[1]?.replace(/,/g, '')) || 0,
        netFlow: 0,
        totalTurnover: 0
      },
      inflowAnalysis: {
        totalInflows: 0,
        largestCredit: { amount: 0, description: "N/A", date: "N/A" },
        majorInflows: [],
        inflowCategories: []
      },
      outflowAnalysis: {
        totalOutflows: 0,
        expenditureBreakdown: []
      },
      gamblingAnalysis: {
        totalGamblingOutflows: 0,
        totalGamblingInflows: 0,
        netGamblingLoss: 0,
        gamblingPlatforms: [],
        significantTransactions: [],
        frequency: "Unknown",
        riskLevel: "Low"
      },
      loanAnalysis: {
        loansReceived: [],
        loansDisbursed: [],
        loanRepayments: [],
        totalLoansReceived: 0,
        totalLoansDisbursed: 0,
        totalRepayments: 0,
        outstandingLoans: 0
      },
      salaryAnalysis: {
        salaryTransactions: [],
        totalSalaryIncome: 0,
        averageMonthlySalary: 0,
        salaryFrequency: "Unknown",
        salaryGrowth: "Unknown",
        salaryToExpenseRatio: 0
      },
      riskAssessment: {
        gamblingRisk: "Low",
        loanRisk: "Low",
        cashFlowRisk: "Low",
        overallRiskLevel: "Low",
        riskFactors: ["JSON parsing failed - manual review required"]
      },
      insights: {
        keyFindings: ["Document processed with fallback method"],
        spendingPatterns: ["Manual analysis required"],
        recommendations: ["Review document manually for accurate analysis"],
        redFlags: ["Automated analysis incomplete"]
      },
      processingNote: "Analysis completed using fallback method due to parsing errors"
    };
  }

  async extractTextWithPythonParser(pdfPath) {
    try {
      console.log('🔄 STEP 1: Starting PDF to text conversion using integrated Python parser');
      console.log(`📄 Processing file: ${pdfPath}`);
      
      const { spawn } = await import('child_process');
      const path = await import('path');
      
      return new Promise((resolve, reject) => {
        const pythonScript = path.join(process.cwd(), 'intelli-parser', 'pdf_to_json.py');
        console.log(`🐍 Executing Python script: ${pythonScript}`);
        
        const python = spawn('python', [pythonScript, pdfPath]);
        
        let output = '';
        let error = '';
        
        python.stdout.on('data', (data) => {
          const message = data.toString();
          output += message;
          console.log(`📤 Python output: ${message.trim()}`);
        });
        
        python.stderr.on('data', (data) => {
          const message = data.toString();
          error += message;
          console.log(`⚠️ Python stderr: ${message.trim()}`);
        });
        
        python.on('close', (code) => {
          console.log(`🏁 Python process completed with exit code: ${code}`);
          
          if (code === 0) {
            console.log('✅ PDF parsing successful, reading generated CSV file');
            const csvPath = pdfPath.replace('.pdf', '.csv');
            console.log(`📊 Reading CSV file: ${csvPath}`);
            
            fs.readFile(csvPath, 'utf8')
              .then(csvData => {
                console.log(`📈 CSV file read successfully, ${csvData.length} characters`);
                
                // Clean up CSV file
                fs.unlink(csvPath).catch(() => {});
                console.log('🗑️ Temporary CSV file cleaned up');
                
                // Convert CSV to readable text format
                const lines = csvData.split('\n').filter(line => line.trim());
                const text = lines.map(line => line.replace(/^"|"$/g, '').replace(/""/g, '"')).join('\n');
                
                console.log(`📝 Extracted ${lines.length} lines of text data`);
                console.log(`📏 Total text length: ${text.length} characters`);
                console.log('✅ STEP 1 COMPLETED: PDF successfully converted to structured text');
                
                resolve(text);
              })
              .catch(err => {
                console.error('❌ Failed to read CSV file:', err.message);
                reject(err);
              });
          } else {
            console.error(`❌ Python parser failed with code ${code}`);
            console.error(`❌ Error details: ${error}`);
            reject(new Error(`Python parser failed: ${error}`));
          }
        });
      });
    } catch (error) {
      console.error('❌ STEP 1 FAILED: Python parser extraction error:', error.message);
      return 'Python parser extraction failed. Please check the PDF file.';
    }
  }



  async saveAnalysis(analysis, outputPath) {
    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
  }
}

// Usage
const analyzer = new BankStatementAnalyzer('bankstatement-468307');

// Example usage with report generation
async function main() {
  try {
    const analysis = await analyzer.processStatementFile('example-statement.json');
    await analyzer.saveAnalysis(analysis, 'analysis-output.json');
    
    // Generate HTML report
    const { ReportGenerator } = await import('./report-generator.js');
    await ReportGenerator.saveHTMLReport(analysis, 'comprehensive-report.html');
    
    console.log('Analysis completed and report generated');
    console.log('Gambling Risk:', analysis.gamblingAnalysis?.riskLevel);
    console.log('Loan Activity:', analysis.loanAnalysis?.totalLoansReceived);
    console.log('Salary Income:', analysis.salaryAnalysis?.totalSalaryIncome);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

export { BankStatementAnalyzer };