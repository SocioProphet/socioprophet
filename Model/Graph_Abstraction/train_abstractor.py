""" train the abstractor"""
from training import get_basic_grad_fn, basic_validate
from training import BasicPipeline, BasicTrainer, MultiTaskPipeline, MultiTaskTrainer
import argparse
import json
import os, re
from os.path import join, exists
import pickle as pkl

from cytoolz import compose, concat

import torch
from torch import optim
from torch.nn import functional as F
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torch.utils.data import DataLoader

from model.copy_summ import CopySumm
from model.copy_summ_multiencoder import CopySummGAT, CopySummParagraph
from model.util import sequence_loss

from data.data import CnnDmDataset
from data.batcher import coll_fn, prepro_fn
from data.batcher import prepro_fn_copy_bert, convert_batch_copy_bert, batchify_fn_copy_bert
from data.batcher import convert_batch_copy, batchify_fn_copy
from data.batcher import BucketedGenerater
from data.abs_batcher import convert_batch_gat, batchify_fn_gat, prepro_fn_gat, coll_fn_gat
from data.abs_batcher import convert_batch_gat_bert, batchify_fn_gat_bert, prepro_fn_gat_bert
from training import multitask_validate

from utils import PAD, UNK, START, END
from utils import make_vocab, make_embedding
from transformers import RobertaTokenizer, BertTokenizer
import pickle

# NOTE: bucket size too large may sacrifice randomness,
#       to low may increase # of PAD tokens
BUCKET_SIZE = 6400



try:
    DATA_DIR = os.environ['DATA']
except KeyError:
    print('please use environment variable to specify data directories')



class MatchDataset(CnnDmDataset):
    """ single article sentence -> single abstract sentence
    (dataset created by greedily matching ROUGE)
    """
    def __init__(self, split):
        super().__init__(split, DATA_DIR)

    def __getitem__(self, i):
        js_data = super().__getitem__(i)
        art_sents, abs_sents, extracts = (
            js_data['article'], js_data['abstract'], js_data['extracted'])
        extracts = sorted(extracts)
        matched_arts = [art_sents[i] for i in extracts]
        return matched_arts, abs_sents[:len(extracts)]



class SumDataset(CnnDmDataset):
    """ single article sentence -> single abstract sentence
    (dataset created by greedily matching ROUGE)
    """
    def __init__(self, split):
        super().__init__(split, DATA_DIR)

    def __getitem__(self, i):
        js_data = super().__getitem__(i)
        art_sents, abs_sents = (
            js_data['article'], js_data['abstract'])
        art_sents = [' '.join(art_sents)]
        abs_sents = [' '.join(abs_sents)]
        return art_sents, abs_sents


class MatchDataset_all2all(CnnDmDataset):
    """ single article sentence -> single abstract sentence
    (dataset created by greedily matching ROUGE)
    """
    def __init__(self, split):
        super().__init__(split, DATA_DIR)

    def __getitem__(self, i):
        js_data = super().__getitem__(i)
        art_sents, abs_sents = (
            js_data['article'], js_data['abstract'])
        matched_arts = [' '.join(art_sents)]
        abs_sents = [' '.join(abs_sents)]
        return matched_arts, abs_sents


def configure_net(vocab_size,
				  emb_dim,
				  n_hidden,
				  bidirectional,
				  n_layer,
				  load_from=None,
				  bert=False,
				  max_art=800):

	

















