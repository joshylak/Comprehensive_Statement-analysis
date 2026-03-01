import pdfplumber
import csv
import sys

def extract_safe(pdf_path):
    result = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text()
                    if text:
                        result.extend(text.split('\n'))
                except:
                    result.append(f"[Page {i+1} failed]")
    except Exception as e:
        result.append(f"PDF error: {e}")
    
    # Filter and clean
    clean_result = []
    for line in result:
        line = str(line).strip()
        if line and line != "":
            clean_result.append(line)
    
    return clean_result

if __name__ == "__main__":
    pdf_file = sys.argv[1] if len(sys.argv) > 1 else "Account_Statement_8234.pdf"
    csv_file = pdf_file.replace('.pdf', '.csv')
    
    data = extract_safe(pdf_file)
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        for line in data:
            writer.writerow([line])
    
    print(f"Extracted {len(data)} lines")