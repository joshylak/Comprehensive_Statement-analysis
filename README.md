# Bank Statement Analyzer with Vertex AI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Google Cloud credentials:
   - Create a service account in Google Cloud Console
   - Download the JSON key file
   - Set environment variable: `GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json`

3. Update project ID in analyzer.js

## Usage

```javascript
import { BankStatementAnalyzer } from './analyzer.js';

const analyzer = new BankStatementAnalyzer('bankstatement-468307');
// For PDF files
const analysis = await analyzer.processStatementFile('statement.pdf');
// For JSON files
const analysis = await analyzer.processStatementFile('statement.json');
console.log(analysis);
```

## Input Format

**PDF Files**: Upload bank statement PDF directly
**JSON Files**: Should include:
- `accountInfo`: Account details and balances
- `transactions`: Array of transaction objects with date, description, amount, type, category