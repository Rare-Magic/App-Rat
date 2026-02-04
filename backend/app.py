import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import INPUT_DIR, PROCESS_DIR, INPUT_CURRENT
from utils import (
    read_input_file,
    upload_summary,
    map_cmdb,
    map_gartner,
)

app = Flask(__name__)
CORS(app)

os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(PROCESS_DIR, exist_ok=True)


def save_upload(f):
    """Save uploaded file as input/current.<ext> (any filename allowed)."""
    ext = os.path.splitext(f.filename or '')[-1].lower()
    if ext not in ('.xlsx', '.xls', '.csv'):
        ext = '.xlsx'
    # Remove any existing current.*
    for e in ('.xlsx', '.xls', '.csv'):
        path = os.path.join(INPUT_DIR, INPUT_CURRENT + e)
        if os.path.isfile(path):
            os.remove(path)
    path = os.path.join(INPUT_DIR, INPUT_CURRENT + ext)
    f.save(path)
    return path


@app.route('/api/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    f = request.files['file']
    if not f or not f.filename:
        return jsonify({'error': 'No file selected'}), 400
    ext = os.path.splitext(f.filename)[-1].lower()
    if ext not in ('.xlsx', '.xls', '.csv'):
        return jsonify({'error': 'Allowed formats: .xlsx, .xls, .csv'}), 400
    try:
        path = save_upload(f)
        df = read_input_file(path)
        summary = upload_summary(df)
        return jsonify({'summary': summary})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/map-cmdb', methods=['POST'])
def api_map_cmdb():
    try:
        summary = map_cmdb()
        return jsonify({'summary': summary})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/map-gartner', methods=['POST'])
def api_map_gartner():
    try:
        summary = map_gartner()
        return jsonify({'summary': summary})
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
