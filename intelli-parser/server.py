from flask import Flask, request, jsonify, send_from_directory
from pdf_to_json import pdf_to_csv
import os
import tempfile

app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/convert', methods=['POST'])
def convert():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file'}), 400
    
    file = request.files['pdf']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    import uuid
    
    try:
        pdf_bytes = file.read()
        temp_filename = f"temp_{uuid.uuid4().hex}.pdf"
        
        with open(temp_filename, 'wb') as f:
            f.write(pdf_bytes)
        
        result = pdf_to_csv(temp_filename)
        
        # Clean up
        os.remove(temp_filename)
        
        # Convert result to CSV format for response
        csv_data = []
        for page_lines in result:
            csv_data.extend(page_lines)
        
        return jsonify({'csv_data': csv_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)