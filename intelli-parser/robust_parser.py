import pdfplumber
import csv
import sys
import os

def robust_pdf_to_csv(pdf_path, output_path=None):
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found: {pdf_path}")
        return False
        
    result = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Processing PDF with {len(pdf.pages)} pages...")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Processing page {page_num}...")
                
                # Extract text with error handling
                try:
                    page_text = page.extract_text()
                    if page_text:
                        lines = page_text.split('\n')
                        for line in lines:
                            line = line.strip()
                            if line:
                                result.append(line)
                except Exception as e:
                    print(f"Text extraction failed on page {page_num}: {e}")
                    # Try alternative extraction methods
                    try:
                        # Extract characters directly
                        chars = page.chars
                        if chars:
                            # Group characters by line
                            lines_dict = {}
                            for char in chars:
                                y = round(char['top'])
                                if y not in lines_dict:
                                    lines_dict[y] = []
                                lines_dict[y].append((char['x0'], char['text']))
                            
                            # Sort and combine characters
                            for y in sorted(lines_dict.keys()):
                                line_chars = sorted(lines_dict[y], key=lambda x: x[0])
                                line_text = ''.join([c[1] for c in line_chars]).strip()
                                if line_text:
                                    result.append(line_text)
                    except Exception as e2:
                        print(f"Alternative extraction also failed on page {page_num}: {e2}")
                        result.append(f"[Page {page_num} - extraction failed]")
                
                # Extract tables with error handling
                try:
                    tables = page.extract_tables()
                    if tables:
                        for table in tables:
                            for row in table:
                                if row and any(cell for cell in row if cell and str(cell).strip()):
                                    row_text = " | ".join([str(cell).strip() for cell in row if cell and str(cell).strip()])
                                    if row_text:
                                        result.append(row_text)
                except Exception as e:
                    print(f"Table extraction failed on page {page_num}: {e}")
        
        if not result:
            print("Warning: No text extracted from PDF")
            return False
        
        # Set output path
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
        print("Usage: python robust_parser.py <pdf_file> [output_csv_file]")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else pdf_file.replace('.pdf', '.csv')
    
    success = robust_pdf_to_csv(pdf_file, output_file)
    sys.exit(0 if success else 1)