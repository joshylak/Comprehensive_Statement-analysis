import fs from 'fs/promises';
import { spawn } from 'child_process';

class DirectPDFAnalyzer {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  }

  async extractTextDirect(pdfPath) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', ['-c', `
import pdfplumber
import sys
try:
    with pdfplumber.open('${pdfPath}') as pdf:
        text = ""
        for page in pdf.pages:
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\\n"
            except:
                continue
    print(text)
except Exception as e:
    print(f"Error: {e}")
`]);

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve(output.trim());
        } else {
          reject(new Error(error || 'No text extracted'));
        }
      });
    });
  }

  async analyzeWithAI(extractedText) {
    const prompt = `Analyze this bank statement text and provide comprehensive analysis:

${extractedText}

Return ONLY valid JSON:
{
  "accountOverview": {
    "accountHolder": "string",
    "accountNumber": "string",
    "bank": "string", 
    "statementPeriod": "string",
    "currency": "string",
    "openingBalance": 0,
    "totalInflows": 0,
    "totalOutflows": 0,
    "closingBalance": 0,
    "netFlow": 0,
    "totalTurnover": 0
  },
  "insights": {
    "keyFindings": ["string"],
    "recommendations": ["string"]
  },
  "riskAssessment": {
    "overallRiskLevel": "Low"
  }
}`;

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
      })
    });

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  }

  async processStatement(pdfPath) {
    console.log('🚀 Direct PDF Analysis Starting...');
    
    try {
      console.log('📄 Extracting text...');
      const extractedText = await this.extractTextDirect(pdfPath);
      console.log(`✅ Extracted ${extractedText.length} characters`);
      
      console.log('🤖 Analyzing with AI...');
      const analysis = await this.analyzeWithAI(extractedText);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportId = `direct-${timestamp}`;
      
      await fs.writeFile(`reports/${reportId}.json`, JSON.stringify(analysis, null, 2));
      
      console.log('\n📊 DIRECT ANALYSIS COMPLETE');
      console.log(`Account: ${analysis.accountOverview.accountHolder}`);
      console.log(`Bank: ${analysis.accountOverview.bank}`);
      console.log(`Opening: ₦${analysis.accountOverview.openingBalance.toLocaleString()}`);
      console.log(`Closing: ₦${analysis.accountOverview.closingBalance.toLocaleString()}`);
      console.log(`Risk: ${analysis.riskAssessment.overallRiskLevel}`);
      console.log(`\n✅ Report: reports/${reportId}.json`);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

const analyzer = new DirectPDFAnalyzer();
analyzer.processStatement('Account_Statement_8234.pdf');