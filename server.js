import express from 'express';
import multer from 'multer';
import { BankStatementAnalyzer } from './analyzer.js';
import { ReportGenerator } from './report-generator.js';
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const analyzer = new BankStatementAnalyzer();

app.use(express.json());

app.post('/analyze-statement', upload.single('statement'), async (req, res) => {
  const startTime = Date.now();
  let reportId;
  
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 NEW ANALYSIS REQUEST RECEIVED');
    console.log('='.repeat(80));
    
    if (!req.file) {
      console.log('❌ Request validation failed: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    reportId = crypto.randomUUID();
    console.log(`🏷️ Report ID generated: ${reportId}`);
    console.log(`📁 Original filename: ${req.file.originalname}`);
    console.log(`💾 File size: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`📂 Temporary file path: ${req.file.path}`);
    
    let analysis;
    if (req.file.originalname.endsWith('.json')) {
      console.log('📊 Processing as JSON file');
      analysis = await analyzer.processStatementFile(req.file.path);
    } else if (req.file.originalname.endsWith('.pdf')) {
      console.log('📄 Processing as PDF file');
      analysis = await analyzer.processPDFStatement(req.file.path);
    } else {
      console.log('❌ Unsupported file type detected');
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.log(`⚠️ File cleanup warning: ${cleanupError.message}`);
      }
      return res.status(400).json({ error: 'Only PDF and JSON files are supported' });
    }
    
    console.log('📊 Creating report data structure...');
    const reportData = {
      reportId,
      timestamp: new Date().toISOString(),
      filename: req.file.originalname,
      status: 'completed',
      analysis
    };
    
    console.log(`💾 Saving report to: reports/${reportId}.json`);
    await fs.writeFile(`reports/${reportId}.json`, JSON.stringify(reportData, null, 2));
    
    console.log('🗑️ Cleaning up temporary file...');
    try {
      await fs.unlink(req.file.path);
      console.log('✅ Temporary file cleaned up successfully');
    } catch (cleanupError) {
      console.log(`⚠️ File cleanup warning: ${cleanupError.message}`);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Total processing time: ${processingTime}ms`);
    console.log('✅ ANALYSIS REQUEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80) + '\n');
    
    res.json({
      success: true,
      reportId,
      message: 'Statement analyzed successfully',
      reportPath: `reports/${reportId}.json`,
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('\n' + '❌'.repeat(20));
    console.error('❌ ANALYSIS REQUEST FAILED');
    console.error(`❌ Report ID: ${reportId || 'Not generated'}`);
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Processing time: ${processingTime}ms`);
    console.error('❌'.repeat(20) + '\n');
    
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message,
      reportId: reportId || null,
      processingTime: `${processingTime}ms`
    });
  }
});

app.post('/analyze-and-report', upload.single('statement'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const reportId = crypto.randomUUID();
    let analysis;
    if (req.file.originalname.endsWith('.json')) {
      analysis = await analyzer.processStatementFile(req.file.path);
    } else if (req.file.originalname.endsWith('.pdf')) {
      analysis = await analyzer.processPDFStatement(req.file.path);
    } else {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Only PDF and JSON files are supported' });
    }
    const reportHtml = ReportGenerator.generateHTMLReport(analysis);
    
    const reportData = {
      reportId,
      timestamp: new Date().toISOString(),
      filename: req.file.originalname,
      status: 'completed',
      analysis,
      htmlReport: reportHtml
    };
    
    await fs.writeFile(`reports/${reportId}.json`, JSON.stringify(reportData, null, 2));
    await fs.writeFile(`reports/${reportId}.html`, reportHtml);
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      reportId,
      message: 'Statement analyzed and report generated',
      reportPath: `reports/${reportId}.json`,
      htmlPath: `reports/${reportId}.html`
    });

  } catch (error) {
    res.status(500).json({ error: 'Analysis failed', message: error.message });
  }
});

app.get('/reports', async (req, res) => {
  try {
    const files = await fs.readdir('reports');
    const reports = files
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        reportId: path.basename(file, '.json'),
        filename: file
      }));
    
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

app.get('/reports/:reportId', async (req, res) => {
  try {
    const reportData = await fs.readFile(`reports/${req.params.reportId}.json`, 'utf8');
    res.json(JSON.parse(reportData));
  } catch (error) {
    res.status(404).json({ error: 'Report not found' });
  }
});

// PDF to JSON conversion endpoint
app.post('/convert-pdf', upload.single('pdf'), async (req, res) => {
  try {
    console.log('\n🔄 PDF CONVERSION REQUEST RECEIVED');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }
    
    console.log(`📄 Converting PDF: ${req.file.originalname}`);
    console.log(`📁 Temp file: ${req.file.path}`);
    
    const pythonScript = path.join(process.cwd(), 'intelli-parser', 'pdf_to_json.py');
    
    const csvData = await new Promise((resolve, reject) => {
      const python = spawn('python', [pythonScript, req.file.path]);
      
      let output = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          const csvPath = req.file.path.replace('.pdf', '.csv');
          fs.readFile(csvPath, 'utf8')
            .then(data => {
              fs.unlink(csvPath).catch((err) => {
                console.log(`⚠️ CSV cleanup warning: ${err.message}`);
              });
              const lines = data.split('\n').filter(line => line.trim());
              const csvArray = lines.map(line => line.replace(/^"|"$/g, '').replace(/""/g, '"'));
              resolve(csvArray);
            })
            .catch(reject);
        } else {
          reject(new Error(`Python conversion failed: ${error}`));
        }
      });
    });
    
    try {
      await fs.unlink(req.file.path);
      console.log('✅ Temporary PDF file cleaned up');
    } catch (cleanupError) {
      console.log(`⚠️ PDF cleanup warning: ${cleanupError.message}`);
    }
    
    console.log(`✅ PDF converted successfully: ${csvData.length} lines`);
    
    res.json({ 
      success: true,
      csv_data: csvData,
      message: 'PDF converted to structured data successfully'
    });
    
  } catch (error) {
    console.error('❌ PDF conversion failed:', error.message);
    res.status(500).json({ 
      error: 'PDF conversion failed', 
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Bank Statement Analyzer API running on port ${PORT}`);
  console.log(`Analysis endpoint: POST http://localhost:${PORT}/analyze-statement (PDF/JSON)`);
  console.log(`PDF conversion: POST http://localhost:${PORT}/convert-pdf`);
  console.log(`Reports list: GET http://localhost:${PORT}/reports`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please change the PORT in .env file or kill the existing process.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

process.on('SIGTERM', () => {
  console.log('Server shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Server shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});