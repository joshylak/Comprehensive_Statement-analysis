import pdfplumber
import csv
import sys

def pdf_to_csv(pdf_path, output_path=None):
    result = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # Get table areas to exclude from text extraction
            tables = page.extract_tables()
            table_bboxes = []
            
            if tables:
                # Find table boundaries
                for table in page.find_tables():
                    table_bboxes.append(table.bbox)
            
            # Extract text outside of tables
            page_lines = []
            lines = {}
            
            for char in page.chars:
                # Skip characters that are inside table areas
                in_table = False
                for bbox in table_bboxes:
                    if (bbox[0] <= char['x0'] <= bbox[2] and 
                        bbox[1] <= char['top'] <= bbox[3]):
                        in_table = True
                        break
                
                if not in_table:
                    y = round(char['top'])
                    if y not in lines:
                        lines[y] = []
                    lines[y].append((char['x0'], char['text']))
            
            # Process non-table text
            for y in sorted(lines.keys()):
                line_chars = sorted(lines[y], key=lambda x: x[0])
                line_text = ''.join([char[1] for char in line_chars]).strip()
                if line_text:
                    page_lines.append(line_text)
            
            # Add table data
            if tables:
                for table in tables:
                    for row in table:
                        if row and any(cell for cell in row if cell):
                            row_text = " | ".join([cell.strip() if cell else "" for cell in row])
                            page_lines.append(row_text)
            
            result.append(page_lines)
    
    if output_path:
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            for page_lines in result:
                for line in page_lines:
                    writer.writerow([line])
    
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_json.py <pdf_file> [output_csv_file]")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else pdf_file.replace('.pdf', '.csv')
    
    try:
        pdf_to_csv(pdf_file, output_file)
        print(f"Successfully converted {pdf_file} to {output_file}")
    except Exception as e:
        print(f"Error: {e}")