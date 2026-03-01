import pdfplumber
import sys
import traceback

def debug_pdf(pdf_path):
    try:
        print(f"Opening PDF: {pdf_path}")
        with pdfplumber.open(pdf_path) as pdf:
            print(f"PDF has {len(pdf.pages)} pages")
            
            for i, page in enumerate(pdf.pages[:3]):  # Check first 3 pages
                print(f"\nPage {i+1}:")
                print(f"  Page size: {page.width} x {page.height}")
                
                # Try text extraction
                try:
                    text = page.extract_text()
                    if text:
                        print(f"  Text length: {len(text)} chars")
                        print(f"  First 100 chars: {text[:100]}")
                    else:
                        print("  No text found")
                except Exception as e:
                    print(f"  Text extraction error: {e}")
                
                # Try table extraction
                try:
                    tables = page.extract_tables()
                    print(f"  Tables found: {len(tables) if tables else 0}")
                    if tables:
                        for j, table in enumerate(tables[:2]):  # First 2 tables
                            print(f"    Table {j+1}: {len(table)} rows")
                except Exception as e:
                    print(f"  Table extraction error: {e}")
                    
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug-parser.py <pdf_file>")
        sys.exit(1)
    
    debug_pdf(sys.argv[1])