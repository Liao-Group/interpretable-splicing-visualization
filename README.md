# interpretable-splicing-visualization

To launch the webpage locally:
```
python3 app.py
```

# Requirements
In order to get inference from the model and run the vizualization application locally you will need to follow the steps bellow: 
### Setting Up virtual enviroment: 
- Download python version 3.10.4 

- Insid of the `interpretable-splicing-vizualization` create a virtual envoiroment with python version 3.10:
 ``` bash
    python3.10 -m venv myenv
```
For MacOS:
``` bash
source myenv/bin/activate  
```

For Windows:
```bash
myenv\Scripts\activate.bat
```

Then install the package requirements using `requirements.txt`:

```bash
pip3 install -r requirements.txt
```

### ViennaRNA Package installation:
- Download the latest ViennaRNA package
    - https://www.tbi.univie.ac.at/RNA/

- Move the .tar.gz file to the `interpretable-splicing-visualization` directory. 

- Access the ViannaRNA-< VERSION > file
``` bash
 % cd ViennaRNA-2.6.4
```
Follow the INSTALL instructions or follow the steps bellow: 

``` bash
./configure --disable-lto   
```
``` bash
make 
```

``` bash
make install
```