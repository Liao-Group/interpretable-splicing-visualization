# Import libraries
from flask import (request, jsonify,
    Flask, flash, redirect, render_template, session, 
    abort, send_from_directory, send_file
)
import pandas as pd
import json
from src.vis_data import get_vis_data

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
        "GAGUCCCGCUUACCAUUGCAUUUAAGAAAGCGGCCAUACGCCGCUAAGACCCUACUCUUCAGAAUACCAG"
    )
    exon = exon.upper().replace("U", "T")
    json_data = get_vis_data(
        exon=exon, json_file="data/exon.json", threshold=0.001
    )

    # with open('data/exon_s1.json', 'r') as file:
    #     file = file.read()
    # json_data = json.loads(file)
    data.data = json_data
    return render_template("./index.html")

@app.route("/get-data",methods=["GET","POST"])
def get_data():
    return jsonify(data.data)

if __name__ == "__main__":
    app.run(debug=False,host='0.0.0.0')