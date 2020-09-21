



We need to export the DATA_PATH. We specify the data path for the the data with the graphs.

export DATA=/Users/yangsun/Downloads/Graph_Aug_Data 



For training the abstractor with the ML model

python3 train_abstractor.py --batch 2 --bert --docgraph --path path_model_ml
