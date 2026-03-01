import pdfplumber
import csv
import sys
import os

def safe_extract_text(page):
    try:
        return page.extract_text() or ""
    except:
        try:
            chars = page.chars
            if not chars:
                return ""
            text_lines = {}
            for char in chars:
                y = round(char.get('top', 0))
                if y not in text_lines:
                    text_lines[y] = []
                text_lines[y].append((char.get('x0', 0), char.get('text', '')))
            
            result = []
            for y in sorted(text_lines.keys()):
                line_chars = sorted(text_lines[y], key=lambda x: x[0])
                line_text = ''.join([c[1] for c in line_chars]).strip()
                if line_text:
                    result.append(line_text)
            return '\n'.join(result)
        except:
            return ""

def extract_pdf_data(pdf_path):
    if not os.path.exists(pdf_path):
        return []
    
    result = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = safe_extract_text(page)
                if text:
                    for line in text.split('\n'):
                        line = line.strip()
                        if line:
                            result.append(line)
                else:
                    result.append(f"[Page {page_num} - no text extracted]")
    except Exception as e:
        result.append(f"Error processing PDF: {str(e)}")
    
    return result

def main():
    if len(sys.argv) < 2:
        print("Usage: python fixed_parser.py <pdf_file>")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    output_file = pdf_file.replace('.pdf', '.csv')
    
    data = extract_pdf_data(pdf_file)
    
    if data:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            for line in data:
                writer.writerow([line])
        print(f"Extracted {len(data)} lines to {output_file}")
    else:
        print("No data extracted")
        sys.exit(1)

if __name__ == "__main__":
    main()