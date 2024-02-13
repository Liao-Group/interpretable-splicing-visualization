const path = '/Users/zhushiwen/Documents/GitHub/interpretable-splicing-visualization/data/deciphering_rna_splicing_single_exon.csv';
const fs = require('fs');
const Papa = require('papaparse');

// Function that extract the information of a single feature of a single exon
function readSingleFeature(filePath, colName, callback) {
    // To read CSV file
    fs.readFile(filePath, 'utf8', (err, fileContent) => {
        if(err) {
            console.error('Error reading the file', err);
            return;
        }
        Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                let filteredData = results.data
                    .filter(row => row[colName] > 0.001)
                    .map(row => ({
                        position: row['position'],
                        value: row[colName]
                    }));
                callback(filteredData, colName);

                /***if(filteredData.length === 0) {
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
                }***/
            }
        })
    })
}

// Function that transform the data to hierarchical format
function formatData(filteredData, colName) {
    return {
        name: colName,
        children: filteredData.map(row => ({
            name: `position_${row.position}`,
            value: row.value
        }))
    };
}

// Function that iterate through different columns
function collectAllFeatures(filePath, cols, callback) {
    // To create the structure that holds the children features
    const allData = {
        name: 'Splicing Data',
        children: [
            {
                name: 'incl',
                children: []
            },
            {
                name: 'skip',
                children: []
            }
        ]
    };
    let colsProcessed = 0;
    cols.forEach(colName => {
        readSingleFeature(filePath, colName, (filteredData, name) => {
            // To call formatting function
            const formattedData = formatData(filteredData, colName);
            // To add features to different groups
            if (name.startsWith('incl')) {
                allData.children[0].children.push(formattedData);
            } else if (name.startsWith('skip')) {
                allData.children[1].children.push(formattedData);
            }

            colsProcessed++;
            if(colsProcessed === cols.length) {callback(allData);}
        })
    })
}

// Funtion that write the combined data to a JSON file
function writeToFile(data, outputPath) {
    fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8', error => {
        if(error) {
            console.error('Error writing JSON to file:', error);
        }
        else {
            console.log('Data written successfully to', outputPath);
        }
    });
}

// To run functions
const colsToProcess = ['incl_1', 'incl_2', 'incl_3', 'incl_4', 'incl_5', 'incl_6', 'incl_7', 
    'skip_7', 'skip_8', 'skip_9', 'skip_10', 'skip_11', 'skip_12', 'skip_s', 'skip_p'];

const outputPath = path.replace('.csv', '_all_features_formatted.json');

collectAllFeatures(path, colsToProcess, allData => {
    writeToFile(allData, outputPath);
});
