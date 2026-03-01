import pdfplumber
import csv
import sys
import os

def pdf_to_csv(pdf_path, output_path=None):
    """Extract text from PDF and save to CSV format"""
    try:
        if not os.path.exists(pdf_path):
            print(f"Error: PDF file not found: {pdf_path}")
            return False
            
        result = []
        
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Processing PDF with {len(pdf.pages)} pages...")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Processing page {page_num}...")
                
                # Extract all text from the page
                page_text = page.extract_text()
                
                if page_text:
                    # Split into lines and clean up
                    lines = page_text.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line:  # Only add non-empty lines
                            result.append(line)
                
                # Also try to extract tables
                try:
                    tables = page.extract_tables()
                    if tables:
                        print(f"Found {len(tables)} tables on page {page_num}")
                        for table in tables:
                            for row in table:
                                if row and any(cell for cell in row if cell and cell.strip()):
                                    # Join non-empty cells with separator
                                    row_text = " | ".join([str(cell).strip() for cell in row if cell and str(cell).strip()])
                                    if row_text:
                                        result.append(row_text)
                except Exception as table_error:
                    print(f"Warning: Could not extract tables from page {page_num}: {table_error}")
        
        if not result:
            print("Warning: No text extracted from PDF")
            return False
        
        # Set output path if not provided
        if not output_path:
            output_path = pdf_path.replace('.pdf', '.csv')
        
        # Write to CSV
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            for line in result:
                writer.writerow([line])
        
        print(f"Successfully extracted {len(result)} lines to {output_path}")
        return True
        
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_json.py <pdf_file> [output_csv_file]")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else pdf_file.replace('.pdf', '.csv')
    
    success = pdf_to_csv(pdf_file, output_file)
    sys.exit(0 if success else 1)