#The folder `db`
The folder `db` contains SQLite database generated when node server starts. The database files will be automatically created in this folder with the name `multivariateToolPersistentData.db`.
It contains all the data sets imported for LAMDA, each described by two specific tables:
* Table with the data: the name of the data table is the name given by the user during the upload (refered here as `{dataset_name}`). Table attributes are columns of the data and each record represent one row of the data set.
* Table with the metadata: the name of the metadata table is the name of the dataset followed by `_schema` (`{dataset_name}_schema`). This table contains these attributes with an example:<br>
``` 
        ref,name,type,group,group_type,displayOnLoad<br>
        1,y_rim,numeric,Tire properties,Characteristics,TRUE<br>
        2,ref,character,Ref,Id,FALSE<br>
        3,id,character,Id,Id,FALSE<br>
        4,lat_rating,numeric,Tire properties,Characteristics,TRUE<br>
        5,rad_rating,numeric,Tire properties,Characteristics,TRUE<br>
        6,mass_inside,numeric,Tire properties,Characteristics,TRUE<br>
        7,mass_outside,numeric,Tire properties,Characteristics,TRUE<br>
        8,radial_force_var_1H,numeric,Tire properties,Characteristics,TRUE<br>
        9,radial_force_var_PP,numeric,Tire properties,Characteristics,TRUE<br>
        10,rim_width,numeric,Rim  properties,Characteristics,FALSE<br>
        11,rim_diameter,numeric,Rim  properties,Characteristics,FALSE<br>
```

`ref`: id of the feature<br>
`name`: refers to the column name in the header of file_name.csv<br>
`type`: {character,numeric,integer,empty}<br>
`group`: a name to group multiple features<br>
`group_type`: {Id,Characteristics}<br>
`displayOnLoad`: TRUE (displayed by default), FALSE (available for display on demand)<br>

The position of the feature in this list determines the default position in the parallel coordinates view and in the feature selection dialogue box.<br>

The clustering results are added as new columns in both tables (data + metadata) the name of the column is given by the user in the clustering form.
