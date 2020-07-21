"""The BERT model.
Part of the code is from https://github.com/google-research/bert
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import copy
import json
import math
import six
import tensorflow as tf


class BertConfig(object):

	def __init__(self,
				 vocab_size,
				 hidden_size=768,
				 num_hidden_layers=12,
				 intermediate_size=3072,
				 hidden_act='gelu',
				 hidden_dropout_prob=0.1,
				 attention_probs_dropout_prob=0.1,
				 max_position_embeddings=512,
				 type_vocab_size=16,
				 initializer_range=0.02):

    self.vocab_size = vocab_size
    self.hidden_size = hidden_size
    self.num_hidden_layers = num_hidden_layers
    self.num_attention_heads = num_attention_heads
    self.hidden_act = hidden_act
    self.intermediate_size = intermediate_size
    self.hidden_dropout_prob = hidden_dropout_prob
    self.attention_probs_dropout_prob = attention_probs_dropout_prob
    self.max_position_embeddings = max_position_embeddings
    self.type_vocab_size = type_vocab_size
    self.initializer_range = initializer_range

    @classmethod
    def from_dict(cls, json_object):
    	"""Constructs a 'BertConfig' from python dictionary"""

    	config = BertConfig(vocab_size=None)

    	for (key, value) in six.iteritems(json_object):
    		config.__dict__[key] = value

    	return config

    @classmethod
    def from_json_file(cls, json_file, model_dropout):

    	with tf.gfile.GFile(json_file, "r") as reader:
    		text = reader.read()

    	config = cls.from_dict(json.loads(text))

    	if model_dropout != -1:
    		config.hidden_dropout_prob = model_dropout
    		config.attention_probs_dropout_prob = mdoel_dropout 

    	return config


   	def to_dict(self):
   		output = copy.deepcopy(self.__dict__)
   		return output

   	def to_json_string(self):
   		"""Serializes this instance to a json string."""
   		return json.dumps(self.to_dict(), indent=2, sort_keys=True) + "\n"


def bert_embedding(config,
				   is_training,
				   input_ids,
				   input_mask,
				   token_type_ids=None,
				   use_one_hot_embedding=True,
				   scope=None):


	config = copy.deepcopy(config)
	
	if not is_training:
    	config.hidden_dropout_prob = 0.0
    	config.attention_probs_dropout_prob = 0.0

	input_shape = get_shape_list(input_ids, expected_rank=2)

	batch_size = input_shape[0]
	seq_length = input_shape[1]

	if input_mask is None:
		input_mask = tf.ones(shape=[batch_size, seq_length], dtype=tf.int32)

	if token_type_ids is None:
		token_type_ids = tf.zeros(shape=[batch_size, seq_length], dtype=tf.int32)


	with tf.variable_scope("bert", scope, reuse=tf.AUTO_REUSE):
		with tf.variable_scope("embeddings"):
		# Perform embedding lookup on the word ids.
		# This is for the token embedding
			(embedding_output, embedding_table) = embedding_lookup(
            	input_ids=input_ids,
          		vocab_size=config.vocab_size,
          		embedding_size=config.hidden_size,
          		initializer_range=config.initializer_range,
          		word_embedding_name="word_embeddings",
          		use_one_hot_embeddings=use_one_hot_embeddings)



	# Add positional embeddings and token type embeddings,
	# then layer normalize the perform dropout

	embedding_output = embedding_postprocessor(
		input_tensor=embedding_output,
		use_token_type=True,
		token_type_ids=token_type_ids,
		token_type_vocab_size=config.type_vocab_size,
		token_type_embedding_name="token_type_embeddings",
		use_position_embeddings=True,
		position_embedding_name="position_embeddings",
		dropout_prob=config.hidden_dropout_prob)

	return embedding_output, embedding_table


def bert_attention(config,
				   is_training,
				   input_ids,
				   input_mask,
				   embedding_output,
				   scope=None):
	
	config = copy.deepcopy(config)

	if not is_training:
		config.hidden_dropout_prob = 0.0
		config.attention_probs_dropout_prob = 0.0

	with tf.variable_scope("bert", scope, reuse=tf.AUTO_REUSE):
		with tf.variable_scope("encoder"):
			# This converts a 2D mask of shape [batch_size, seq_length] to a 3D
			# mask fo shape [batch_size, seq_length, seq_length] which is used
			# for the attention score
			attention_mask = create_attention_mask_from_input_mask(
				input_ids, input_mask)

			all_encoder_layers = transformer_model(
				input_tensor=embedding_outputs,
				attention_mask=attention_mask,
				hidden_size=config.hidden_size,
				num_hidden_layers=config.num_hidden_layers,
				num_attention_heads=config.num_attention_heads,
				intermediate_size=config.intermediate_size,
				intermediate_act_fn=get_activation(config.hidden_act),
				hidden_dropout_prob=config.hidden_dropout_prob,
				attention_probs_dropout_prob=config.attention_probs_dropout_prob,
				initializer_range=config.initializer_range,
				do_return_all_layers=True)

		sequence_output = all_encoder_layers[-1]

    return sequence_output


def transformer_model(input_tensor,
					  attention_mask=None,
					  hidden_size=768,
					  num_hidden_layers=12,
					  num_attention_heads=12,
					  intermediate_size=3072,
					  intermediate_size=3027,
					  intermediate_act_fn=gelu,
					  hidden_dropout_prob=0.1,
					  attention_probs_dropout_prob=0.1,
					  initializer_range=0.02,
					  do_return_all_layers=False):

	"""
    attention_mask: (optional) int32 Tensor of shape [batch_size, seq_length,
      seq_length], with 1 for positions that can be attended to and 0 in
      positions that should not be.

    PS: you might wonder why mask is needed in self.attention:
    https://medium.com/analytics-vidhya/masking-in-transformers-self-attention-mechanism-bad3c9ec235c

    intermediate_size: int. The size of the "intermediate" (a.k.a., feed
      forward) layer.

    attention_probs_dropout_prob: float. Dropout probability of the attention
      probabilities.

    do_return_all_layers: Whether to also return all layers or just the final
      layer.
	"""

	if hidden_size % num_attention_heads != 0:
		raise ValueError(
			"The hidden size (%d) is not a multiple of the number of the \
			attention heads (%d).", %(hidden_size, num_attention_heads)
			)
	attention_head_size = int(hidden_size / num_attention_heads)
	input_shape = get_shape_list(input_tensor, expected_rank=3)
	batch_size = input_shape[0]
	seq_length = input_shape[1]
	input_width = input_shape[2]

	# The Transformer performs sum residuals on all layers so the input needs
	# to be the same as the hidden size.
	# Please refer to my Yang's notes about BERT and transformer

	if input_width != hidden_size:
		raise ValueError("The width of the input tensor (%d) != hidden size (%d)" %
            			(input_width, hidden_size))

	prev_output = reshape_to_matrix(input_tensor)

	all_layer_outputs = []

	for layer_idx in range(number_hidden_layers):
		with tf.variable_scope("layer_%d" % layer_idx):
			layer_input = prev_output

			with tf.variable_scope("attention"):
				attention_heads = []

				with tf.variable_scope("self"):
					attention_head = attention_layer(
						from_tensor=layer_input,
						to_tensor=layer_input,
						attention_mask=attention_mask,
						num_attention_heads=num_attention_heads,
						size_per_head=attention_head_size,
						attention_probs_dropout_prob=attention_probs_dropout_prob,
						initializer_range=initializer_range,
						do_return_2d_tensor=True,
						batch_size=batch_size,
						from_seq_length=seq_length,
						to_seq_length=seq_length)
					attention_heads.append(attention_head)

			attention_output = None

			if len(attention_heads)==1:
				attention_output = attention_heads[0]

			else:
				attention_output = tf.concat(attention_heads, axis=-1)


	# We keep the representation as a 2D tensor to avoid re-shaping it back and
	# forth from a 3D tensor to a 2D tensor. Re-shapes are normally free on
	# the GPU/CPU but may not be free on the TPU, so we want to minimize them to
	# help the optimizer.

  

def get_shape_list(tensor, expected_rank=None, name=None):
	"""Returns a list of the shape of tensor, preferring static dimensions.
	Args:
	tensor: A tf.Tensor object to find the shape of.
	expected_rank: (optional) int. The expected rank of `tensor`. If this is
	  specified and the `tensor` has a different rank, and exception will be
	  thrown.
	name: Optional name of the tensor for the error message.
	Returns:
	A list of dimensions of the shape of tensor. All static dimensions will
	be returned as python integers, and dynamic dimensions will be returned
	as tf.Tensor scalars.
	"""

	if name is None:
		name = tensor.name

	if expected_rank is not None:
		assert_rank(tensor, expected_rank, name)

	shape = tensor.shape.as_list()

	non_static_indexes = []


	for (index, dim) in enumerate(shape):
		if dim is None:
			non_static_indexes.append(index)

	if not non_static_indexes:
		return shape

	dyn_shape = tf.shape(tensor)
	for index in non_static_indexes:
		shape[index] = dyn_shape[index]
	return shape


def create_attention_mask_from_input_mask(from_tensor, to_mask):
	""" Create 3D attention mask from a 2D tensor mask

	Args: 
		from tensor: 2D or 3D Tensor of shape [batch_size, from_seq_len, ..]
		to_mask: int32 Tensor of shape [batch_size, to_seq_len].


	returns:
		float Tensor of shape [batch_size, from_seq_len, to_seq_len]
	"""

	from_shape = get_shape_list(from_tensor, expected_rank=[2, 3])
	batch_size = from_shape[0]
	from_seq_len = from_shape[1]
	
	to_shape = get_shape_list(to_mask, expected=2)
	to_seq_len = to_shape[1]

	to_mask = tf.cast(
		tf.reshape(to_mask, [batch_size, 1, to_seq_length]), tf.float32)

	broadcast_ones = tf.ones(
		shape=[batch_size, from_seq_length, 1], dtype=tf.float32)

	# Here we broadcast along two dimensions to create the mask.
	mask = broadcast_ones * to_mask

	return mask









