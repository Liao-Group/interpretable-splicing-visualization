const path = '/Users/zhushiwen/Documents/GitHub/interpretable-splicing-visualization/data/deciphering_rna_splicing_single_exon.csv';
const fs = require('fs');
const Papa = require('papaparse');

// Function that extract the information of a single feature of a single exon
function readSingleFeature(filePath) {
    // To read CSV file
    fs.readFile(filePath, 'utf8', (err, fileContent) => {
        if(err) {
            console.error('Error reading the file', err);
        }
        Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                let filteredData = results.data
                    .filter(row => row['incl_1'] > 0.001)
                    .map(row => ({
                        position: row['position'],
                        incl_1: row['incl_1']
                    }));
                if(filteredData.length === 0) {
                    console.log("No 'incl_1' values found greater than E-3.");
                }
                else {
                    // To implement formatting function
                    const formattedData = formatData(filteredData);
                    // To write to JSON file
                    const OutputPath = filePath.replace('.csv', '_filtered_sorted.json');
                    fs.writeFile(OutputPath, JSON.stringify(formattedData, null, 2), 'utf8', error => {
                        if(error) {console.error('Error writing JSON to file: ', error);}
                        else {console.log('Formatted data written successfully to ',OutputPath);}
                    })
                }
            }
        })
    })
}

// Function that transform the data to hierarchical format
function formatData(filteredData) {
    return {
        name: 'inclu_1',
        children: filteredData.map(row => ({
            name: 'position_${row.position}',
            value: row.incl_1
        }))
    };
}

// To run functions
readSingleFeature(path);
