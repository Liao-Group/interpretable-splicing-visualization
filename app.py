# Import libraries
from flask import Flask, request, jsonify, render_template
import pandas as pd
import json
import logging
from src.vis_data import get_vis_data

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Declare application
app = Flask(__name__)

# Configuration from environment variables for better security and flexibility
app.config['DEBUG'] = True

# Create datastore variable
class DataStore():
    def __init__(self):
        self.data = None

data = DataStore()

@app.route("/", methods=["GET", "POST"])
def homepage():
    try:
        # Default RNA sequence, replaced 'U' with 'T' and made uppercase.
        exon = request.form.get("exon", "GAGTCCCGCTTACCATTGCAUTUAAGAAAGCGGCATACGCCGCTAAGACCCTACTCTTCAGAATACCAG").upper().replace("U", "T")
        json_data = get_vis_data(exon=exon, json_file="data/exon.json", threshold=0.001)
        data.data = json_data
        return render_template("./index.html")
    except Exception as e:
        logging.error(f"Failed to process exon data: {e}")
        return jsonify({"error": "Failed to process data"}), 500

@app.route("/get-data", methods=["GET", "POST"])
def get_data():
    if data.data:
        return jsonify(data.data)
    else:
        return jsonify({"error": "Data not found"}), 404

if __name__ == "__main__":
    app.run(host='0.0.0.0')

