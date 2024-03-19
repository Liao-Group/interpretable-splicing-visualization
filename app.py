# Import libraries
from flask import (request, jsonify,
    Flask, flash, redirect, render_template, session, 
    abort, send_from_directory, send_file
)
import pandas as pd
import json
from src.get_viz_data import get_deciphering_rna_splicing_data

# Declare application
app = Flask(__name__)

# Create datastore variable
class DataStore():
    def __init__(self):
        self.data = None

data = DataStore()

@app.route("/",methods=["GET","POST"])
def homepage():
    exon = request.form.get(
        "exon", 
        "GCGGCACCTACTACAATGTCCCCCGCTGCATACACTCGGAGCCAATAGGGCGCCTATAGAGTGTAGTCCT"
    )
    exon = exon.upper().replace("U", "T")
    json_data = get_deciphering_rna_splicing_data(
        exons=[exon], json_file="data/deciphering_rna_splicing.json"
    )
    data.data = json_data
    return render_template("./index.html")

@app.route("/get-data",methods=["GET","POST"])
def get_data():
    return jsonify(data.data)

if __name__ == "__main__":
    app.run(debug=True)
